import React from "react";
import styled from "styled-components";
import { useRef, useEffect, useMemo, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { format, isToday, isYesterday, isSameDay } from "date-fns";
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
import { useChatReadStatus } from "../../hooks/useChatReadStatus";
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
    overflow-x: hidden;
    flex: 1;
    padding: 1rem;
    position: relative;

    /* Prevent browser context menu on messages container for custom menu */
    & > * {
        -webkit-touch-callout: none;
    }

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

const TypingIndicatorContainer = styled.div`
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.4rem 1rem;
    font-size: 1.2rem;
    color: var(--tertiary-text-color);
    font-style: italic;
    min-height: 2rem;
    opacity: ${(props) => (props.$visible ? 1 : 0)};
    transition: opacity 0.2s ease-in-out;
`;

const TypingDotsContainer = styled.span`
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
`;

const TypingDot = styled.span`
    width: 0.6rem;
    height: 0.6rem;
    background-color: var(--tertiary-text-color);
    border-radius: 50%;
    animation: typingBounce 1.4s ease-in-out infinite;
    animation-delay: ${(props) => props.$delay || "0s"};

    @keyframes typingBounce {
        0%,
        60%,
        100% {
            transform: scale(0.6);
            opacity: 0.4;
        }
        30% {
            transform: scale(1);
            opacity: 1;
        }
    }
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

const DateDividerContainer = styled.div`
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem 0;
    margin: 0.4rem 0;

    &::before,
    &::after {
        content: "";
        flex: 1;
        height: 1px;
        background-color: var(--primary-border-color);
    }
`;

const DateLabel = styled.span`
    font-size: 1.2rem;
    color: var(--tertiary-text-color);
    font-weight: 500;
    white-space: nowrap;
`;

// Helper function to format date for dividers
function formatDateDivider(date) {
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";
    return format(date, "d. MMMM yyyy");
}

function ChatTab() {
    const messagesContainerRef = useRef(null);
    const loadMoreRef = useRef(null);
    const focusInputRef = useRef(null);
    const chatInputRef = useRef(null);
    const [showJumpToLatest, setShowJumpToLatest] = useState(false);
    const [newMessagesCount, setNewMessagesCount] = useState(0);
    const [replyTo, setReplyTo] = useState(null);
    const [lastWhisperFrom, setLastWhisperFrom] = useState(null);
    const [scrollTrigger, setScrollTrigger] = useState(0);
    const [hasInitiallyScrolled, setHasInitiallyScrolled] = useState(false);
    const [hasScrolledToDeepLink, setHasScrolledToDeepLink] = useState(false);
    const prevMessageCountRef = useRef(0);
    const isNearBottomRef = useRef(true);
    const prevFirstMessageIdRef = useRef(null);
    const pendingScrollRef = useRef(false);
    const hasMarkedAsReadRef = useRef(false);
    const [searchParams] = useSearchParams();

    // Parse deep link from query param (e.g., ?scrollTo=message-123)
    const deepLinkMessageId = useMemo(() => {
        const scrollToParam = searchParams.get("scrollTo");
        if (scrollToParam && scrollToParam.startsWith("message-")) {
            return scrollToParam.replace("message-", "");
        }
        return null;
    }, [searchParams]);

    // Scroll to deep-linked message
    const scrollToMessage = useCallback((messageId) => {
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
            // Add highlight effect
            messageElement.classList.add("highlight");
            setTimeout(() => {
                messageElement.classList.remove("highlight");
            }, 2000);
        }
    }, []);

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

    // Get invalidate function for read status
    const { lastReadAt, invalidate: invalidateChatReadStatus } =
        useChatReadStatus(currentKicker);

    // Typing indicator
    const { typingText, onTyping, stopTyping } =
        useTypingIndicator(currentPlayerId);

    // Mark messages as read and update both badge and read status
    // Uses hasMarkedAsReadRef to prevent duplicate API calls
    const markAsRead = useCallback(async () => {
        if (!currentKicker || hasMarkedAsReadRef.current) return;
        hasMarkedAsReadRef.current = true;
        try {
            await updateChatReadStatus(currentKicker);
            // Invalidate badge queries to trigger refetch of combined unread count
            invalidateUnreadBadge();
            // Invalidate chat read status so unread markers update immediately
            invalidateChatReadStatus();
        } catch (error) {
            console.error("Error marking chat as read:", error);
        } finally {
            // Reset after a short delay to allow subsequent reads (e.g., new messages)
            setTimeout(() => {
                hasMarkedAsReadRef.current = false;
            }, 1000);
        }
    }, [currentKicker, invalidateUnreadBadge, invalidateChatReadStatus]);

    // Track if user is viewing the chat (at bottom of messages)
    const markAsReadIfAtBottom = useCallback(() => {
        if (isNearBottomRef.current && currentKicker && hasInitiallyScrolled) {
            markAsRead();
        }
    }, [currentKicker, hasInitiallyScrolled, markAsRead]);

    // Mark as read when user scrolls to bottom OR when chat is initially loaded
    // Note: markAsRead is intentionally excluded from deps to prevent infinite loops
    // The hasMarkedAsReadRef guard ensures we don't make duplicate API calls
    useEffect(() => {
        if (hasInitiallyScrolled && currentKicker && isNearBottomRef.current) {
            // Mark as read immediately when chat opens and user is at bottom
            markAsRead();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hasInitiallyScrolled, currentKicker]);

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
            // If there's a deep link, scroll to that message instead
            if (deepLinkMessageId && !hasScrolledToDeepLink) {
                setHasInitiallyScrolled(true);
                setHasScrolledToDeepLink(true);
                // Small delay to ensure DOM is ready
                setTimeout(() => {
                    scrollToMessage(deepLinkMessageId);
                }, 100);
            } else {
                container.scrollTop = 0;
                setHasInitiallyScrolled(true);
            }
            prevMessageCountRef.current = messages.length;
        }
    }, [
        isLoadingMessages,
        isLoadingReactions,
        messages.length,
        hasInitiallyScrolled,
        deepLinkMessageId,
        hasScrolledToDeepLink,
        scrollToMessage,
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

    // Context menu: start whisper to player
    function handleWhisper(player) {
        if (!player) return;
        // Call the ChatInput's external whisper setter
        chatInputRef.current?.setWhisperRecipient(player);
        setTimeout(() => {
            focusInputRef.current?.();
        }, 50);
    }

    // Context menu: mention player in input
    function handleMention(player) {
        if (!player) return;
        // Call the ChatInput's external mention inserter
        chatInputRef.current?.insertMention(player);
        setTimeout(() => {
            focusInputRef.current?.();
        }, 50);
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

                                // Message is unread if:
                                // - Created after lastReadAt
                                // - Not from the current user
                                // - lastReadAt must be a valid date string
                                // - If no lastReadAt exists (null), all messages are considered READ
                                // TEMPORARILY DISABLED - all messages shown as read
                                const isUnread = false;
                                // const isUnread = Boolean(
                                //     currentPlayerId &&
                                //         message.player_id !== currentPlayerId &&
                                //         lastReadAt &&
                                //         typeof lastReadAt === "string" &&
                                //         lastReadAt.length > 0 &&
                                //         new Date(message.created_at) >
                                //             new Date(lastReadAt)
                                // );

                                // Check if we need a date divider
                                // Due to column-reverse, nextMessage is chronologically BEFORE current
                                // Show divider when this message is on a different day than the next (older) one
                                const currentDate = new Date(
                                    message.created_at
                                );
                                const nextDate = nextMessage
                                    ? new Date(nextMessage.created_at)
                                    : null;
                                const showDateDivider =
                                    !nextDate ||
                                    !isSameDay(currentDate, nextDate);

                                return (
                                    <React.Fragment key={message.id}>
                                        <ChatMessage
                                            message={message}
                                            currentPlayerId={currentPlayerId}
                                            isAdmin={isAdmin}
                                            onUpdate={updateChatMessage}
                                            onDelete={deleteChatMessage}
                                            isUpdating={isUpdating}
                                            isDeleting={isDeleting}
                                            messageReactions={
                                                messageReactionsMap[
                                                    message.id
                                                ] || {}
                                            }
                                            onToggleReaction={
                                                handleToggleReaction
                                            }
                                            isTogglingReaction={
                                                isTogglingReaction
                                            }
                                            onReply={handleReply}
                                            onScrollToMessage={
                                                handleScrollToMessage
                                            }
                                            isGrouped={isGrouped}
                                            isUnread={isUnread}
                                            onWhisper={handleWhisper}
                                            onMention={handleMention}
                                        />
                                        {showDateDivider && (
                                            <DateDividerContainer>
                                                <DateLabel>
                                                    {formatDateDivider(
                                                        currentDate
                                                    )}
                                                </DateLabel>
                                            </DateDividerContainer>
                                        )}
                                    </React.Fragment>
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

                <TypingIndicatorContainer $visible={!!typingText}>
                    {typingText && (
                        <>
                            <span>{typingText}</span>
                            <TypingDotsContainer>
                                <TypingDot $delay="0s" />
                                <TypingDot $delay="0.2s" />
                                <TypingDot $delay="0.4s" />
                            </TypingDotsContainer>
                        </>
                    )}
                </TypingIndicatorContainer>

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
                    ref={chatInputRef}
                    onSubmit={handleCreateMessage}
                    isSubmitting={isCreating}
                    currentPlayer={currentPlayer}
                    replyTo={replyTo}
                    onCancelReply={handleCancelReply}
                    lastWhisperFrom={lastWhisperFrom}
                    onTyping={onTyping}
                    stopTyping={stopTyping}
                    onFocusInput={(fn) => {
                        focusInputRef.current = fn;
                    }}
                />
            )}
        </>
    );
}

export default ChatTab;
