import { useCallback, useEffect, useRef, useState } from "react";
import { useKicker } from "../../contexts/KickerContext";
import { TYPING_TIMEOUT, TYPING_DEBOUNCE } from "../../utils/constants";
import { useOwnPlayer } from "../../hooks/useOwnPlayer";
import supabase from "../../services/supabase";

export function useTypingIndicator(currentPlayerId) {
    const { currentKicker: kicker } = useKicker();
    const { data: currentPlayer } = useOwnPlayer();
    const [typingUsers, setTypingUsers] = useState([]);
    const typingTimeoutRef = useRef(null);
    const lastTypingRef = useRef(null);
    const channelRef = useRef(null);

    // Subscribe to presence channel for typing indicators
    useEffect(() => {
        if (!kicker) return;

        const channelName = `typing-presence-${kicker}`;
        const channel = supabase.channel(channelName, {
            config: {
                presence: {
                    key: currentPlayerId ? String(currentPlayerId) : undefined,
                },
            },
        });

        channel
            .on("presence", { event: "sync" }, () => {
                const state = channel.presenceState();
                const typers = [];

                // Extract typing users from presence state
                Object.entries(state).forEach(([key, presences]) => {
                    // Filter out self
                    if (key === String(currentPlayerId)) return;

                    // Get the most recent presence for this user
                    const presence = presences[presences.length - 1];
                    if (
                        presence &&
                        presence.player_id &&
                        presence.player_name
                    ) {
                        typers.push({
                            player_id: presence.player_id,
                            player: { name: presence.player_name },
                        });
                    }
                });

                setTypingUsers(typers);
            })
            .subscribe(async (status) => {
                if (status === "SUBSCRIBED") {
                    channelRef.current = channel;
                }
            });

        return () => {
            if (channel) {
                supabase.removeChannel(channel);
            }
            channelRef.current = null;
        };
    }, [kicker, currentPlayerId]);

    // Function to call when user is typing
    const onTyping = useCallback(async () => {
        if (!kicker || !currentPlayerId || !currentPlayer?.name) return;

        // Debounce - only send based on TYPING_DEBOUNCE
        const now = Date.now();
        if (
            lastTypingRef.current &&
            now - lastTypingRef.current < TYPING_DEBOUNCE
        ) {
            // Still reset the timeout so typing continues
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
            typingTimeoutRef.current = setTimeout(async () => {
                if (channelRef.current) {
                    try {
                        await channelRef.current.untrack();
                    } catch (err) {
                        // Ignore errors during untrack
                    }
                }
            }, TYPING_TIMEOUT);
            return;
        }
        lastTypingRef.current = now;

        // Track presence with player info
        if (channelRef.current) {
            try {
                await channelRef.current.track({
                    player_id: currentPlayerId,
                    player_name: currentPlayer.name,
                    typing_at: new Date().toISOString(),
                });
            } catch (err) {
                console.error("Error tracking typing status:", err);
            }
        }

        // Clear typing status after timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }
        typingTimeoutRef.current = setTimeout(async () => {
            if (channelRef.current) {
                try {
                    await channelRef.current.untrack();
                } catch (err) {
                    // Ignore errors during untrack
                }
            }
        }, TYPING_TIMEOUT);
    }, [kicker, currentPlayerId, currentPlayer?.name]);

    // Function to call when user stops typing (e.g., sends message)
    const stopTyping = useCallback(async () => {
        if (!kicker || !currentPlayerId) return;

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        if (channelRef.current) {
            try {
                await channelRef.current.untrack();
            } catch (err) {
                // Ignore errors during untrack
            }
        }
    }, [kicker, currentPlayerId]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        };
    }, []);

    // Format typing indicator text (without "..." since we show animated dots)
    const typingText = (() => {
        if (typingUsers.length === 0) return null;
        if (typingUsers.length === 1) {
            return `${typingUsers[0].player?.name || "Someone"} is typing`;
        }
        if (typingUsers.length === 2) {
            return `${typingUsers[0].player?.name} and ${typingUsers[1].player?.name} are typing`;
        }
        return "Multiple people are typing";
    })();

    return {
        typingUsers,
        typingText,
        onTyping,
        stopTyping,
    };
}
