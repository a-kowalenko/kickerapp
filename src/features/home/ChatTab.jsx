import styled from "styled-components";
import { useRef, useEffect, useMemo, useState, useCallback } from "react";
import { HiChatBubbleLeftRight, HiChevronDoubleDown } from "react-icons/hi2";
import { useChatMessages } from "./useChatMessages";
import { useCreateChatMessage } from "./useCreateChatMessage";
import { useUpdateChatMessage } from "./useUpdateChatMessage";
import { useDeleteChatMessage } from "./useDeleteChatMessage";
import { useChatReactions } from "./useChatReactions";
import { useToggleChatReaction } from "./useToggleChatReaction";
import { useTypingIndicator } from "./useTypingIndicator";
import { useOwnPlayer } from "../../hooks/useOwnPlayer";
import { useKickerInfo } from "../../hooks/useKickerInfo";
import { useUser } from "../authentication/useUser";
import { useKicker } from "../../contexts/KickerContext";
import { updateChatReadStatus } from "../../services/apiChat";
import useUnreadBadge from "../../hooks/useUnreadBadge";
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import LoadingSpinner from "../../ui/LoadingSpinner";
import SpinnerMini from "../../ui/SpinnerMini";
import JumpToLatestButton from "../../ui/JumpToLatestButton";

const MessagesContainer = styled.div`
    display: flex;
    flex-direction: column-reverse;
    gap: 0.6rem;
    overflow-y: auto;
    flex: 1;
    padding: 1rem;
    position: relative;

    /* Custom scrollbar */
    &::-webkit-scrollbar {
        width: 0.6rem;
    }

    &::-webkit-scrollbar-track {
        background: var(--tertiary-background-color);
        border-radius: var(--border-radius-sm);
    }

    &::-webkit-scrollbar-thumb {
        background: var(--primary-border-color);
        border-radius: var(--border-radius-sm);
    }

    &::-webkit-scrollbar-thumb:hover {
        background: var(--secondary-text-color);
    }
`;

const LoadMoreTrigger = styled.div`
    display: flex;
    justify-content: center;
    padding: 0.5rem;
    color: var(--tertiary-text-color);
    font-size: 1.2rem;
`;

const EmptyState = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex: 1;
    padding: 3rem;
    color: var(--tertiary-text-color);
    text-align: center;
    gap: 1rem;

    & svg {
        font-size: 4rem;
        opacity: 0.5;
    }
`;

const EmptyText = styled.p`
    font-size: 1.4rem;
`;

const TypingIndicator = styled.div`
    padding: 0.4rem 1rem;
    font-size: 1.2rem;
    color: var(--tertiary-text-color);
    font-style: italic;
    min-height: 2rem;
`;

const NewMessagesBadge = styled.span`
    position: absolute;
    top: -0.4rem;
    right: -0.4rem;
    background-color: var(--color-red-700);
    color: white;
    padding: 0.2rem 0.5rem;
    border-radius: var(--border-radius-pill);
    font-size: 1rem;
    font-weight: 600;
    min-width: 1.8rem;
    text-align: center;
`;

const ContentWrapper = styled.div`
    display: flex;
    flex-direction: column;
    flex: 1;
    position: relative;
    min-height: 0;
`;

function ChatTab() {
    const messagesContainerRef = useRef(null);
    const loadMoreRef = useRef(null);
    const focusInputRef = useRef(null);
    const [showJumpToLatest, setShowJumpToLatest] = useState(false);
    const [newMessagesCount, setNewMessagesCount] = useState(0);
    const [replyTo, setReplyTo] = useState(null);
    const [lastWhisperFrom, setLastWhisperFrom] = useState(null);
    const [scrollTrigger, setScrollTrigger] = useState(0);
    const [hasInitiallyScrolled, setHasInitiallyScrolled] = useState(false);
    const prevMessageCountRef = useRef(0);
    const isNearBottomRef = useRef(true);
    const prevFirstMessageIdRef = useRef(null);
    const pendingScrollRef = useRef(false);

    // Hooks
    const {
        messages,
        isLoading: isLoadingMessages,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useChatMessages();

    const { createChatMessage, isCreating } = useCreateChatMessage();
    const { updateChatMessage, isUpdating } = useUpdateChatMessage();
    const { deleteChatMessage, isDeleting } = useDeleteChatMessage();

    // Get message IDs for reactions
    const messageIds = useMemo(
        () => messages?.map((m) => m.id) || [],
        [messages]
    );
    const {
        groupedByMessage: messageReactionsMap,
        isLoading: isLoadingReactions,
    } = useChatReactions(messageIds);
    const { toggleReaction, isToggling: isTogglingReaction } =
        useToggleChatReaction();

    // User/Player info
    const { data: currentPlayer } = useOwnPlayer();
    const { data: kickerData } = useKickerInfo();
    const { user } = useUser();
    const { currentKicker } = useKicker();

    const isAdmin = kickerData?.admin === user?.id;
    const currentPlayerId = currentPlayer?.id;

    // Get invalidate function from unread badge hook
    const { invalidateUnreadBadge } = useUnreadBadge(user?.id);

    // Typing indicator
    const { typingText, onTyping, stopTyping } =
        useTypingIndicator(currentPlayerId);

    // Mark messages as read - only invalidate badge queries, the hook handles the rest
    const markAsRead = useCallback(async () => {
        if (!currentKicker) return;
        try {
            console.log(
                "[ChatTab] markAsRead called for kicker:",
                currentKicker
            );
            await updateChatReadStatus(currentKicker);
            console.log(
                "[ChatTab] updateChatReadStatus completed, invalidating badge..."
            );
            // Invalidate badge queries to trigger refetch of combined unread count
            // The useUnreadBadge hook will handle updating document title and app badge
            invalidateUnreadBadge();
        } catch (error) {
            console.error("Error marking chat as read:", error);
        }
    }, [currentKicker, invalidateUnreadBadge]);

    // Track if user is viewing the chat (at bottom of messages)
    const markAsReadIfAtBottom = useCallback(() => {
        if (isNearBottomRef.current && currentKicker && hasInitiallyScrolled) {
            markAsRead();
        }
    }, [currentKicker, hasInitiallyScrolled, markAsRead]);

    // Mark as read when user scrolls to bottom
    useEffect(() => {
        if (hasInitiallyScrolled && currentKicker && isNearBottomRef.current) {
            const timer = setTimeout(() => {
                if (isNearBottomRef.current) {
                    markAsRead();
                }
            }, 500); // 500ms delay to prevent accidental opens
            return () => clearTimeout(timer);
        }
    }, [hasInitiallyScrolled, currentKicker, markAsRead]);

    // Mark as read when tab becomes visible AND user is at bottom
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible" && currentKicker) {
                setTimeout(() => {
                    markAsReadIfAtBottom();
                }, 500);
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => {
            document.removeEventListener(
                "visibilitychange",
                handleVisibilityChange
            );
        };
    }, [currentKicker, markAsReadIfAtBottom]);

    // Handle scroll for showing/hiding jump to latest
    const handleScroll = useCallback(() => {
        const container = messagesContainerRef.current;
        if (!container) return;

        const threshold = 100;
        const nearBottom = Math.abs(container.scrollTop) < threshold;
        const wasNearBottom = isNearBottomRef.current;
        isNearBottomRef.current = nearBottom;

        if (nearBottom) {
            setShowJumpToLatest(false);
            setNewMessagesCount(0);

            if (!wasNearBottom && currentKicker) {
                markAsRead();
            }
        } else {
            setShowJumpToLatest(true);
        }
    }, [currentKicker, markAsRead]);

    // Infinite scroll - load more when scrolling to top
    useEffect(() => {
        const container = messagesContainerRef.current;
        if (!container || !hasNextPage) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !isFetchingNextPage) {
                    fetchNextPage();
                }
            },
            { root: container, threshold: 0.1 }
        );

        if (loadMoreRef.current) {
            observer.observe(loadMoreRef.current);
        }

        return () => observer.disconnect();
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    // Dedicated effect for scrolling to bottom after sending a message
    useEffect(() => {
        if (scrollTrigger === 0) return;

        const container = messagesContainerRef.current;
        if (!container) return;

        const scrollToBottom = () => {
            container.scrollTop = 0;
            try {
                container.scrollTo(0, 0);
            } catch (e) {
                // Ignore if not supported
            }
        };

        const mutationObserver = new MutationObserver(() => {
            scrollToBottom();
        });

        mutationObserver.observe(container, { childList: true, subtree: true });

        scrollToBottom();

        const timeouts = [
            setTimeout(scrollToBottom, 0),
            setTimeout(scrollToBottom, 50),
            setTimeout(scrollToBottom, 100),
            setTimeout(scrollToBottom, 200),
            setTimeout(() => {
                scrollToBottom();
                pendingScrollRef.current = false;
                mutationObserver.disconnect();
            }, 500),
        ];

        return () => {
            timeouts.forEach(clearTimeout);
            mutationObserver.disconnect();
        };
    }, [scrollTrigger]);

    // Track new messages and auto-scroll if near bottom
    useEffect(() => {
        if (!messages.length) return;

        const currentFirstMessageId = messages[0]?.id;
        const newCount = messages.length - prevMessageCountRef.current;

        const hasNewRecentMessages =
            newCount > 0 &&
            prevMessageCountRef.current > 0 &&
            currentFirstMessageId !== prevFirstMessageIdRef.current;

        if (hasNewRecentMessages) {
            const latestMessage = messages[0];
            if (
                latestMessage?.recipient_id === currentPlayerId &&
                latestMessage?.player_id !== currentPlayerId
            ) {
                setLastWhisperFrom(latestMessage.player);
            }

            if (!pendingScrollRef.current) {
                const container = messagesContainerRef.current;
                const threshold = 100;
                const isCurrentlyNearBottom = container
                    ? Math.abs(container.scrollTop) < threshold
                    : true;

                if (isCurrentlyNearBottom) {
                    if (container) {
                        setTimeout(() => {
                            container.scrollTop = 0;
                        }, 50);
                    }
                } else {
                    setNewMessagesCount((prev) => prev + newCount);
                }
            }
        }

        prevMessageCountRef.current = messages.length;
        prevFirstMessageIdRef.current = currentFirstMessageId;
    }, [messages, currentPlayerId]);

    // Initial scroll
    useEffect(() => {
        if (isLoadingMessages || !messages.length || hasInitiallyScrolled)
            return;

        if (isLoadingReactions) return;

        const container = messagesContainerRef.current;
        if (container) {
            container.scrollTop = 0;
            prevMessageCountRef.current = messages.length;
            setHasInitiallyScrolled(true);
        }
    }, [
        isLoadingMessages,
        isLoadingReactions,
        messages.length,
        hasInitiallyScrolled,
    ]);

    function handleJumpToLatest() {
        const container = messagesContainerRef.current;
        if (container) {
            container.scrollTop = 0;
        }
        setShowJumpToLatest(false);
        setNewMessagesCount(0);
    }

    function handleScrollToMessage(messageId) {
        const container = messagesContainerRef.current;
        if (!container) return;

        const messageElement = container.querySelector(
            `[data-message-id="${messageId}"]`
        );
        if (messageElement) {
            messageElement.scrollIntoView({
                behavior: "smooth",
                block: "center",
            });
            messageElement.classList.add("highlight");
            setTimeout(() => {
                messageElement.classList.remove("highlight");
            }, 2000);
        }
    }

    function handleCreateMessage({ content, recipientId, replyToId }) {
        if (!currentPlayerId) return;

        pendingScrollRef.current = true;

        const container = messagesContainerRef.current;
        if (container) {
            container.scrollTop = 0;
        }

        setShowJumpToLatest(false);
        setNewMessagesCount(0);

        createChatMessage({
            playerId: currentPlayerId,
            content,
            recipientId,
            replyToId,
        });
        setReplyTo(null);
        stopTyping();

        setScrollTrigger((prev) => prev + 1);

        isNearBottomRef.current = true;

        requestAnimationFrame(() => {
            focusInputRef.current?.();
        });
    }

    function handleReply(message) {
        setReplyTo(message);
        setTimeout(() => {
            focusInputRef.current?.();
        }, 50);
    }

    function handleCancelReply() {
        setReplyTo(null);
    }

    function handleToggleReaction({ messageId, reactionType }) {
        if (!currentPlayerId) return;
        toggleReaction({
            messageId,
            playerId: currentPlayerId,
            reactionType,
        });
    }

    function shouldGroupWithPrevious(currentMsg, prevMsg) {
        if (currentMsg.reply_to_id) return false;
        if (currentMsg.player_id !== prevMsg.player_id) return false;

        const currentIsWhisper = currentMsg.recipient_id !== null;
        const prevIsWhisper = prevMsg.recipient_id !== null;

        if (currentIsWhisper !== prevIsWhisper) return false;
        if (
            currentIsWhisper &&
            currentMsg.recipient_id !== prevMsg.recipient_id
        )
            return false;

        const currentTime = new Date(currentMsg.created_at);
        const prevTime = new Date(prevMsg.created_at);
        const timeDiffMinutes = Math.abs(currentTime - prevTime) / (1000 * 60);

        return timeDiffMinutes <= 10;
    }

    if (isLoadingMessages) {
        return (
            <ContentWrapper>
                <EmptyState>
                    <LoadingSpinner />
                </EmptyState>
            </ContentWrapper>
        );
    }

    return (
        <>
            <ContentWrapper>
                <MessagesContainer
                    ref={messagesContainerRef}
                    onScroll={handleScroll}
                >
                    {messages?.length === 0 ? (
                        <EmptyState>
                            <HiChatBubbleLeftRight />
                            <EmptyText>
                                No messages yet.
                                <br />
                                Start the conversation!
                            </EmptyText>
                        </EmptyState>
                    ) : (
                        <>
                            {messages?.map((message, index) => {
                                const nextMessage = messages[index + 1];
                                const isGrouped =
                                    nextMessage &&
                                    shouldGroupWithPrevious(
                                        message,
                                        nextMessage
                                    );

                                return (
                                    <ChatMessage
                                        key={message.id}
                                        message={message}
                                        currentPlayerId={currentPlayerId}
                                        isAdmin={isAdmin}
                                        onUpdate={updateChatMessage}
                                        onDelete={deleteChatMessage}
                                        isUpdating={isUpdating}
                                        isDeleting={isDeleting}
                                        messageReactions={
                                            messageReactionsMap[message.id] ||
                                            {}
                                        }
                                        onToggleReaction={handleToggleReaction}
                                        isTogglingReaction={isTogglingReaction}
                                        onReply={handleReply}
                                        onScrollToMessage={
                                            handleScrollToMessage
                                        }
                                        isGrouped={isGrouped}
                                    />
                                );
                            })}
                            {hasNextPage && (
                                <LoadMoreTrigger ref={loadMoreRef}>
                                    {isFetchingNextPage ? (
                                        <SpinnerMini />
                                    ) : (
                                        "Scroll up for more messages"
                                    )}
                                </LoadMoreTrigger>
                            )}
                        </>
                    )}
                </MessagesContainer>

                <TypingIndicator>{typingText}</TypingIndicator>

                {showJumpToLatest && (
                    <JumpToLatestButton onClick={handleJumpToLatest}>
                        <HiChevronDoubleDown />
                        {newMessagesCount > 0 && (
                            <NewMessagesBadge>
                                {newMessagesCount}
                            </NewMessagesBadge>
                        )}
                    </JumpToLatestButton>
                )}
            </ContentWrapper>

            {currentPlayer && (
                <ChatInput
                    onSubmit={handleCreateMessage}
                    isSubmitting={isCreating}
                    currentPlayer={currentPlayer}
                    replyTo={replyTo}
                    onCancelReply={handleCancelReply}
                    lastWhisperFrom={lastWhisperFrom}
                    onTyping={onTyping}
                    onFocusInput={(fn) => {
                        focusInputRef.current = fn;
                    }}
                />
            )}
        </>
    );
}

export default ChatTab;
