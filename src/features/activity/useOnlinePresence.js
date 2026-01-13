import { useCallback, useEffect, useRef, useState } from "react";
import { useKicker } from "../../contexts/KickerContext";
import { useOwnPlayer } from "../../hooks/useOwnPlayer";
import supabase from "../../services/supabase";
import { upsertPlayerPresence } from "./apiPresence";

// Constants
const HEARTBEAT_INTERVAL = 30000; // 30 seconds
const IDLE_THRESHOLD = 5 * 60 * 1000; // 5 minutes
const LEAVE_GRACE_PERIOD = 45000; // 45 seconds - grace period before removing player on disconnect
const VISIBILITY_IDLE_THRESHOLD = 30000; // 30 seconds - before showing as idle when tab hidden
const ACTIVITY_THROTTLE = 1000; // 1 second - throttle activity event updates
const DB_UPDATE_INTERVAL = 60000; // 60 seconds - update DB less frequently
const RECONNECT_DELAY = 2000; // 2 seconds before reconnect attempt
const MAX_RECONNECT_ATTEMPTS = 5; // Maximum reconnect attempts before giving up
const RECONNECT_BACKOFF_MULTIPLIER = 1.5; // Exponential backoff multiplier

// Activity events to listen for
const ACTIVITY_EVENTS = ["mousedown", "keydown", "scroll", "touchstart", "click"];

// Debounce delay for syncing presence after activity (leading-edge)
const ACTIVITY_SYNC_DELAY = 2000; // 2 seconds

/**
 * Hook to manage online presence for the current user
 * Tracks activity and broadcasts presence status via Supabase Presence
 *
 * @returns {Object} - { onlinePlayers, isConnected }
 * - onlinePlayers: Map of online players with their status
 * - isConnected: Whether the presence channel is connected
 */
export function useOnlinePresence() {
    const { currentKicker: kicker } = useKicker();
    const { data: currentPlayer } = useOwnPlayer();
    const [onlinePlayers, setOnlinePlayers] = useState(new Map());
    const [isConnected, setIsConnected] = useState(false);

    // Refs for tracking state without re-renders
    const channelRef = useRef(null);
    const lastActivityRef = useRef(Date.now());
    const lastActivityUpdateRef = useRef(0);
    const activitySyncTimeoutRef = useRef(null);
    const lastSyncedStatusRef = useRef(null);
    const heartbeatIntervalRef = useRef(null);
    const dbUpdateIntervalRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);
    const isReconnectingRef = useRef(false);
    // Store callbacks in refs to avoid re-subscribing the channel
    const trackPresenceRef = useRef(null);
    const updateDatabaseRef = useRef(null);
    // Track pending leave timeouts (for grace period)
    const pendingLeavesRef = useRef(new Map());
    // Track when tab was hidden (for idle threshold on visibility change)
    const tabHiddenSinceRef = useRef(null);
    const visibilityTimeoutRef = useRef(null);
    // Track reconnect attempts for exponential backoff
    const reconnectAttemptsRef = useRef(0);
    // Track last successful connection time
    const lastConnectedRef = useRef(null);

    const currentPlayerId = currentPlayer?.id;
    const currentPlayerName = currentPlayer?.name;
    const currentPlayerAvatar = currentPlayer?.avatar;

    // Calculate current status based on activity and visibility
    const calculateStatus = useCallback(() => {
        const timeSinceActivity = Date.now() - lastActivityRef.current;

        // Check if tab has been hidden for longer than VISIBILITY_IDLE_THRESHOLD (30s)
        const tabHiddenDuration = tabHiddenSinceRef.current
            ? Date.now() - tabHiddenSinceRef.current
            : 0;
        const isTabHiddenLongEnough =
            tabHiddenDuration > VISIBILITY_IDLE_THRESHOLD;

        if (timeSinceActivity > IDLE_THRESHOLD || isTabHiddenLongEnough) {
            return "idle";
        }
        return "active";
    }, []);

    // Update activity timestamp (throttled) and trigger presence sync if needed
    const updateActivity = useCallback(() => {
        const now = Date.now();
        if (now - lastActivityUpdateRef.current >= ACTIVITY_THROTTLE) {
            const wasIdle = lastSyncedStatusRef.current === "idle";
            lastActivityRef.current = now;
            lastActivityUpdateRef.current = now;

            // If we were idle, sync immediately (leading-edge) to show "active" faster
            // Otherwise, debounce to avoid excessive syncs during normal activity
            if (wasIdle && channelRef.current && trackPresenceRef.current) {
                // Clear any pending debounced sync
                if (activitySyncTimeoutRef.current) {
                    clearTimeout(activitySyncTimeoutRef.current);
                    activitySyncTimeoutRef.current = null;
                }
                // Sync immediately when transitioning from idle to active
                trackPresenceRef.current();
            } else if (channelRef.current && trackPresenceRef.current) {
                // Debounce sync during normal activity to avoid flooding
                if (!activitySyncTimeoutRef.current) {
                    activitySyncTimeoutRef.current = setTimeout(() => {
                        activitySyncTimeoutRef.current = null;
                        if (trackPresenceRef.current) {
                            trackPresenceRef.current();
                        }
                    }, ACTIVITY_SYNC_DELAY);
                }
            }
        }
    }, []);

    // Track presence to the channel
    const trackPresence = useCallback(async () => {
        if (!channelRef.current || !currentPlayerId) return;

        try {
            const status = calculateStatus();
            lastSyncedStatusRef.current = status;
            
            await channelRef.current.track({
                player_id: currentPlayerId,
                player_name: currentPlayerName,
                player_avatar: currentPlayerAvatar,
                status,
                last_activity: lastActivityRef.current,
                updated_at: new Date().toISOString(),
            });
        } catch (err) {
            console.error("Error tracking presence:", err);
        }
    }, [
        currentPlayerId,
        currentPlayerName,
        currentPlayerAvatar,
        calculateStatus,
    ]);

    // Update database with last_seen (less frequent than presence updates)
    const updateDatabase = useCallback(async () => {
        if (!currentPlayerId || !kicker) return;

        try {
            await upsertPlayerPresence(currentPlayerId, kicker);
        } catch (err) {
            // Silently fail - DB update is not critical
            console.error("Error updating presence in database:", err);
        }
    }, [currentPlayerId, kicker]);

    // Keep refs updated with latest callbacks
    useEffect(() => {
        trackPresenceRef.current = trackPresence;
        updateDatabaseRef.current = updateDatabase;
    }, [trackPresence, updateDatabase]);

    // Helper to cleanup channel - returns promise for awaiting
    const cleanupChannel = useCallback(async () => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }
        if (activitySyncTimeoutRef.current) {
            clearTimeout(activitySyncTimeoutRef.current);
            activitySyncTimeoutRef.current = null;
        }
        isReconnectingRef.current = false;
        lastSyncedStatusRef.current = null;
        setIsConnected(false);

        // Clear all pending leave timeouts
        pendingLeavesRef.current.forEach((timeoutId) =>
            clearTimeout(timeoutId)
        );
        pendingLeavesRef.current.clear();

        const channel = channelRef.current;
        channelRef.current = null;

        if (channel) {
            try {
                // Wait for untrack to complete before removing channel
                await channel.untrack();
            } catch (e) {
                // Ignore errors
            }
            supabase.removeChannel(channel);
        }
    }, []);

    // Subscribe to presence channel
    useEffect(() => {
        if (!kicker || !currentPlayerId) {
            // User logged out - cleanup any existing channel
            cleanupChannel();
            return;
        }

        const channelName = `online-presence-${kicker}`;

        const setupChannel = () => {
            // Clean up existing channel if any
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
            }

            const channel = supabase.channel(channelName, {
                config: {
                    presence: {
                        key: String(currentPlayerId),
                    },
                },
            });

            channel
                .on("presence", { event: "sync" }, () => {
                    const state = channel.presenceState();

                    const players = new Map();

                    // Extract online players from presence state
                    Object.entries(state).forEach(([, presences]) => {
                        // Get the most recent presence for this user
                        const presence = presences[presences.length - 1];
                        if (presence && presence.player_id) {
                            players.set(presence.player_id, {
                                player_id: presence.player_id,
                                player_name: presence.player_name,
                                player_avatar: presence.player_avatar,
                                status: presence.status,
                                last_activity: presence.last_activity,
                                updated_at: presence.updated_at,
                            });
                        }
                    });

                    // Merge with previous state - keep players that have pending leave timeouts
                    // This prevents flickering when a player is refreshing
                    setOnlinePlayers((prevPlayers) => {
                        const merged = new Map(players);

                        // IMPORTANT: Always keep own player in the list to prevent flickering
                        // The own player should always be considered online while connected
                        if (currentPlayerId && !merged.has(currentPlayerId)) {
                            const ownPlayerData =
                                prevPlayers.get(currentPlayerId);
                            if (ownPlayerData) {
                                merged.set(currentPlayerId, ownPlayerData);
                            }
                        }

                        // Keep players from previous state if they have a pending leave timeout
                        // and aren't in the new state (they're in grace period)
                        prevPlayers.forEach((playerData, playerId) => {
                            if (
                                !merged.has(playerId) &&
                                pendingLeavesRef.current.has(playerId)
                            ) {
                                // Keep this player - they're in the grace period
                                merged.set(playerId, playerData);
                            }
                        });

                        return merged;
                    });
                })
                .on("presence", { event: "leave" }, ({ leftPresences }) => {
                    // When a player leaves, start a timeout to remove them
                    // During this grace period, they stay in the list with current status
                    // This handles page refresh gracefully - the player will rejoin quickly
                    leftPresences.forEach((presence) => {
                        if (presence.player_id) {
                            const playerId = presence.player_id;

                            // NEVER start leave timeout for own player - prevents flickering
                            if (playerId === currentPlayerId) {
                                return;
                            }

                            // Clear any existing timeout for this player
                            if (pendingLeavesRef.current.has(playerId)) {
                                clearTimeout(
                                    pendingLeavesRef.current.get(playerId)
                                );
                            }

                            // Start a timeout - if they don't rejoin within grace period, remove them
                            // We keep them showing as their CURRENT status during this time
                            const timeoutId = setTimeout(() => {
                                // After grace period, remove from online list
                                setOnlinePlayers((prevPlayers) => {
                                    const newPlayers = new Map(prevPlayers);
                                    newPlayers.delete(playerId);
                                    return newPlayers;
                                });
                                pendingLeavesRef.current.delete(playerId);
                            }, LEAVE_GRACE_PERIOD);

                            pendingLeavesRef.current.set(playerId, timeoutId);
                        }
                    });
                })
                .on("presence", { event: "join" }, ({ newPresences }) => {
                    // When player joins, cancel any pending leave timeout
                    newPresences.forEach((presence) => {
                        if (presence.player_id) {
                            const playerId = presence.player_id;
                            if (pendingLeavesRef.current.has(playerId)) {
                                clearTimeout(
                                    pendingLeavesRef.current.get(playerId)
                                );
                                pendingLeavesRef.current.delete(playerId);
                            }
                        }
                    });
                })
                .subscribe(async (status) => {
                    if (status === "SUBSCRIBED") {
                        channelRef.current = channel;
                        setIsConnected(true);
                        isReconnectingRef.current = false;
                        reconnectAttemptsRef.current = 0; // Reset on successful connection
                        lastConnectedRef.current = Date.now();

                        // Initial presence track - use ref to get latest function
                        if (trackPresenceRef.current) {
                            await trackPresenceRef.current();
                        }

                        // Initial database update - use ref to get latest function
                        if (updateDatabaseRef.current) {
                            await updateDatabaseRef.current();
                        }
                    } else if (
                        status === "CLOSED" ||
                        status === "CHANNEL_ERROR"
                    ) {
                        // Don't clear onlinePlayers here - keep showing them until reconnect
                        setIsConnected(false);
                        channelRef.current = null;

                        // Attempt to reconnect with exponential backoff
                        if (
                            !isReconnectingRef.current &&
                            reconnectAttemptsRef.current <
                                MAX_RECONNECT_ATTEMPTS
                        ) {
                            isReconnectingRef.current = true;
                            reconnectAttemptsRef.current++;

                            // Calculate delay with exponential backoff
                            const delay =
                                RECONNECT_DELAY *
                                Math.pow(
                                    RECONNECT_BACKOFF_MULTIPLIER,
                                    reconnectAttemptsRef.current - 1
                                );

                            reconnectTimeoutRef.current = setTimeout(() => {
                                isReconnectingRef.current = false;
                                setupChannel();
                            }, delay);
                        } else if (
                            reconnectAttemptsRef.current >=
                            MAX_RECONNECT_ATTEMPTS
                        ) {
                            // After max attempts, try one more time after a longer delay
                            reconnectTimeoutRef.current = setTimeout(() => {
                                reconnectAttemptsRef.current = 0;
                                isReconnectingRef.current = false;
                                setupChannel();
                            }, 30000); // 30 second reset delay
                        }
                    }
                });
        };

        setupChannel();

        // Handle page unload - ensure we untrack before leaving
        const handleBeforeUnload = () => {
            if (channelRef.current) {
                // Synchronously unsubscribe - this may or may not complete
                channelRef.current.unsubscribe();
            }
        };
        window.addEventListener("beforeunload", handleBeforeUnload);

        // Handle explicit logout event
        const handleLogout = () => {
            cleanupChannel();
        };
        window.addEventListener("userLogout", handleLogout);

        // Handle network online/offline events for more robust reconnection
        const handleOnline = () => {
            // Network came back online - try to reconnect immediately
            if (!channelRef.current && !isReconnectingRef.current) {
                reconnectAttemptsRef.current = 0; // Reset attempts on network recovery
                setupChannel();
            }
        };

        const handleOffline = () => {
            // Network went offline - don't try to reconnect yet
            // The channel will handle the error and we'll reconnect when online
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
                reconnectTimeoutRef.current = null;
            }
            isReconnectingRef.current = false;
        };

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
            window.removeEventListener("userLogout", handleLogout);
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
            cleanupChannel();
        };
    }, [kicker, currentPlayerId, cleanupChannel]); // Only re-subscribe when kicker or playerId changes

    // Set up heartbeat interval
    useEffect(() => {
        if (!isConnected) return;

        // Heartbeat - update presence every 30 seconds
        heartbeatIntervalRef.current = setInterval(() => {
            trackPresence();
        }, HEARTBEAT_INTERVAL);

        // Database update - update last_seen every 60 seconds
        dbUpdateIntervalRef.current = setInterval(() => {
            updateDatabase();
        }, DB_UPDATE_INTERVAL);

        return () => {
            if (heartbeatIntervalRef.current) {
                clearInterval(heartbeatIntervalRef.current);
            }
            if (dbUpdateIntervalRef.current) {
                clearInterval(dbUpdateIntervalRef.current);
            }
        };
    }, [isConnected, trackPresence, updateDatabase]);

    // Listen to activity events
    useEffect(() => {
        if (!isConnected) return;

        // Add activity listeners
        ACTIVITY_EVENTS.forEach((event) => {
            window.addEventListener(event, updateActivity, { passive: true });
        });

        // Visibility change listener - handles tab becoming active/hidden with threshold
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                // Tab became visible - clear any pending idle timeout
                if (visibilityTimeoutRef.current) {
                    clearTimeout(visibilityTimeoutRef.current);
                    visibilityTimeoutRef.current = null;
                }
                tabHiddenSinceRef.current = null;

                // Update activity and force presence sync
                lastActivityRef.current = Date.now();

                // Check if channel is still connected
                if (channelRef.current) {
                    // Force re-track presence to sync with server (status will be "active")
                    trackPresence();
                }
            } else {
                // Tab became hidden - start the threshold timer
                tabHiddenSinceRef.current = Date.now();

                // After threshold, update presence status to idle
                visibilityTimeoutRef.current = setTimeout(() => {
                    if (channelRef.current && document.hidden) {
                        trackPresence(); // Will now calculate status as "idle"
                    }
                }, VISIBILITY_IDLE_THRESHOLD);
            }
        };
        document.addEventListener("visibilitychange", handleVisibilityChange);

        // Also handle window focus (in addition to visibility)
        const handleWindowFocus = () => {
            lastActivityRef.current = Date.now();
            if (channelRef.current) {
                trackPresence();
            }
        };
        window.addEventListener("focus", handleWindowFocus);

        return () => {
            ACTIVITY_EVENTS.forEach((event) => {
                window.removeEventListener(event, updateActivity);
            });
            document.removeEventListener(
                "visibilitychange",
                handleVisibilityChange
            );
            window.removeEventListener("focus", handleWindowFocus);
            // Clear visibility timeout on cleanup
            if (visibilityTimeoutRef.current) {
                clearTimeout(visibilityTimeoutRef.current);
                visibilityTimeoutRef.current = null;
            }
        };
    }, [isConnected, updateActivity, trackPresence]);

    // Update database on unmount (to save last_seen)
    useEffect(() => {
        return () => {
            if (currentPlayerId && kicker) {
                // Fire and forget - don't await on unmount
                upsertPlayerPresence(currentPlayerId, kicker).catch(() => {});
            }
        };
    }, [currentPlayerId, kicker]);

    return {
        onlinePlayers,
        isConnected,
        currentPlayerId,
        // Expose cleanup for logout
        goOffline: cleanupChannel,
    };
}

export default useOnlinePresence;
