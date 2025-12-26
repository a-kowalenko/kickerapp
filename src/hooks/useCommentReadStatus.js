import { useQuery, useQueryClient } from "react-query";
import {
    getCommentReadStatus,
    getMatchCommentReadStatus,
} from "../services/apiComments";

/**
 * Hook to get the last_read_at timestamp for comments in a kicker (kicker-wide)
 * Used to determine which comments should be visually marked as unread in the home comments tab
 */
export function useCommentReadStatus(kickerId) {
    const queryClient = useQueryClient();

    const { data: lastReadAt, isLoading } = useQuery({
        queryKey: ["comment-read-status", kickerId],
        queryFn: () => getCommentReadStatus(kickerId),
        enabled: !!kickerId,
        staleTime: 30000, // Consider fresh for 30 seconds
    });

    const invalidate = () => {
        queryClient.invalidateQueries(["comment-read-status", kickerId]);
    };

    return {
        lastReadAt,
        isLoading,
        invalidate,
    };
}

/**
 * Hook to get the last_read_at timestamp for comments in a specific match
 * Used to determine which comments should be visually marked as unread in match detail view
 */
export function useMatchCommentReadStatus(matchId) {
    const queryClient = useQueryClient();

    const { data: lastReadAt, isLoading } = useQuery({
        queryKey: ["match-comment-read-status", matchId],
        queryFn: () => getMatchCommentReadStatus(matchId),
        enabled: !!matchId,
        staleTime: 30000, // Consider fresh for 30 seconds
    });

    const invalidate = () => {
        queryClient.invalidateQueries(["match-comment-read-status", matchId]);
    };

    return {
        lastReadAt,
        isLoading,
        invalidate,
    };
}
