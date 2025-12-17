import { useQuery, useQueryClient } from "react-query";
import { getUnreadCommentCount } from "../../services/apiComments";
import { useKicker } from "../../contexts/KickerContext";

export function useUnreadCommentCount() {
    const { currentKicker: kicker } = useKicker();
    const queryClient = useQueryClient();

    const { data: unreadCount = 0, isLoading } = useQuery({
        queryKey: ["unread-comment-count", kicker],
        queryFn: () => getUnreadCommentCount(kicker),
        enabled: !!kicker,
        staleTime: 30000, // 30 seconds
        refetchOnWindowFocus: true,
    });

    const invalidate = () => {
        queryClient.invalidateQueries(["unread-comment-count", kicker]);
    };

    return {
        unreadCount,
        isLoading,
        invalidate,
    };
}
