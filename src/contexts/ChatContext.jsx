import {
    createContext,
    useContext,
    useEffect,
    useRef,
    useState,
    useCallback,
} from "react";
import { useQueryClient } from "react-query";
import { useKicker } from "./KickerContext";
import { useOwnPlayer } from "../hooks/useOwnPlayer";
import { getChatMessageById } from "../services/apiChat";
import supabase, { databaseSchema } from "../services/supabase";
import { CHAT_MESSAGES } from "../utils/constants";

const ChatContext = createContext();

function ChatProvider({ children }) {
    const { currentKicker } = useKicker();
    const { data: currentPlayer } = useOwnPlayer();
    const currentPlayerId = currentPlayer?.id;
    const queryClient = useQueryClient();

    const channelRef = useRef(null);
    const isRemovingChannelRef = useRef(false);
    const listenersRef = useRef(new Set());
    const [connectionStatus, setConnectionStatus] = useState("connecting");

    // Allow consumers to subscribe to insert events
    const subscribeToInserts = useCallback((callback) => {
        listenersRef.current.add(callback);
        return () => {
            listenersRef.current.delete(callback);
        };
    }, []);

    // Notify all listeners when a new message arrives
    const notifyListeners = useCallback((payload) => {
        listenersRef.current.forEach((callback) => {
            try {
                callback(payload);
            } catch (err) {
                console.error("[ChatContext] Listener error:", err);
            }
        });
    }, []);

    // Handle realtime INSERT event
    const handleRealtimeInsert = useCallback(
        async (payload) => {
            // Fetch the full message with relations (includes whisper visibility check)
            try {
                const newMessage = await getChatMessageById(
                    payload.new.id,
                    currentPlayerId,
                );

                // If newMessage is null, the whisper isn't visible to this user
                if (!newMessage) return;

                // Update React Query cache
                queryClient.setQueryData(
                    [CHAT_MESSAGES, currentKicker, currentPlayerId],
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
                    },
                );

                // Notify all listeners (e.g., for unread count)
                notifyListeners({ type: "INSERT", message: newMessage });
            } catch (err) {
                // Fallback to just invalidating
                queryClient.invalidateQueries([
                    CHAT_MESSAGES,
                    currentKicker,
                    currentPlayerId,
                ]);
                notifyListeners({ type: "INSERT", message: null });
            }
        },
        [queryClient, currentKicker, currentPlayerId, notifyListeners],
    );

    // Handle realtime UPDATE event
    const handleRealtimeUpdate = useCallback(() => {
        queryClient.invalidateQueries([
            CHAT_MESSAGES,
            currentKicker,
            currentPlayerId,
        ]);
        notifyListeners({ type: "UPDATE" });
    }, [queryClient, currentKicker, currentPlayerId, notifyListeners]);

    // Handle realtime DELETE event
    const handleRealtimeDelete = useCallback(() => {
        queryClient.invalidateQueries([
            CHAT_MESSAGES,
            currentKicker,
            currentPlayerId,
        ]);
        notifyListeners({ type: "DELETE" });
    }, [queryClient, currentKicker, currentPlayerId, notifyListeners]);

    // Function to create and subscribe to the realtime channel
    const subscribeToChannel = useCallback(() => {
        if (!currentKicker) return null;

        // Set status to connecting FIRST, before any channel operations
        setConnectionStatus("connecting");

        // Remove existing channel if any
        if (channelRef.current) {
            console.log(
                "[Chat Realtime] Removing old channel before resubscribe",
            );
            isRemovingChannelRef.current = true;
            supabase.removeChannel(channelRef.current);
            channelRef.current = null;
            // Reset after a microtask to allow CLOSED callback to fire first
            Promise.resolve().then(() => {
                isRemovingChannelRef.current = false;
            });
        }

        const channel = supabase
            .channel(`chat-messages-${currentKicker}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: databaseSchema,
                    table: CHAT_MESSAGES,
                    filter: `kicker_id=eq.${currentKicker}`,
                },
                handleRealtimeInsert,
            )
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: databaseSchema,
                    table: CHAT_MESSAGES,
                    filter: `kicker_id=eq.${currentKicker}`,
                },
                handleRealtimeUpdate,
            )
            .on(
                "postgres_changes",
                {
                    event: "DELETE",
                    schema: databaseSchema,
                    table: CHAT_MESSAGES,
                },
                handleRealtimeDelete,
            )
            .subscribe((status, err) => {
                console.log(`[Chat Realtime] Status: ${status}`, err || "");
                if (status === "SUBSCRIBED") {
                    console.log("[Chat Realtime] ✅ Connected");
                    setConnectionStatus("connected");
                }
                if (status === "CLOSED") {
                    console.log("[Chat Realtime] ❌ Closed");
                    // Only set disconnected if this wasn't an intentional removal
                    if (!isRemovingChannelRef.current) {
                        setConnectionStatus("disconnected");
                    }
                }
                if (status === "CHANNEL_ERROR") {
                    console.log(
                        "[Chat Realtime] ❌ Channel Error - will attempt reconnect on visibility change",
                    );
                    setConnectionStatus("disconnected");
                }
                if (status === "TIMED_OUT") {
                    console.log(
                        "[Chat Realtime] ❌ Timed Out - will attempt reconnect on visibility change",
                    );
                    setConnectionStatus("disconnected");
                }
            });

        channelRef.current = channel;
        return channel;
    }, [
        currentKicker,
        handleRealtimeInsert,
        handleRealtimeUpdate,
        handleRealtimeDelete,
    ]);

    // Subscribe when kicker changes
    useEffect(() => {
        if (!currentKicker) {
            setConnectionStatus("disconnected");
            return;
        }

        subscribeToChannel();

        // Fallback check: verify connection state after a short delay
        const connectionCheckTimeout = setTimeout(() => {
            if (channelRef.current?.state === "joined") {
                console.log(
                    "[Chat Realtime] Fallback check: Channel is joined",
                );
                setConnectionStatus("connected");
            }
        }, 500);

        return () => {
            clearTimeout(connectionCheckTimeout);
            if (channelRef.current) {
                console.log("[Chat Realtime] Cleanup - removing channel");
                isRemovingChannelRef.current = true;
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
            }
        };
    }, [currentKicker, subscribeToChannel]);

    // Visibility change handler - refetch messages and reconnect if needed
    useEffect(() => {
        if (!currentKicker) return;

        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                console.log(
                    "[Chat Realtime] Tab visible - checking connection...",
                );

                // Always refetch to catch any missed messages
                queryClient.invalidateQueries([
                    CHAT_MESSAGES,
                    currentKicker,
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
                    console.log(
                        "[Chat Realtime] 🔄 No channel found, subscribing...",
                    );
                    subscribeToChannel();
                }
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            document.removeEventListener(
                "visibilitychange",
                handleVisibilityChange,
            );
        };
    }, [currentKicker, currentPlayerId, queryClient, subscribeToChannel]);

    return (
        <ChatContext.Provider
            value={{
                connectionStatus,
                subscribeToInserts,
            }}
        >
            {children}
        </ChatContext.Provider>
    );
}

function useChatConnection() {
    const context = useContext(ChatContext);

    if (context === undefined) {
        throw new Error("ChatContext was used outside the ChatProvider");
    }

    return context;
}

export { ChatProvider, useChatConnection };
