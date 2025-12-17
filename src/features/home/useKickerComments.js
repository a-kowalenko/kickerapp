import { useInfiniteQuery, useQueryClient } from "react-query";
import { useCallback, useEffect } from "react";
import { getCommentsByKicker } from "../../services/apiComments";
import { useKicker } from "../../contexts/KickerContext";
import { MATCH_COMMENTS, CHAT_PAGE_SIZE } from "../../utils/constants";
import supabase, { databaseSchema } from "../../services/supabase";

export function useKickerComments() {
    const { currentKicker: kicker } = useKicker();
    const queryClient = useQueryClient();

    const {
        data,
        isLoading,
        error,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useInfiniteQuery({
        queryKey: ["kicker-comments", kicker],
        queryFn: ({ pageParam = 0 }) =>
            getCommentsByKicker(kicker, {
                offset: pageParam,
                limit: CHAT_PAGE_SIZE,
            }),
        getNextPageParam: (lastPage, allPages) => {
            // If we got fewer items than page size, there are no more pages
            if (lastPage.length < CHAT_PAGE_SIZE) return undefined;
            // Otherwise, return the offset for the next page
            return allPages.flat().length;
        },
        enabled: !!kicker,
    });

    // Flatten all pages - newest first (column-reverse in UI handles display order)
    const comments = data?.pages?.flat() || [];

    const handleRealtimeInsert = useCallback(
        async (payload) => {
            // Fetch fresh data to get full comment with relations
            // We need match info which is only available via the full query
            queryClient.invalidateQueries(["kicker-comments", kicker]);
        },
        [queryClient, kicker]
    );

    const handleRealtimeUpdate = useCallback(() => {
        queryClient.invalidateQueries(["kicker-comments", kicker]);
    }, [queryClient, kicker]);

    const handleRealtimeDelete = useCallback(() => {
        queryClient.invalidateQueries(["kicker-comments", kicker]);
    }, [queryClient, kicker]);

    useEffect(() => {
        if (!kicker) return;

        const channelInstance = supabase
            .channel(`kicker-comments-${kicker}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: databaseSchema,
                    table: MATCH_COMMENTS,
                    filter: `kicker_id=eq.${kicker}`,
                },
                handleRealtimeInsert
            )
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: databaseSchema,
                    table: MATCH_COMMENTS,
                    filter: `kicker_id=eq.${kicker}`,
                },
                handleRealtimeUpdate
            )
            .on(
                "postgres_changes",
                {
                    event: "DELETE",
                    schema: databaseSchema,
                    table: MATCH_COMMENTS,
                },
                handleRealtimeDelete
            )
            // Also listen for match updates (score changes)
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: databaseSchema,
                    table: "matches",
                    filter: `kicker_id=eq.${kicker}`,
                },
                handleRealtimeUpdate
            )
            .subscribe();

        return () => {
            if (channelInstance) {
                supabase.removeChannel(channelInstance);
            }
        };
    }, [
        kicker,
        handleRealtimeInsert,
        handleRealtimeUpdate,
        handleRealtimeDelete,
    ]);

    return {
        comments,
        isLoading,
        error,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    };
}
