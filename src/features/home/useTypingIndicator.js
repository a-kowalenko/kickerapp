import { useCallback, useEffect, useRef, useState } from "react";
import { useKicker } from "../../contexts/KickerContext";
import { CHAT_TYPING, TYPING_TIMEOUT } from "../../utils/constants";
import {
    setTypingStatus,
    clearTypingStatus,
    getTypingUsers,
} from "../../services/apiChat";
import supabase, { databaseSchema } from "../../services/supabase";

export function useTypingIndicator(currentPlayerId) {
    const { currentKicker: kicker } = useKicker();
    const [typingUsers, setTypingUsers] = useState([]);
    const typingTimeoutRef = useRef(null);
    const lastTypingRef = useRef(null);

    // Fetch initial typing users
    useEffect(() => {
        if (!kicker) return;

        async function fetchTypingUsers() {
            try {
                const data = await getTypingUsers(kicker);
                // Filter out stale typing indicators and current user
                const now = new Date();
                const activeTypers = data.filter((t) => {
                    const updatedAt = new Date(t.updated_at);
                    const isActive = now - updatedAt < TYPING_TIMEOUT;
                    const isNotSelf = t.player_id !== currentPlayerId;
                    return isActive && isNotSelf;
                });
                setTypingUsers(activeTypers);
            } catch (err) {
                console.error("Error fetching typing users:", err);
            }
        }

        fetchTypingUsers();
    }, [kicker, currentPlayerId]);

    // Subscribe to typing changes
    useEffect(() => {
        if (!kicker) return;

        const channelInstance = supabase
            .channel(`chat-typing-${kicker}`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: databaseSchema,
                    table: CHAT_TYPING,
                    filter: `kicker_id=eq.${kicker}`,
                },
                async () => {
                    // Refetch typing users on any change
                    try {
                        const data = await getTypingUsers(kicker);
                        const now = new Date();
                        const activeTypers = data.filter((t) => {
                            const updatedAt = new Date(t.updated_at);
                            const isActive = now - updatedAt < TYPING_TIMEOUT;
                            const isNotSelf = t.player_id !== currentPlayerId;
                            return isActive && isNotSelf;
                        });
                        setTypingUsers(activeTypers);
                    } catch (err) {
                        console.error("Error fetching typing users:", err);
                    }
                }
            )
            .subscribe();

        return () => {
            if (channelInstance) {
                supabase.removeChannel(channelInstance);
            }
        };
    }, [kicker, currentPlayerId]);

    // Periodically clean up stale typing indicators from local state
    useEffect(() => {
        const interval = setInterval(() => {
            setTypingUsers((prev) => {
                const now = new Date();
                return prev.filter((t) => {
                    const updatedAt = new Date(t.updated_at);
                    return now - updatedAt < TYPING_TIMEOUT;
                });
            });
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    // Function to call when user is typing
    const onTyping = useCallback(async () => {
        if (!kicker || !currentPlayerId) return;

        // Debounce - only send every second
        const now = Date.now();
        if (lastTypingRef.current && now - lastTypingRef.current < 1000) {
            return;
        }
        lastTypingRef.current = now;

        try {
            await setTypingStatus({
                playerId: currentPlayerId,
                kickerId: kicker,
            });
        } catch (err) {
            console.error("Error setting typing status:", err);
        }

        // Clear typing status after timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }
        typingTimeoutRef.current = setTimeout(async () => {
            try {
                await clearTypingStatus({
                    playerId: currentPlayerId,
                    kickerId: kicker,
                });
            } catch (err) {
                console.error("Error clearing typing status:", err);
            }
        }, TYPING_TIMEOUT);
    }, [kicker, currentPlayerId]);

    // Function to call when user stops typing (e.g., sends message)
    const stopTyping = useCallback(async () => {
        if (!kicker || !currentPlayerId) return;

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        try {
            await clearTypingStatus({
                playerId: currentPlayerId,
                kickerId: kicker,
            });
        } catch (err) {
            console.error("Error clearing typing status:", err);
        }
    }, [kicker, currentPlayerId]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
            // Clear typing status when component unmounts
            if (kicker && currentPlayerId) {
                clearTypingStatus({
                    playerId: currentPlayerId,
                    kickerId: kicker,
                }).catch(() => {});
            }
        };
    }, [kicker, currentPlayerId]);

    // Format typing indicator text
    const typingText = (() => {
        if (typingUsers.length === 0) return null;
        if (typingUsers.length === 1) {
            return `${typingUsers[0].player?.name || "Someone"} is typing...`;
        }
        if (typingUsers.length === 2) {
            return `${typingUsers[0].player?.name} and ${typingUsers[1].player?.name} are typing...`;
        }
        return "Several people are typing...";
    })();

    return {
        typingUsers,
        typingText,
        onTyping,
        stopTyping,
    };
}
