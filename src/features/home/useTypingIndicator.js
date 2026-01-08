import { useCallback, useEffect, useRef, useState } from "react";
import { useKicker } from "../../contexts/KickerContext";
import { TYPING_TIMEOUT, TYPING_DEBOUNCE } from "../../utils/constants";
import { useOwnPlayer } from "../../hooks/useOwnPlayer";
import supabase from "../../services/supabase";

export function useTypingIndicator(currentPlayerId) {
    const { currentKicker: kicker } = useKicker();
    const { data: currentPlayer } = useOwnPlayer();
    const [publicTypers, setPublicTypers] = useState([]);
    const [whisperTypers, setWhisperTypers] = useState([]);
    const typingTimeoutRef = useRef(null);
    const lastTypingRef = useRef(null);
    const lastRecipientRef = useRef(null);
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
                const publicTypersList = [];
                const whisperTypersList = [];

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
                        const typer = {
                            player_id: presence.player_id,
                            player: { name: presence.player_name },
                            recipient_id: presence.recipient_id || null,
                        };

                        // Check if this is a whisper
                        if (presence.recipient_id) {
                            // Only show whisper typing if it's addressed to current user
                            if (
                                String(presence.recipient_id) ===
                                String(currentPlayerId)
                            ) {
                                whisperTypersList.push(typer);
                            }
                            // Ignore whispers to other users
                        } else {
                            // Public typing - show to everyone
                            publicTypersList.push(typer);
                        }
                    }
                });

                setPublicTypers(publicTypersList);
                setWhisperTypers(whisperTypersList);
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
    // recipientId: null for public message, playerId for whisper
    const onTyping = useCallback(
        async (recipientId = null) => {
            if (!kicker || !currentPlayerId || !currentPlayer?.name) return;

            // Check if recipient changed - if so, stop typing first and reset debounce
            if (lastRecipientRef.current !== recipientId) {
                // Untrack old typing status
                if (channelRef.current) {
                    try {
                        await channelRef.current.untrack();
                    } catch (err) {
                        // Ignore errors during untrack
                    }
                }
                lastRecipientRef.current = recipientId;
                lastTypingRef.current = null; // Reset debounce to allow immediate tracking
            }

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

            // Track presence with player info (including recipient for whispers)
            if (channelRef.current) {
                try {
                    await channelRef.current.track({
                        player_id: currentPlayerId,
                        player_name: currentPlayer.name,
                        typing_at: new Date().toISOString(),
                        recipient_id: recipientId || null,
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
        },
        [kicker, currentPlayerId, currentPlayer?.name]
    );

    // Function to call when user stops typing (e.g., sends message)
    const stopTyping = useCallback(async () => {
        if (!kicker || !currentPlayerId) return;

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // Reset recipient tracking
        lastRecipientRef.current = null;

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
        const parts = [];

        // Format public typing text
        if (publicTypers.length === 1) {
            parts.push(
                `${publicTypers[0].player?.name || "Someone"} is typing`
            );
        } else if (publicTypers.length === 2) {
            parts.push(
                `${publicTypers[0].player?.name} and ${publicTypers[1].player?.name} are typing`
            );
        } else if (publicTypers.length > 2) {
            parts.push("Multiple people are typing");
        }

        // Format whisper typing text (only whispers to current user)
        if (whisperTypers.length === 1) {
            parts.push(
                `${whisperTypers[0].player?.name || "Someone"} is whispering to you`
            );
        } else if (whisperTypers.length === 2) {
            parts.push(
                `${whisperTypers[0].player?.name} and ${whisperTypers[1].player?.name} are whispering to you`
            );
        } else if (whisperTypers.length > 2) {
            parts.push("Multiple people are whispering to you");
        }

        if (parts.length === 0) return null;
        return parts.join(" • ");
    })();

    return {
        typingUsers: [...publicTypers, ...whisperTypers],
        typingText,
        onTyping,
        stopTyping,
    };
}
