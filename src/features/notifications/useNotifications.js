import { useCallback, useEffect } from "react";
import {
    useInfiniteQuery,
    useMutation,
    useQuery,
    useQueryClient,
} from "react-query";
import supabase, { databaseSchema } from "../../services/supabase";
import {
    getMentionNotifications,
    getUnreadMentionCount,
    markMentionAsRead,
    markAllMentionsAsRead,
} from "../../services/apiNotifications";
import { useUser } from "../authentication/useUser";

const NOTIFICATIONS_PAGE_SIZE = 50;
const MENTION_NOTIFICATIONS_TABLE = "mention_notifications";

/**
 * Hook to manage mention notifications with infinite scroll and real-time updates
 */
export function useNotifications() {
    const queryClient = useQueryClient();
    const { user } = useUser();
    const userId = user?.id;

    // Infinite query for paginated notifications
    const {
        data,
        isLoading,
        error,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useInfiniteQuery({
        queryKey: ["mention-notifications", userId],
        queryFn: ({ pageParam = 0 }) =>
            getMentionNotifications(NOTIFICATIONS_PAGE_SIZE, pageParam),
        getNextPageParam: (lastPage, allPages) => {
            if (lastPage.length < NOTIFICATIONS_PAGE_SIZE) return undefined;
            return allPages.flat().length;
        },
        enabled: !!userId,
        staleTime: 1000 * 60, // 1 minute
    });

    // Query for unread count
    const { data: unreadCount = 0 } = useQuery({
        queryKey: ["mention-notifications-unread", userId],
        queryFn: getUnreadMentionCount,
        enabled: !!userId,
        staleTime: 1000 * 30, // 30 seconds
        refetchOnWindowFocus: true,
    });

    // Mutation to mark single notification as read
    const markAsReadMutation = useMutation({
        mutationFn: markMentionAsRead,
        onSuccess: () => {
            queryClient.invalidateQueries(["mention-notifications", userId]);
            queryClient.invalidateQueries([
                "mention-notifications-unread",
                userId,
            ]);
        },
    });

    // Mutation to mark all notifications as read
    const markAllAsReadMutation = useMutation({
        mutationFn: markAllMentionsAsRead,
        onSuccess: () => {
            queryClient.invalidateQueries(["mention-notifications", userId]);
            queryClient.invalidateQueries([
                "mention-notifications-unread",
                userId,
            ]);
        },
    });

    // Real-time subscription for new notifications
    const handleRealtimeChange = useCallback(() => {
        // Immediately invalidate to trigger refetch
        queryClient.invalidateQueries(["mention-notifications", userId]);
        queryClient.invalidateQueries(["mention-notifications-unread", userId]);
    }, [queryClient, userId]);

    useEffect(() => {
        if (!userId) return;

        const channel = supabase
            .channel(`mention-notifications-${userId}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: databaseSchema,
                    table: MENTION_NOTIFICATIONS_TABLE,
                    filter: `user_id=eq.${userId}`,
                },
                handleRealtimeChange
            )
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: databaseSchema,
                    table: MENTION_NOTIFICATIONS_TABLE,
                    filter: `user_id=eq.${userId}`,
                },
                handleRealtimeChange
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId, handleRealtimeChange]);

    // Flatten all pages into single array
    const notifications = data?.pages?.flat() || [];

    return {
        notifications,
        unreadCount,
        isLoading,
        error,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        markAsRead: markAsReadMutation.mutate,
        markAllAsRead: markAllAsReadMutation.mutate,
        isMarkingAsRead: markAsReadMutation.isLoading,
        isMarkingAllAsRead: markAllAsReadMutation.isLoading,
    };
}

/**
 * Hook to get only the unread count (lighter weight for badge display)
 */
export function useUnreadMentionCount() {
    const queryClient = useQueryClient();
    const { user } = useUser();
    const userId = user?.id;

    const { data: unreadCount = 0, refetch } = useQuery({
        queryKey: ["mention-notifications-unread", userId],
        queryFn: getUnreadMentionCount,
        enabled: !!userId,
        staleTime: 1000 * 10, // Reduced to 10 seconds for fresher data
        refetchOnWindowFocus: true,
    });

    // Real-time subscription for count updates
    useEffect(() => {
        if (!userId) return;

        const channel = supabase
            .channel(`mention-count-${userId}`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: databaseSchema,
                    table: MENTION_NOTIFICATIONS_TABLE,
                    filter: `user_id=eq.${userId}`,
                },
                () => {
                    // Immediately invalidate to trigger refetch
                    queryClient.invalidateQueries([
                        "mention-notifications-unread",
                        userId,
                    ]);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId, queryClient]);

    return { unreadCount, refetch };
}
