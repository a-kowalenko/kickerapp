import { useMemo } from "react";
import { useChatMessages } from "../home/useChatMessages";
import { useChatReadStatus } from "../../hooks/useChatReadStatus";
import { useKicker } from "../../contexts/KickerContext";
import { useUser } from "../authentication/useUser";

/**
 * Hook to get the count of unread chat messages for the current kicker
 * Used for notification badges in the mobile navigation
 */
export function useUnreadChatCount() {
    const { currentKicker } = useKicker();
    const { user } = useUser();
    const { messages, isLoading: isLoadingMessages } = useChatMessages();
    const { lastReadAt, isLoading: isLoadingReadStatus } =
        useChatReadStatus(currentKicker);

    const unreadCount = useMemo(() => {
        if (!messages || !lastReadAt || !user) return 0;

        return messages.filter((message) => {
            // Don't count own messages as unread
            if (message.sender_id === user.id) return false;

            // Count messages created after last read timestamp
            return new Date(message.created_at) > new Date(lastReadAt);
        }).length;
    }, [messages, lastReadAt, user]);

    return {
        unreadCount,
        isLoading: isLoadingMessages || isLoadingReadStatus,
    };
}
