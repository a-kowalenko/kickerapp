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
import ChatMessage from "./ChatMessage";
import ChatInput from "./ChatInput";
import LoadingSpinner from "../../ui/LoadingSpinner";
import SpinnerMini from "../../ui/SpinnerMini";
import { media } from "../../utils/constants";
import ContentBox from "../../ui/ContentBox";
import Heading from "../../ui/Heading";
import Row from "../../ui/Row";

const StyledChatSection = styled(ContentBox)`
    grid-area: 4 / 1 / 5 / 5;

    @media (max-width: 1350px) {
        grid-area: 6 / 1 / 7 / 3;
    }
`;

const ChatContainer = styled.div`
    display: flex;
    flex-direction: column;
    overflow: visible;
    height: 70rem;
    position: relative;
    border: 1px solid var(--primary-border-color);
    border-radius: var(--border-radius-md);
    background-color: var(--secondary-background-color);

    ${media.tablet} {
        height: 50rem;
    }
`;

const OnlineBadge = styled.span`
    font-size: 1.4rem;
    font-weight: 400;
    color: var(--tertiary-text-color);
    text-transform: none;
`;

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

const JumpToLatestButton = styled.button`
    position: absolute;
    bottom: 8rem;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.6rem 1.2rem;
    background-color: var(--primary-button-color);
    color: var(--primary-button-color-text);
    border: none;
    border-radius: var(--border-radius-pill);
    font-size: 1.2rem;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    transition: all 0.2s;
    z-index: 10;

    &:hover {
        background-color: var(--primary-button-color-hover);
        transform: translateX(-50%) scale(1.05);
    }

    & svg {
        font-size: 1.4rem;
    }
`;

const NewMessagesBadge = styled.span`
    background-color: var(--color-red-700);
    color: white;
    padding: 0.2rem 0.6rem;
    border-radius: var(--border-radius-pill);
    font-size: 1rem;
    margin-left: 0.4rem;
`;

const ContentWrapper = styled.div`
    display: flex;
    flex-direction: column;
    flex: 1;
    position: relative;
    min-height: 0;
`;

function ChatSection() {
    const messagesContainerRef = useRef(null);
    const loadMoreRef = useRef(null);
    const focusInputRef = useRef(null);
    const [showJumpToLatest, setShowJumpToLatest] = useState(false);
    const [newMessagesCount, setNewMessagesCount] = useState(0);
    const [replyTo, setReplyTo] = useState(null);
    const [lastWhisperFrom, setLastWhisperFrom] = useState(null);
    const [scrollTrigger, setScrollTrigger] = useState(0); // Counter to trigger scroll
    const [hasInitiallyScrolled, setHasInitiallyScrolled] = useState(false);
    const prevMessageCountRef = useRef(0);
    const isNearBottomRef = useRef(true);
    const prevFirstMessageIdRef = useRef(null);
    const pendingScrollRef = useRef(false); // Track if we're waiting to scroll

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

    // Typing indicator
    const { typingText, onTyping, stopTyping } =
        useTypingIndicator(currentPlayerId);

    // Mark messages as read and clear badge when chat is viewed
    const markAsRead = useCallback(async () => {
        if (!currentKicker) return;
        try {
            await updateChatReadStatus(currentKicker);

            // Clear app badge (works for Android/Desktop PWA)
            // Note: iOS PWA badge can only be set via APNs push, not cleared via JS
            if ("clearAppBadge" in navigator) {
                navigator.clearAppBadge().catch(() => {});
            }

            // Notify service worker to clear badge count (for next local increment)
            if (navigator.serviceWorker?.controller) {
                navigator.serviceWorker.controller.postMessage({
                    type: "CLEAR_BADGE",
                });
            }
        } catch (error) {
            console.error("Error marking chat as read:", error);
        }
    }, [currentKicker]);

    // Track if user is viewing the chat (at bottom of messages)
    const markAsReadIfAtBottom = useCallback(() => {
        // Only mark as read if user is at the bottom (seeing newest messages)
        if (isNearBottomRef.current && currentKicker && hasInitiallyScrolled) {
            markAsRead();
        }
    }, [currentKicker, hasInitiallyScrolled, markAsRead]);

    // Mark as read when user scrolls to bottom
    useEffect(() => {
        if (hasInitiallyScrolled && currentKicker && isNearBottomRef.current) {
            // Small delay to ensure user is actually viewing the chat
            const timer = setTimeout(() => {
                if (isNearBottomRef.current) {
                    markAsRead();
                }
            }, 1000); // 1 second delay
            return () => clearTimeout(timer);
        }
    }, [hasInitiallyScrolled, currentKicker, markAsRead]);

    // Mark as read when tab becomes visible AND user is at bottom
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible" && currentKicker) {
                // Delay to let the scroll position settle
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
        // With column-reverse, scrollTop increases as user scrolls UP
        const nearBottom = Math.abs(container.scrollTop) < threshold;
        const wasNearBottom = isNearBottomRef.current;
        isNearBottomRef.current = nearBottom;

        if (nearBottom) {
            // User scrolled back to bottom - hide button and reset counter
            setShowJumpToLatest(false);
            setNewMessagesCount(0);

            // Mark as read when user scrolls to bottom
            if (!wasNearBottom && currentKicker) {
                markAsRead();
            }
        } else {
            // User scrolled away from bottom - show jump button immediately
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
    // Uses a counter (scrollTrigger) instead of boolean to ensure it runs every time
    useEffect(() => {
        if (scrollTrigger === 0) return;

        const container = messagesContainerRef.current;
        if (!container) return;

        const scrollToBottom = () => {
            // With column-reverse, scrollTop = 0 is at the bottom (newest messages)
            // Force the scroll by setting it multiple ways
            container.scrollTop = 0;
            // Also try scrollTo as a fallback
            try {
                container.scrollTo(0, 0);
            } catch (e) {
                // Ignore if not supported
            }
        };

        // Use MutationObserver to scroll when DOM changes (message gets added)
        const mutationObserver = new MutationObserver(() => {
            scrollToBottom();
        });

        mutationObserver.observe(container, { childList: true, subtree: true });

        // Also do immediate and timed scrolls for reliability
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

        // Only treat as "new messages" if:
        // 1. There are more messages than before
        // 2. The first message (newest) has changed - this means a NEW message arrived
        //    If only older messages were loaded (infinite scroll), the first message stays the same
        const hasNewRecentMessages =
            newCount > 0 &&
            prevMessageCountRef.current > 0 &&
            currentFirstMessageId !== prevFirstMessageIdRef.current;

        if (hasNewRecentMessages) {
            // Update last whisper sender (for /r command)
            // With column-reverse order, newest message is at index 0
            const latestMessage = messages[0];
            if (
                latestMessage?.recipient_id === currentPlayerId &&
                latestMessage?.player_id !== currentPlayerId
            ) {
                // Someone whispered to us
                setLastWhisperFrom(latestMessage.player);
            }

            // Skip scroll handling if we're waiting for our own message to arrive
            if (!pendingScrollRef.current) {
                // Check current scroll position synchronously
                const container = messagesContainerRef.current;
                const threshold = 100;
                const isCurrentlyNearBottom = container
                    ? Math.abs(container.scrollTop) < threshold
                    : true;

                if (isCurrentlyNearBottom) {
                    // User is near bottom - auto-scroll to show new message
                    if (container) {
                        setTimeout(() => {
                            container.scrollTop = 0;
                        }, 50);
                    }
                } else {
                    // User is scrolled up - increment the new messages badge
                    // Button is already shown via handleScroll
                    setNewMessagesCount((prev) => prev + newCount);
                }
            }
        }

        prevMessageCountRef.current = messages.length;
        prevFirstMessageIdRef.current = currentFirstMessageId;
    }, [messages, currentPlayerId]);

    // Initial scroll - with column-reverse, scrollTop=0 is already at bottom (newest)
    useEffect(() => {
        if (isLoadingMessages || !messages.length || hasInitiallyScrolled)
            return;

        // Wait for reactions to load before marking as scrolled
        if (isLoadingReactions) return;

        const container = messagesContainerRef.current;
        if (container) {
            // With column-reverse, scrollTop=0 means bottom (newest messages)
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
        // With column-reverse, scrollTop=0 is bottom (newest)
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
            // Add highlight effect
            messageElement.classList.add("highlight");
            setTimeout(() => {
                messageElement.classList.remove("highlight");
            }, 2000);
        }
    }

    function handleCreateMessage({ content, recipientId, replyToId }) {
        if (!currentPlayerId) return;

        // Mark that we're sending a message - prevents interference from incoming message handler
        pendingScrollRef.current = true;

        // Immediately scroll to bottom
        const container = messagesContainerRef.current;
        if (container) {
            container.scrollTop = 0;
        }

        // Hide jump button and reset counter since we're scrolling to bottom
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

        // Trigger the scroll effect to ensure we stay at bottom after message renders
        setScrollTrigger((prev) => prev + 1);

        // Update the near-bottom ref since we just scrolled there
        isNearBottomRef.current = true;

        // Refocus input after sending - ensures focus is retained on both mobile and desktop
        requestAnimationFrame(() => {
            focusInputRef.current?.();
        });
    }

    function handleReply(message) {
        setReplyTo(message);
        // Focus input after setting reply
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

    if (isLoadingMessages) {
        return (
            <StyledChatSection>
                <Row type="horizontal">
                    <Heading as="h2">Kicker Chat</Heading>
                </Row>
                <ChatContainer>
                    <EmptyState>
                        <LoadingSpinner />
                    </EmptyState>
                </ChatContainer>
            </StyledChatSection>
        );
    }

    return (
        <StyledChatSection>
            <Row type="horizontal">
                <Heading as="h2">
                    Kicker Chat{" "}
                    <OnlineBadge>
                        ({messages?.length || 0} messages)
                    </OnlineBadge>
                </Heading>
            </Row>

            <ChatContainer>
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
                                {/* Messages - with column-reverse, first item appears at bottom */}
                                {messages?.map((message) => (
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
                                    />
                                ))}
                                {/* Load more trigger - with column-reverse, last item appears at top */}
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

                    {/* Typing indicator */}
                    <TypingIndicator>{typingText}</TypingIndicator>

                    {/* Jump to latest button */}
                    {showJumpToLatest && (
                        <JumpToLatestButton onClick={handleJumpToLatest}>
                            <HiChevronDoubleDown />
                            Jump to latest
                            {newMessagesCount > 0 && (
                                <NewMessagesBadge>
                                    {newMessagesCount}
                                </NewMessagesBadge>
                            )}
                        </JumpToLatestButton>
                    )}
                </ContentWrapper>

                {/* Chat Input */}
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
            </ChatContainer>
        </StyledChatSection>
    );
}

export default ChatSection;
