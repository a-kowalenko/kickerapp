import { useInfiniteQuery, useQueryClient } from "react-query";
import { useCallback, useEffect, useRef } from "react";
import { getChatMessages, getChatMessageById } from "../../services/apiChat";
import { useKicker } from "../../contexts/KickerContext";
import { useOwnPlayer } from "../../hooks/useOwnPlayer";
import { CHAT_MESSAGES, CHAT_PAGE_SIZE } from "../../utils/constants";
import supabase, { databaseSchema } from "../../services/supabase";

export function useChatMessages() {
    const { currentKicker: kicker } = useKicker();
    const { data: currentPlayer } = useOwnPlayer();
    const currentPlayerId = currentPlayer?.id;
    const queryClient = useQueryClient();
    const channelRef = useRef(null);

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

    const handleRealtimeInsert = useCallback(
        async (payload) => {
            // Fetch the full message with relations (includes whisper visibility check)
            try {
                const newMessage = await getChatMessageById(
                    payload.new.id,
                    currentPlayerId
                );

                // If newMessage is null, the whisper isn't visible to this user
                if (!newMessage) return;

                queryClient.setQueryData(
                    [CHAT_MESSAGES, kicker, currentPlayerId],
                    (oldData) => {
                        if (!oldData) return oldData;

                        // Check if message already exists (prevent duplicates)
                        const allMessages = oldData.pages.flat();
                        if (allMessages.some((m) => m.id === newMessage.id)) {
                            return oldData;
                        }

                        // Add new message to the first page (most recent)
                        const newPages = [...oldData.pages];
                        newPages[0] = [newMessage, ...newPages[0]];
                        return { ...oldData, pages: newPages };
                    }
                );
            } catch (err) {
                // Fallback to just invalidating
                queryClient.invalidateQueries([
                    CHAT_MESSAGES,
                    kicker,
                    currentPlayerId,
                ]);
            }
        },
        [queryClient, kicker, currentPlayerId]
    );

    const handleRealtimeUpdate = useCallback(() => {
        queryClient.invalidateQueries([CHAT_MESSAGES, kicker, currentPlayerId]);
    }, [queryClient, kicker, currentPlayerId]);

    const handleRealtimeDelete = useCallback(() => {
        queryClient.invalidateQueries([CHAT_MESSAGES, kicker, currentPlayerId]);
    }, [queryClient, kicker, currentPlayerId]);

    // Function to create and subscribe to the realtime channel
    const subscribeToChannel = useCallback(() => {
        if (!kicker) return null;

        // Remove existing channel if any
        if (channelRef.current) {
            console.log("[Chat Realtime] Removing old channel before resubscribe");
            supabase.removeChannel(channelRef.current);
            channelRef.current = null;
        }

        const channel = supabase
            .channel(`chat-messages-${kicker}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: databaseSchema,
                    table: CHAT_MESSAGES,
                    filter: `kicker_id=eq.${kicker}`,
                },
                handleRealtimeInsert
            )
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: databaseSchema,
                    table: CHAT_MESSAGES,
                    filter: `kicker_id=eq.${kicker}`,
                },
                handleRealtimeUpdate
            )
            .on(
                "postgres_changes",
                {
                    event: "DELETE",
                    schema: databaseSchema,
                    table: CHAT_MESSAGES,
                },
                handleRealtimeDelete
            )
            .subscribe((status, err) => {
                console.log(`[Chat Realtime] Status: ${status}`, err || "");
                if (status === "SUBSCRIBED") {
                    console.log("[Chat Realtime] ✅ Connected");
                }
                if (status === "CLOSED") {
                    console.log("[Chat Realtime] ❌ Closed");
                }
                if (status === "CHANNEL_ERROR") {
                    console.log("[Chat Realtime] ❌ Channel Error - will attempt reconnect on visibility change");
                }
                if (status === "TIMED_OUT") {
                    console.log("[Chat Realtime] ❌ Timed Out - will attempt reconnect on visibility change");
                }
            });

        channelRef.current = channel;
        return channel;
    }, [kicker, handleRealtimeInsert, handleRealtimeUpdate, handleRealtimeDelete]);

    // Initial subscription setup
    useEffect(() => {
        if (!kicker) return;

        subscribeToChannel();

        return () => {
            if (channelRef.current) {
                console.log("[Chat Realtime] Cleanup - removing channel");
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
            }
        };
    }, [kicker, subscribeToChannel]);

    // Visibility change handler - refetch messages and reconnect if needed
    useEffect(() => {
        if (!kicker) return;

        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                console.log("[Chat Realtime] Tab visible - checking connection...");
                
                // Always refetch to catch any missed messages
                queryClient.invalidateQueries([
                    CHAT_MESSAGES,
                    kicker,
                    currentPlayerId,
                ]);

                // Check subscription state and reconnect if needed
                if (channelRef.current) {
                    const state = channelRef.current.state;
                    console.log(`[Chat Realtime] Channel state: ${state}`);
                    
                    if (state !== "joined") {
                        console.log("[Chat Realtime] 🔄 Reconnecting...");
                        subscribeToChannel();
                    }
                } else {
                    console.log("[Chat Realtime] 🔄 No channel found, subscribing...");
                    subscribeToChannel();
                }
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, [kicker, currentPlayerId, queryClient, subscribeToChannel]);

    return {
        messages,
        isLoading,
        error,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    };
}
