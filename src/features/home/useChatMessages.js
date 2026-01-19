import { useInfiniteQuery } from "react-query";
import { getChatMessages } from "../../services/apiChat";
import { useKicker } from "../../contexts/KickerContext";
import { useOwnPlayer } from "../../hooks/useOwnPlayer";
import { CHAT_MESSAGES, CHAT_PAGE_SIZE } from "../../utils/constants";
import { useChatConnection } from "../../contexts/ChatContext";

export function useChatMessages() {
    const { currentKicker: kicker } = useKicker();
    const { data: currentPlayer } = useOwnPlayer();
    const currentPlayerId = currentPlayer?.id;

    // Get connection status from shared context (single channel for entire app)
    const { connectionStatus } = useChatConnection();

    const {
        data,
        isLoading,
        error,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useInfiniteQuery({
        queryKey: [CHAT_MESSAGES, kicker, currentPlayerId],
        queryFn: ({ pageParam = 0 }) =>
            getChatMessages(kicker, {
                offset: pageParam,
                limit: CHAT_PAGE_SIZE,
                currentPlayerId,
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
    const messages = data?.pages?.flat() || [];

    return {
        messages,
        isLoading,
        error,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        connectionStatus,
    };
}
