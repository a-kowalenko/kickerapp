import { useMemo, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useQueryClient } from "react-query";
import { useChatMessages } from "../home/useChatMessages";
import { useChatReadStatus } from "../../hooks/useChatReadStatus";
import { useKicker } from "../../contexts/KickerContext";
import { useOwnPlayer } from "../../hooks/useOwnPlayer";
import { useChatConnection } from "../../contexts/ChatContext";
import { CHAT_MESSAGES } from "../../utils/constants";

/**
 * Hook to get the count of unread chat messages for the current kicker
 * Used for notification badges in the mobile navigation
 */
export function useUnreadChatCount() {
    const { currentKicker } = useKicker();
    const { data: currentPlayer } = useOwnPlayer();
    const currentPlayerId = currentPlayer?.id;
    const { messages, isLoading: isLoadingMessages } = useChatMessages();
    const { lastReadAt, isLoading: isLoadingReadStatus } =
        useChatReadStatus(currentKicker);
    const location = useLocation();
    const queryClient = useQueryClient();
    const { subscribeToInserts } = useChatConnection();

    // Subscribe to realtime inserts to refetch when new messages arrive
    useEffect(() => {
        const unsubscribe = subscribeToInserts(() => {
            // Invalidate messages query to get fresh count
            queryClient.invalidateQueries([
                CHAT_MESSAGES,
                currentKicker,
                currentPlayerId,
            ]);
        });
        return unsubscribe;
    }, [subscribeToInserts, queryClient, currentKicker, currentPlayerId]);

    const unreadCount = useMemo(() => {
        // Don't show badge if user is currently viewing the chat
        if (location.pathname === "/chat") return 0;

        if (!messages || !lastReadAt || !currentPlayer) return 0;

        return messages.filter((message) => {
            // Don't count own messages as unread
            if (message.player_id === currentPlayer.id) return false;

            // Count messages created after last read timestamp
            return new Date(message.created_at) > new Date(lastReadAt);
        }).length;
    }, [messages, lastReadAt, currentPlayer, location.pathname]);

    return {
        unreadCount,
        isLoading: isLoadingMessages || isLoadingReadStatus,
    };
}
