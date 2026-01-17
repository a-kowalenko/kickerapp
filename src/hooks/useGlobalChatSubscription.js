import { useEffect, useRef } from "react";
import { useQueryClient } from "react-query";
import { useKicker } from "../contexts/KickerContext";
import { useOwnPlayer } from "./useOwnPlayer";
import supabase, { databaseSchema } from "../services/supabase";
import { CHAT_MESSAGES } from "../utils/constants";

/**
 * Global subscription hook for chat messages.
 * This hook maintains a real-time subscription to chat message inserts
 * regardless of whether the chat page is mounted.
 *
 * When a new message arrives FROM ANOTHER USER, it invalidates the chat messages
 * and read status queries so that useUnreadChatCount computes fresh values for the badge.
 * Own messages are ignored to prevent unnecessary badge updates.
 *
 * This should be mounted at a high level (e.g., AppLayout) to ensure
 * the subscription stays active during navigation.
 */
export function useGlobalChatSubscription() {
    const { currentKicker: kicker } = useKicker();
    const { data: currentPlayer } = useOwnPlayer();
    const queryClient = useQueryClient();

    // Use ref to avoid re-subscribing when currentPlayer changes
    const currentPlayerIdRef = useRef(null);
    currentPlayerIdRef.current = currentPlayer?.id;

    useEffect(() => {
        if (!kicker) return;

        const channelInstance = supabase
            .channel(`global-chat-badge-${kicker}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: databaseSchema,
                    table: CHAT_MESSAGES,
                    filter: `kicker_id=eq.${kicker}`,
                },
                (payload) => {
                    // Skip invalidation for own messages - they don't affect unread count
                    const messagePlayerId = payload.new?.player_id;
                    if (
                        currentPlayerIdRef.current &&
                        messagePlayerId === currentPlayerIdRef.current
                    ) {
                        return;
                    }

                    // Invalidate queries to trigger re-fetch for badge calculation
                    // This ensures useUnreadChatCount gets fresh data
                    queryClient.invalidateQueries({
                        queryKey: [CHAT_MESSAGES, kicker],
                        // Partial match - will match [CHAT_MESSAGES, kicker, playerId]
                        exact: false,
                    });
                    queryClient.invalidateQueries({
                        queryKey: ["chat-read-status", kicker],
                        exact: false,
                    });
                    // Also invalidate unread count query directly
                    queryClient.invalidateQueries({
                        queryKey: ["unread-chat-count", kicker],
                        exact: false,
                    });
                },
            )
            .subscribe();

        return () => {
            if (channelInstance) {
                supabase.removeChannel(channelInstance);
            }
        };
    }, [kicker, queryClient]);
}

export default useGlobalChatSubscription;
