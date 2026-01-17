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

// UNIFIED GRACE PERIOD: How long to keep a player visible after they disappear
// This applies to BOTH explicit leave events AND missing from sync snapshots
// Prevents flickering during page refresh, context switches, and network hiccups
const GRACE_PERIOD_MS = 8000; // 8 seconds

// Activity throttle: Minimum time between activity timestamp updates
const ACTIVITY_THROTTLE = 1000; // 1 second

// Reconnection settings
const RECONNECT_DELAY = 2000; // 2 seconds initial delay
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_BACKOFF_MULTIPLIER = 1.5;

// Logout signal delay: Time to wait for logout packet to leave before cleanup
const LOGOUT_SIGNAL_DELAY = 500; // 500ms

// Recent offline TTL: How long to keep accurate timestamps for recently-offline players
// This bridges the gap between realtime presence and stale DB cache
const RECENT_OFFLINE_TTL = 10 * 60 * 1000; // 10 minutes

// Activity events to listen for
const ACTIVITY_EVENTS = [
    "mousedown",
    "keydown",
    "scroll",
    "touchstart",
    "click",
];

/**
 * Discord-style presence hook with rock-solid stability.
 *
 * Key design principles:
 * 1. RECEIVER-CALCULATED STATE: We only broadcast timestamps (onlineAt, lastActivityAt).
 *    The receiving clients calculate "idle" status from lastActivityAt.
 * 2. UNIFIED GRACE PERIOD: Players are never removed immediately. Whether they trigger
 *    a `leave` event or are simply missing from a `sync` snapshot, they enter a grace
 *    period. If they reappear within that period, removal is cancelled.
 * 3. OPTIMISTIC SELF-PRESENCE: Current user is always shown as online when connected,
 *    without waiting for server confirmation.
 * 4. INSTANT CLEANUP ON CONTEXT SWITCH: When kicker changes, all state is cleared
 *    immediately to prevent ghost users from previous context.
 *
 * @returns {Object} - { onlinePlayers, isConnected, currentPlayerId, goOffline }
 */
export function useOnlinePresence() {
    const { currentKicker: kicker } = useKicker();
    const { data: currentPlayer } = useOwnPlayer();

    // State
    const [onlinePlayers, setOnlinePlayers] = useState(new Map());
    const [isConnected, setIsConnected] = useState(false);

    // BRIDGING CACHE: Store final last_activity_at for recently-offline players
    // This provides accurate "last seen" timestamps before DB cache refreshes
    // Map of playerId -> { lastActivityAt: timestamp, cachedAt: timestamp }
    const [recentOfflineActivity, setRecentOfflineActivity] = useState(
        new Map(),
    );

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

    // UNIFIED GRACE PERIOD: Track when each player was last seen in presence
    // Map of playerId -> { data: playerData, lastSeenAt: timestamp }
    // Players not in current sync but within grace period are kept visible
    const playerCacheRef = useRef(new Map());

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
     * @param {Object} overrides - Optional properties to override/add to presence data
     */
    const trackPresence = useCallback(
        async (overrides = {}) => {
            if (!channelRef.current || !currentPlayerId) return;

            try {
                await channelRef.current.track({
                    player_id: currentPlayerId,
                    player_name: currentPlayerName,
                    player_avatar: currentPlayerAvatar,
                    online_at: onlineAtRef.current,
                    last_activity_at: lastActivityRef.current,
                    updated_at: Date.now(),
                    ...overrides,
                });
            } catch (err) {
                console.error("Error tracking presence:", err);
            }
        },
        [currentPlayerId, currentPlayerName, currentPlayerAvatar],
    );

    /**
     * Update database with last_seen (fire-and-forget, for offline fallback display).
     * This does NOT trigger any React state updates - it's purely a background DB write.
     */
    const updateDatabase = useCallback(async () => {
        if (!currentPlayerId || !kicker) return;

        try {
            // Fire and forget - no state updates, no awaiting in render path
            upsertPlayerPresence(currentPlayerId, kicker).catch(() => {});
        } catch (err) {
            // Silently fail - DB update is not critical
        }
    }, [currentPlayerId, kicker]);

    // Keep refs updated with latest callbacks
    useEffect(() => {
        trackPresenceRef.current = trackPresence;
        updateDatabaseRef.current = updateDatabase;
    }, [trackPresence, updateDatabase]);

    /**
     * Build optimistic self-presence data.
     */
    const buildSelfPresence = useCallback(() => {
        if (!currentPlayerId || !currentPlayerName) return null;
        return {
            player_id: currentPlayerId,
            player_name: currentPlayerName,
            player_avatar: currentPlayerAvatar,
            online_at: onlineAtRef.current,
            last_activity_at: lastActivityRef.current,
            updated_at: Date.now(),
        };
    }, [currentPlayerId, currentPlayerName, currentPlayerAvatar]);

    /**
     * Clean up channel and all related state.
     */
    const cleanupChannel = useCallback(async () => {
        // Clear all timers
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }
        if (heartbeatIntervalRef.current) {
            clearInterval(heartbeatIntervalRef.current);
            heartbeatIntervalRef.current = null;
        }
        if (dbUpdateIntervalRef.current) {
            clearInterval(dbUpdateIntervalRef.current);
            dbUpdateIntervalRef.current = null;
        }

        isReconnectingRef.current = false;
        setIsConnected(false);

        // Clear player cache
        playerCacheRef.current.clear();

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
    // CHANNEL SUBSCRIPTION (Single useEffect handles everything)
    // ========================================================================

    useEffect(() => {
        // No kicker or player - cleanup and return
        if (!kicker || !currentPlayerId) {
            cleanupChannel();
            setOnlinePlayers(new Map());
            return;
        }

        // Clear state immediately when starting fresh subscription
        // This prevents ghost users from previous context
        setOnlinePlayers(new Map());
        setIsConnected(false);
        playerCacheRef.current.clear();

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
                    const now = Date.now();

                    // Build set of players currently in presence state
                    const currentPresenceIds = new Set();
                    const freshPlayers = new Map();

                    Object.entries(state).forEach(([, presences]) => {
                        const presence = presences[presences.length - 1];
                        if (presence?.player_id) {
                            const playerId = presence.player_id;

                            // INSTANT LOGOUT: If player has is_logged_out flag,
                            // remove them immediately and skip adding to freshPlayers
                            if (presence.is_logged_out) {
                                // Store their final activity timestamp before removing
                                if (presence.last_activity_at) {
                                    setRecentOfflineActivity((prev) => {
                                        const updated = new Map(prev);
                                        updated.set(playerId, {
                                            lastActivityAt:
                                                presence.last_activity_at,
                                            cachedAt: now,
                                        });
                                        return updated;
                                    });
                                }
                                playerCacheRef.current.delete(playerId);
                                return; // Skip this player entirely
                            }

                            currentPresenceIds.add(playerId);

                            const playerData = {
                                player_id: playerId,
                                player_name: presence.player_name,
                                player_avatar: presence.player_avatar,
                                online_at: presence.online_at,
                                last_activity_at: presence.last_activity_at,
                                updated_at: presence.updated_at,
                            };

                            freshPlayers.set(playerId, playerData);

                            // Update cache: player is confirmed present
                            playerCacheRef.current.set(playerId, {
                                data: playerData,
                                lastSeenAt: now,
                            });
                        }
                    });

                    // Build final map with grace period logic
                    const merged = new Map(freshPlayers);

                    // UNIFIED GRACE PERIOD: Keep players who were recently seen
                    // but are missing from this sync snapshot
                    const newlyOffline = [];
                    playerCacheRef.current.forEach((cached, playerId) => {
                        if (!merged.has(playerId)) {
                            const timeSinceLastSeen = now - cached.lastSeenAt;
                            if (timeSinceLastSeen < GRACE_PERIOD_MS) {
                                // Still within grace period - keep them visible
                                merged.set(playerId, cached.data);
                            } else {
                                // Grace period expired - remove from cache
                                // Store their final activity timestamp for bridging cache
                                if (cached.data?.last_activity_at) {
                                    newlyOffline.push({
                                        playerId,
                                        lastActivityAt:
                                            cached.data.last_activity_at,
                                    });
                                }
                                playerCacheRef.current.delete(playerId);
                            }
                        }
                    });

                    // Update recentOfflineActivity with newly offline players
                    if (newlyOffline.length > 0) {
                        setRecentOfflineActivity((prev) => {
                            const updated = new Map(prev);
                            newlyOffline.forEach(
                                ({ playerId, lastActivityAt }) => {
                                    updated.set(playerId, {
                                        lastActivityAt,
                                        cachedAt: now,
                                    });
                                },
                            );
                            // Clean up entries older than RECENT_OFFLINE_TTL
                            updated.forEach((entry, pid) => {
                                if (now - entry.cachedAt > RECENT_OFFLINE_TTL) {
                                    updated.delete(pid);
                                }
                            });
                            return updated;
                        });
                    }

                    // OPTIMISTIC SELF-PRESENCE: Always ensure current user is visible
                    if (currentPlayerId && !merged.has(currentPlayerId)) {
                        const cachedSelf =
                            playerCacheRef.current.get(currentPlayerId);
                        if (cachedSelf) {
                            merged.set(currentPlayerId, cachedSelf.data);
                        } else {
                            // Build fresh self-presence
                            const selfData = {
                                player_id: currentPlayerId,
                                player_name: currentPlayerName,
                                player_avatar: currentPlayerAvatar,
                                online_at: onlineAtRef.current,
                                last_activity_at: lastActivityRef.current,
                                updated_at: now,
                            };
                            merged.set(currentPlayerId, selfData);
                            playerCacheRef.current.set(currentPlayerId, {
                                data: selfData,
                                lastSeenAt: now,
                            });
                        }
                    }

                    setOnlinePlayers((prevPlayers) => {
                        // Shallow compare to prevent unnecessary re-renders
                        if (mapsAreEqual(prevPlayers, merged)) {
                            return prevPlayers;
                        }
                        return merged;
                    });
                })
                .on("presence", { event: "leave" }, ({ leftPresences }) => {
                    // When players leave, update their lastSeenAt (they enter grace period)
                    // The next sync will handle removal after grace period expires
                    const now = Date.now();
                    leftPresences.forEach((presence) => {
                        if (
                            presence.player_id &&
                            presence.player_id !== currentPlayerId
                        ) {
                            const existing = playerCacheRef.current.get(
                                presence.player_id,
                            );
                            if (existing) {
                                // Mark as leaving now - grace period starts
                                playerCacheRef.current.set(presence.player_id, {
                                    ...existing,
                                    lastSeenAt: now,
                                });
                            }
                        }
                    });
                })
                .on("presence", { event: "join" }, ({ newPresences }) => {
                    // When players join, ensure they're fresh in cache
                    const now = Date.now();
                    newPresences.forEach((presence) => {
                        if (presence.player_id) {
                            const playerData = {
                                player_id: presence.player_id,
                                player_name: presence.player_name,
                                player_avatar: presence.player_avatar,
                                online_at: presence.online_at,
                                last_activity_at: presence.last_activity_at,
                                updated_at: presence.updated_at,
                            };
                            playerCacheRef.current.set(presence.player_id, {
                                data: playerData,
                                lastSeenAt: now,
                            });
                        }
                    });
                })
                .subscribe(async (status) => {
                    if (status === "SUBSCRIBED") {
                        channelRef.current = channel;
                        isReconnectingRef.current = false;
                        reconnectAttemptsRef.current = 0;
                        onlineAtRef.current = Date.now();
                        lastActivityRef.current = Date.now();

                        // OPTIMISTIC: Inject self IMMEDIATELY before any server sync
                        const selfData = {
                            player_id: currentPlayerId,
                            player_name: currentPlayerName,
                            player_avatar: currentPlayerAvatar,
                            online_at: onlineAtRef.current,
                            last_activity_at: lastActivityRef.current,
                            updated_at: Date.now(),
                        };

                        // Add to cache
                        playerCacheRef.current.set(currentPlayerId, {
                            data: selfData,
                            lastSeenAt: Date.now(),
                        });

                        // Add to visible players
                        setOnlinePlayers((prev) => {
                            const updated = new Map(prev);
                            updated.set(currentPlayerId, selfData);
                            return updated;
                        });

                        // Set connected AFTER optimistic injection
                        setIsConnected(true);

                        // Initial presence track (sends to server)
                        if (trackPresenceRef.current) {
                            await trackPresenceRef.current();
                        }

                        // Initial database update (fire and forget)
                        if (updateDatabaseRef.current) {
                            updateDatabaseRef.current();
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

        // Event handlers
        const handleBeforeUnload = () => {
            if (channelRef.current) {
                channelRef.current.unsubscribe();
            }
        };

        const handleLogout = async () => {
            // ROBUST INSTANT LOGOUT:
            // 1. Update DB with final timestamp (ensures accuracy even if realtime fails)
            // 2. Send logout signal with is_logged_out: true
            // 3. Wait briefly for packet to propagate
            // 4. Then cleanup

            // Step 1: Update DB first (fire and wait)
            if (currentPlayerId && kicker) {
                try {
                    await upsertPlayerPresence(currentPlayerId, kicker);
                } catch (e) {
                    // DB update failed, but continue with logout
                }
            }

            // Step 2 & 3: Send logout signal and wait for propagation
            if (channelRef.current && currentPlayerId) {
                try {
                    // Use Promise.race to ensure we don't wait forever
                    await Promise.race([
                        channelRef.current.track({
                            player_id: currentPlayerId,
                            player_name: currentPlayerName,
                            player_avatar: currentPlayerAvatar,
                            online_at: onlineAtRef.current,
                            last_activity_at: lastActivityRef.current,
                            updated_at: Date.now(),
                            is_logged_out: true,
                        }),
                        new Promise((resolve) =>
                            setTimeout(resolve, LOGOUT_SIGNAL_DELAY),
                        ),
                    ]);
                    // Additional wait for propagation
                    await new Promise((resolve) =>
                        setTimeout(resolve, LOGOUT_SIGNAL_DELAY),
                    );
                } catch (e) {
                    // Ignore errors - we're logging out anyway
                }
            }

            // Step 4: Cleanup
            cleanupChannel();
            setOnlinePlayers(new Map());
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

        // Cleanup function - runs on kicker change or unmount
        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
            window.removeEventListener("userLogout", handleLogout);
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
            cleanupChannel();
        };
    }, [
        kicker,
        currentPlayerId,
        currentPlayerName,
        currentPlayerAvatar,
        cleanupChannel,
        buildSelfPresence,
    ]);

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
        recentOfflineActivity,
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
