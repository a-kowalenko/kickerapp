import { useCallback, useEffect, useRef, useState } from "react";
import { useKicker } from "../../contexts/KickerContext";
import { useOwnPlayer } from "../../hooks/useOwnPlayer";
import supabase from "../../services/supabase";
import { upsertPlayerPresence } from "./apiPresence";

// ============================================================================
// CONSTANTS
// ============================================================================

// Heartbeat: How often to broadcast presence to the channel
const HEARTBEAT_INTERVAL = 30000; // 30 seconds

// Database: How often to update last_seen in the database (for offline fallback)
const DB_UPDATE_INTERVAL = 60000; // 60 seconds

// Grace period: How long to wait before removing a disconnected player
// Prevents flickering on page refresh
const LEAVE_GRACE_PERIOD = 10000; // 10 seconds

// Activity throttle: Minimum time between activity timestamp updates
const ACTIVITY_THROTTLE = 1000; // 1 second

// Reconnection settings
const RECONNECT_DELAY = 2000; // 2 seconds initial delay
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_BACKOFF_MULTIPLIER = 1.5;

// Activity events to listen for
const ACTIVITY_EVENTS = [
    "mousedown",
    "keydown",
    "scroll",
    "touchstart",
    "click",
];

/**
 * Discord-style presence hook.
 *
 * Key design principles:
 * 1. RECEIVER-CALCULATED STATE: We only broadcast timestamps (onlineAt, lastActivityAt).
 *    The receiving clients calculate "idle" status from lastActivityAt.
 * 2. SINGLE HEARTBEAT: One interval for presence sync, one for DB updates. No racing timers.
 * 3. TIMESTAMP-BASED GRACE PERIOD: Instead of setTimeout per player, we store leave timestamps
 *    and filter based on age during sync events.
 *
 * @returns {Object} - { onlinePlayers, isConnected, currentPlayerId, goOffline }
 */
export function useOnlinePresence() {
    const { currentKicker: kicker } = useKicker();
    const { data: currentPlayer } = useOwnPlayer();

    // State
    const [onlinePlayers, setOnlinePlayers] = useState(new Map());
    const [isConnected, setIsConnected] = useState(false);

    // Refs for tracking without re-renders
    const channelRef = useRef(null);
    const onlineAtRef = useRef(Date.now());
    const lastActivityRef = useRef(Date.now());
    const lastActivityUpdateRef = useRef(0);
    const heartbeatIntervalRef = useRef(null);
    const dbUpdateIntervalRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);
    const reconnectAttemptsRef = useRef(0);
    const isReconnectingRef = useRef(false);

    // Grace period: Map of playerId -> leaveTimestamp
    // Instead of setTimeout, we just record when they left and filter on sync
    const leaveTimestampsRef = useRef(new Map());

    // Callback refs to avoid re-subscribing channel
    const trackPresenceRef = useRef(null);
    const updateDatabaseRef = useRef(null);

    const currentPlayerId = currentPlayer?.id;
    const currentPlayerName = currentPlayer?.name;
    const currentPlayerAvatar = currentPlayer?.avatar;

    // ========================================================================
    // CORE FUNCTIONS
    // ========================================================================

    /**
     * Update activity timestamp (throttled).
     * Called on user interaction events.
     */
    const updateActivity = useCallback(() => {
        const now = Date.now();
        if (now - lastActivityUpdateRef.current >= ACTIVITY_THROTTLE) {
            lastActivityRef.current = now;
            lastActivityUpdateRef.current = now;
        }
    }, []);

    /**
     * Broadcast presence to the Supabase channel.
     * Only sends timestamps - no calculated status.
     */
    const trackPresence = useCallback(async () => {
        if (!channelRef.current || !currentPlayerId) return;

        try {
            await channelRef.current.track({
                player_id: currentPlayerId,
                player_name: currentPlayerName,
                player_avatar: currentPlayerAvatar,
                online_at: onlineAtRef.current,
                last_activity_at: lastActivityRef.current,
                updated_at: Date.now(),
            });
        } catch (err) {
            console.error("Error tracking presence:", err);
        }
    }, [currentPlayerId, currentPlayerName, currentPlayerAvatar]);

    /**
     * Update database with last_seen (for offline fallback display).
     */
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

    /**
     * Clean up channel and all related state.
     */
    const cleanupChannel = useCallback(async () => {
        // Clear reconnect timeout
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }

        isReconnectingRef.current = false;
        setIsConnected(false);

        // Clear grace period timestamps
        leaveTimestampsRef.current.clear();

        const channel = channelRef.current;
        channelRef.current = null;

        if (channel) {
            try {
                await channel.untrack();
            } catch (e) {
                // Ignore errors during cleanup
            }
            supabase.removeChannel(channel);
        }
    }, []);

    // ========================================================================
    // CHANNEL SUBSCRIPTION
    // ========================================================================

    useEffect(() => {
        if (!kicker || !currentPlayerId) {
            cleanupChannel();
            return;
        }

        const channelName = `online-presence-${kicker}`;

        const setupChannel = () => {
            // Clean up existing channel
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
                    const now = Date.now();

                    // Build new players map from presence state
                    const newPlayers = new Map();

                    Object.entries(state).forEach(([, presences]) => {
                        const presence = presences[presences.length - 1];
                        if (presence?.player_id) {
                            newPlayers.set(presence.player_id, {
                                player_id: presence.player_id,
                                player_name: presence.player_name,
                                player_avatar: presence.player_avatar,
                                online_at: presence.online_at,
                                last_activity_at: presence.last_activity_at,
                                updated_at: presence.updated_at,
                            });
                        }
                    });

                    setOnlinePlayers((prevPlayers) => {
                        const merged = new Map(newPlayers);

                        // Always keep own player to prevent self-flickering
                        if (currentPlayerId && !merged.has(currentPlayerId)) {
                            const ownData = prevPlayers.get(currentPlayerId);
                            if (ownData) {
                                merged.set(currentPlayerId, ownData);
                            }
                        }

                        // Keep players in grace period (left recently)
                        prevPlayers.forEach((playerData, playerId) => {
                            if (!merged.has(playerId)) {
                                const leaveTime =
                                    leaveTimestampsRef.current.get(playerId);
                                if (
                                    leaveTime &&
                                    now - leaveTime < LEAVE_GRACE_PERIOD
                                ) {
                                    // Still within grace period - keep them
                                    merged.set(playerId, playerData);
                                } else if (leaveTime) {
                                    // Grace period expired - remove from tracking
                                    leaveTimestampsRef.current.delete(playerId);
                                }
                            }
                        });

                        // Shallow compare to prevent unnecessary re-renders
                        if (mapsAreEqual(prevPlayers, merged)) {
                            return prevPlayers;
                        }

                        return merged;
                    });
                })
                .on("presence", { event: "leave" }, ({ leftPresences }) => {
                    // Record leave timestamp for grace period
                    leftPresences.forEach((presence) => {
                        if (
                            presence.player_id &&
                            presence.player_id !== currentPlayerId
                        ) {
                            leaveTimestampsRef.current.set(
                                presence.player_id,
                                Date.now(),
                            );
                        }
                    });
                })
                .on("presence", { event: "join" }, ({ newPresences }) => {
                    // Cancel grace period when player rejoins
                    newPresences.forEach((presence) => {
                        if (presence.player_id) {
                            leaveTimestampsRef.current.delete(
                                presence.player_id,
                            );
                        }
                    });
                })
                .subscribe(async (status) => {
                    if (status === "SUBSCRIBED") {
                        channelRef.current = channel;
                        setIsConnected(true);
                        isReconnectingRef.current = false;
                        reconnectAttemptsRef.current = 0;
                        onlineAtRef.current = Date.now();
                        lastActivityRef.current = Date.now();

                        // Initial presence track
                        if (trackPresenceRef.current) {
                            await trackPresenceRef.current();
                        }

                        // Initial database update
                        if (updateDatabaseRef.current) {
                            await updateDatabaseRef.current();
                        }
                    } else if (
                        status === "CLOSED" ||
                        status === "CHANNEL_ERROR"
                    ) {
                        setIsConnected(false);
                        channelRef.current = null;

                        // Attempt reconnection with exponential backoff
                        if (
                            !isReconnectingRef.current &&
                            reconnectAttemptsRef.current <
                                MAX_RECONNECT_ATTEMPTS
                        ) {
                            isReconnectingRef.current = true;
                            reconnectAttemptsRef.current++;

                            const delay =
                                RECONNECT_DELAY *
                                Math.pow(
                                    RECONNECT_BACKOFF_MULTIPLIER,
                                    reconnectAttemptsRef.current - 1,
                                );

                            reconnectTimeoutRef.current = setTimeout(() => {
                                isReconnectingRef.current = false;
                                setupChannel();
                            }, delay);
                        } else if (
                            reconnectAttemptsRef.current >=
                            MAX_RECONNECT_ATTEMPTS
                        ) {
                            // After max attempts, reset and try again after longer delay
                            reconnectTimeoutRef.current = setTimeout(() => {
                                reconnectAttemptsRef.current = 0;
                                isReconnectingRef.current = false;
                                setupChannel();
                            }, 30000);
                        }
                    }
                });
        };

        setupChannel();

        // Event handlers for cleanup and reconnection
        const handleBeforeUnload = () => {
            if (channelRef.current) {
                channelRef.current.unsubscribe();
            }
        };

        const handleLogout = () => {
            cleanupChannel();
        };

        const handleOnline = () => {
            if (!channelRef.current && !isReconnectingRef.current) {
                reconnectAttemptsRef.current = 0;
                setupChannel();
            }
        };

        const handleOffline = () => {
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
                reconnectTimeoutRef.current = null;
            }
            isReconnectingRef.current = false;
        };

        window.addEventListener("beforeunload", handleBeforeUnload);
        window.addEventListener("userLogout", handleLogout);
        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
            window.removeEventListener("userLogout", handleLogout);
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
            cleanupChannel();
        };
    }, [kicker, currentPlayerId, cleanupChannel]);

    // ========================================================================
    // HEARTBEAT INTERVALS
    // ========================================================================

    useEffect(() => {
        if (!isConnected) return;

        // Presence heartbeat - every 30 seconds
        heartbeatIntervalRef.current = setInterval(() => {
            if (trackPresenceRef.current) {
                trackPresenceRef.current();
            }
        }, HEARTBEAT_INTERVAL);

        // Database update - every 60 seconds
        dbUpdateIntervalRef.current = setInterval(() => {
            if (updateDatabaseRef.current) {
                updateDatabaseRef.current();
            }
        }, DB_UPDATE_INTERVAL);

        return () => {
            if (heartbeatIntervalRef.current) {
                clearInterval(heartbeatIntervalRef.current);
            }
            if (dbUpdateIntervalRef.current) {
                clearInterval(dbUpdateIntervalRef.current);
            }
        };
    }, [isConnected]);

    // ========================================================================
    // ACTIVITY LISTENERS
    // ========================================================================

    useEffect(() => {
        if (!isConnected) return;

        // Listen for activity events
        ACTIVITY_EVENTS.forEach((event) => {
            window.addEventListener(event, updateActivity, { passive: true });
        });

        // Visibility change: update activity when tab becomes visible
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                // Tab became visible - update activity and sync
                const now = Date.now();
                lastActivityRef.current = now;
                lastActivityUpdateRef.current = now;

                if (channelRef.current && trackPresenceRef.current) {
                    trackPresenceRef.current();
                }
            }
        };

        // Window focus: also update activity
        const handleWindowFocus = () => {
            const now = Date.now();
            lastActivityRef.current = now;
            lastActivityUpdateRef.current = now;

            if (channelRef.current && trackPresenceRef.current) {
                trackPresenceRef.current();
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        window.addEventListener("focus", handleWindowFocus);

        return () => {
            ACTIVITY_EVENTS.forEach((event) => {
                window.removeEventListener(event, updateActivity);
            });
            document.removeEventListener(
                "visibilitychange",
                handleVisibilityChange,
            );
            window.removeEventListener("focus", handleWindowFocus);
        };
    }, [isConnected, updateActivity]);

    // ========================================================================
    // CLEANUP ON UNMOUNT
    // ========================================================================

    useEffect(() => {
        return () => {
            if (currentPlayerId && kicker) {
                // Fire and forget - save last_seen on unmount
                upsertPlayerPresence(currentPlayerId, kicker).catch(() => {});
            }
        };
    }, [currentPlayerId, kicker]);

    return {
        onlinePlayers,
        isConnected,
        currentPlayerId,
        goOffline: cleanupChannel,
    };
}

/**
 * Shallow comparison of two Maps to prevent unnecessary re-renders.
 * Compares keys and a subset of values.
 */
function mapsAreEqual(map1, map2) {
    if (map1.size !== map2.size) return false;

    for (const [key, value1] of map1) {
        const value2 = map2.get(key);
        if (!value2) return false;

        // Compare key fields that affect rendering
        if (
            value1.player_id !== value2.player_id ||
            value1.player_name !== value2.player_name ||
            value1.player_avatar !== value2.player_avatar ||
            value1.last_activity_at !== value2.last_activity_at
        ) {
            return false;
        }
    }

    return true;
}

export default useOnlinePresence;
