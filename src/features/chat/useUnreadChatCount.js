import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { useChatMessages } from "../home/useChatMessages";
import { useChatReadStatus } from "../../hooks/useChatReadStatus";
import { useKicker } from "../../contexts/KickerContext";
import { useOwnPlayer } from "../../hooks/useOwnPlayer";

/**
 * Hook to get the count of unread chat messages for the current kicker
 * Used for notification badges in the mobile navigation
 */
export function useUnreadChatCount() {
    const { currentKicker } = useKicker();
    const { data: currentPlayer } = useOwnPlayer();
    const { messages, isLoading: isLoadingMessages } = useChatMessages();
    const { lastReadAt, isLoading: isLoadingReadStatus } =
        useChatReadStatus(currentKicker);
    const location = useLocation();

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
