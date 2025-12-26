import { useQuery, useQueryClient } from "react-query";
import { getChatReadStatus } from "../services/apiChat";

/**
 * Hook to get the last_read_at timestamp for chat messages in a kicker
 * Used to determine which messages should be visually marked as unread
 */
export function useChatReadStatus(kickerId) {
    const queryClient = useQueryClient();

    const { data: lastReadAt, isLoading } = useQuery({
        queryKey: ["chat-read-status", kickerId],
        queryFn: () => getChatReadStatus(kickerId),
        enabled: !!kickerId,
        staleTime: 30000, // Consider fresh for 30 seconds
    });

    const invalidate = () => {
        queryClient.invalidateQueries(["chat-read-status", kickerId]);
    };

    return {
        lastReadAt,
        isLoading,
        invalidate,
    };
}
