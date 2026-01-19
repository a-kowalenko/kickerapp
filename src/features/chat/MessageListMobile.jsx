import styled from "styled-components";
import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { format, isToday, isYesterday, isSameDay } from "date-fns";
import { HiChatBubbleLeftRight, HiChevronDoubleDown } from "react-icons/hi2";
import { useChatMessages } from "../home/useChatMessages";
import { useCreateChatMessage } from "../home/useCreateChatMessage";
import { useUpdateChatMessage } from "../home/useUpdateChatMessage";
import { useDeleteChatMessage } from "../home/useDeleteChatMessage";
import { useChatReactions } from "../home/useChatReactions";
import { useToggleChatReaction } from "../home/useToggleChatReaction";
import { useTypingIndicator } from "../home/useTypingIndicator";
import { useOwnPlayer } from "../../hooks/useOwnPlayer";
import { useKickerInfo } from "../../hooks/useKickerInfo";
import { useUser } from "../authentication/useUser";
import { useKicker } from "../../contexts/KickerContext";
import { useChatReadStatus } from "../../hooks/useChatReadStatus";
import { updateChatReadStatus } from "../../services/apiChat";
import useUnreadBadge from "../../hooks/useUnreadBadge";
import { useMessageVisibility } from "../../hooks/useMessageVisibility";
import ChatMessage from "../home/ChatMessage";
import ChatInputMobile from "./ChatInputMobile";
import LoadingSpinner from "../../ui/LoadingSpinner";
import SpinnerMini from "../../ui/SpinnerMini";
import EmojiPicker from "../../ui/EmojiPicker";
import CountBadge from "../../ui/CountBadge";
import { useKeyboard } from "../../contexts/KeyboardContext";

// Format date for dividers
function formatDateDivider(date) {
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";
    return format(date, "d. MMMM yyyy");
}

const Container = styled.div`
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
    position: relative;
`;

const MessagesWrapper = styled.div`
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    overflow-x: hidden;
    display: flex;
    flex-direction: column-reverse;
    gap: 0.4rem;
    padding: 0.5rem;
    -webkit-overflow-scrolling: touch;
    overscroll-behavior: contain;

    &::-webkit-scrollbar {
        width: 4px;
    }
    &::-webkit-scrollbar-thumb {
        background: var(--primary-border-color);
        border-radius: 2px;
    }
`;

const LoadMoreTrigger = styled.div`
    display: flex;
    justify-content: center;
    padding: 1rem;
    min-height: 40px;
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

const DateDivider = styled.div`
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.8rem 0;
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

const UnreadDivider = styled.div`
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.8rem 0;
    margin: 0.4rem 0;

    &::before,
    &::after {
        content: "";
        flex: 1;
        height: 1px;
        background-color: var(--color-red-700);
    }
`;

const UnreadLabel = styled.span`
    font-size: 1.2rem;
    color: var(--color-red-700);
    font-weight: 600;
    white-space: nowrap;
    text-transform: uppercase;
    letter-spacing: 0.05em;
`;

const TypingIndicator = styled.div`
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.4rem 1rem;
    font-size: 1.2rem;
    color: var(--tertiary-text-color);
    font-style: italic;
    min-height: 2rem;
    opacity: ${(props) => (props.$visible ? 1 : 0)};
    transition: opacity 0.2s;
`;

const TypingDots = styled.span`
    display: inline-flex;
    gap: 0.3rem;
`;

const TypingDot = styled.span`
    width: 0.6rem;
    height: 0.6rem;
    background-color: var(--tertiary-text-color);
    border-radius: 50%;
    animation: bounce 1.4s ease-in-out infinite;
    animation-delay: ${(props) => props.$delay || "0s"};

    @keyframes bounce {
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

const JumpToBottom = styled.button`
    position: absolute;
    bottom: 80px;
    right: 16px;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background-color: var(--primary-button-color);
    color: white;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    opacity: ${(props) => (props.$visible ? 1 : 0)};
    transform: ${(props) => (props.$visible ? "scale(1)" : "scale(0.8)")};
    pointer-events: ${(props) => (props.$visible ? "auto" : "none")};
    transition:
        opacity 0.2s,
        transform 0.2s;
    z-index: 10;

    & svg {
        font-size: 2rem;
    }
`;

function MessageListMobile({
    scrollToMessageId,
    scrollTimestamp,
    onScrollComplete,
}) {
    const containerRef = useRef(null);
    const loadMoreRef = useRef(null);
    const chatInputRef = useRef(null);
    const inputContainerRef = useRef(null);
    const lastScrollRequestRef = useRef(null);
    const isAtBottomRef = useRef(true);
    const hasMarkedAsReadRef = useRef(false);

    // Swipe-to-dismiss keyboard refs
    const touchStartTimeRef = useRef(null);
    const entryYRef = useRef(null);
    const isDraggingKeyboardRef = useRef(false);

    const [highlightedMessageId, setHighlightedMessageId] = useState(null);
    const [pendingScrollId, setPendingScrollId] = useState(null);
    const [showJumpToBottom, setShowJumpToBottom] = useState(false);
    const [newMessagesCount, setNewMessagesCount] = useState(0);
    const [replyTo, setReplyTo] = useState(null);
    const [lastWhisperFrom, setLastWhisperFrom] = useState(null);
    const [inputDragOffset, setInputDragOffset] = useState(0);
    const [reactionPickerMessageId, setReactionPickerMessageId] =
        useState(null);

    // Hooks
    const {
        messages,
        isLoading,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useChatMessages();

    const { createChatMessage, isCreating } = useCreateChatMessage();
    const { updateChatMessage, isUpdating } = useUpdateChatMessage();
    const { deleteChatMessage, isDeleting } = useDeleteChatMessage();

    const messageIds = useMemo(
        () => messages?.map((m) => m.id) || [],
        [messages],
    );
    const { groupedByMessage: messageReactionsMap } =
        useChatReactions(messageIds);
    const { toggleReaction, isToggling: isTogglingReaction } =
        useToggleChatReaction();

    const { data: currentPlayer } = useOwnPlayer();
    const { data: kickerData } = useKickerInfo();
    const { user } = useUser();
    const { currentKicker } = useKicker();

    const isAdmin = kickerData?.admin === user?.id;
    const currentPlayerId = currentPlayer?.id;

    const { invalidateUnreadBadge } = useUnreadBadge(user?.id);
    const { lastReadAt, invalidate: invalidateChatReadStatus } =
        useChatReadStatus(currentKicker);

    // Store the initial lastReadAt when component mounts to show unread divider
    // This stays constant during the session so the divider doesn't jump around
    const initialLastReadAtRef = useRef(null);
    // Track whether we've already cleared the divider (once read, stay cleared)
    const dividerClearedRef = useRef(false);

    // Capture initial lastReadAt SYNCHRONOUSLY on first available value
    // This ensures the divider shows on the very first render when data is ready
    if (lastReadAt && initialLastReadAtRef.current === null) {
        initialLastReadAtRef.current = lastReadAt;
    }

    // Clear divider once all messages are read (lastReadAt catches up)
    // Only runs AFTER the initial capture, when lastReadAt actually changes
    useEffect(() => {
        // Skip if not yet captured initial value or already cleared
        if (!initialLastReadAtRef.current || dividerClearedRef.current) return;
        if (!messages?.length || !lastReadAt) return;

        // Only clear if lastReadAt has actually changed from initial
        if (lastReadAt === initialLastReadAtRef.current) return;

        // Find the newest message not from current user
        const newestOtherMessage = messages.find(
            (m) => m.player_id !== currentPlayerId,
        );
        if (!newestOtherMessage) return;

        // If lastReadAt is now >= newest other message, clear the divider
        if (new Date(lastReadAt) >= new Date(newestOtherMessage.created_at)) {
            dividerClearedRef.current = true;
        }
    }, [lastReadAt, messages, currentPlayerId]);

    // Reset refs when kicker changes
    useEffect(() => {
        initialLastReadAtRef.current = null;
        dividerClearedRef.current = false;
    }, [currentKicker]);

    const { typingText, onTyping, stopTyping } =
        useTypingIndicator(currentPlayerId);
    const { isKeyboardOpen, blurInput } = useKeyboard();

    // Mark as read - called when messages are confirmed visible
    const markAsRead = useCallback(async () => {
        if (!currentKicker || hasMarkedAsReadRef.current) return;
        hasMarkedAsReadRef.current = true;
        try {
            await updateChatReadStatus(currentKicker);
            invalidateUnreadBadge();
            invalidateChatReadStatus();
        } catch (error) {
            console.error("Error marking chat as read:", error);
        } finally {
            setTimeout(() => {
                hasMarkedAsReadRef.current = false;
            }, 500); // Reduced from 1000ms for faster response
        }
    }, [currentKicker, invalidateUnreadBadge, invalidateChatReadStatus]);

    // Callback when a message is seen (50% visible for 300ms)
    const handleMessageSeen = useCallback(() => {
        markAsRead();
    }, [markAsRead]);

    // Message visibility tracking (WhatsApp/Discord-style)
    const { observeMessages, resetTracking } = useMessageVisibility({
        containerRef,
        onMessageSeen: handleMessageSeen,
        lastReadAt,
        currentPlayerId,
        enabled: !isLoading && !!messages?.length,
    });

    // Re-observe messages when they change
    useEffect(() => {
        if (messages?.length) {
            // Small delay to ensure DOM is updated
            requestAnimationFrame(() => {
                observeMessages();
            });
        }
    }, [messages, observeMessages]);

    // Reset tracking when kicker changes
    useEffect(() => {
        resetTracking();
    }, [currentKicker, resetTracking]);

    // Handle deep link scroll request
    useEffect(() => {
        if (!scrollToMessageId) return;
        const scrollIdentifier = `${scrollToMessageId}-${scrollTimestamp}`;
        if (lastScrollRequestRef.current === scrollIdentifier) return;

        lastScrollRequestRef.current = scrollIdentifier;
        setPendingScrollId(scrollToMessageId);
        setHighlightedMessageId(null);
    }, [scrollToMessageId, scrollTimestamp]);

    // Execute pending scroll
    useEffect(() => {
        if (
            !pendingScrollId ||
            isLoading ||
            isFetchingNextPage ||
            !messages?.length
        )
            return;

        const container = containerRef.current;
        if (!container) return;

        const messageExists = messages.some(
            (m) => String(m.id) === String(pendingScrollId),
        );

        if (messageExists) {
            const element = container.querySelector(
                `[data-message-id="${pendingScrollId}"]`,
            );
            if (element) {
                element.scrollIntoView({
                    behavior: "instant",
                    block: "center",
                });
                setHighlightedMessageId(String(pendingScrollId));
            }
            setPendingScrollId(null);
            onScrollComplete?.();
        } else if (hasNextPage) {
            fetchNextPage();
        } else {
            setPendingScrollId(null);
            onScrollComplete?.();
        }
    }, [
        pendingScrollId,
        isLoading,
        isFetchingNextPage,
        messages,
        hasNextPage,
        fetchNextPage,
        onScrollComplete,
    ]);

    // Scroll handling - show/hide jump button, visibility hook handles read status
    const handleScroll = useCallback(() => {
        const container = containerRef.current;
        if (!container) return;

        // column-reverse: scrollTop 0 = bottom, negative = scrolled up
        const atBottom = Math.abs(container.scrollTop) < 100;
        isAtBottomRef.current = atBottom;

        if (atBottom) {
            setShowJumpToBottom(false);
            setNewMessagesCount(0);
        } else {
            setShowJumpToBottom(true);
        }
    }, []);

    // Scroll to bottom helper with iOS Safari retry mechanism
    const scrollToBottom = useCallback(
        (behavior = "instant", retryCount = 3) => {
            const doScroll = () => {
                const container = containerRef.current;
                if (!container) return;
                // column-reverse: scrollTop 0 = bottom
                container.scrollTo({ top: 0, behavior });
            };

            // iOS Safari sometimes ignores scroll during layout - retry mechanism
            let remaining = retryCount;
            const attemptScroll = () => {
                doScroll();
                remaining--;
                if (remaining > 0) {
                    requestAnimationFrame(attemptScroll);
                }
            };
            requestAnimationFrame(attemptScroll);
        },
        [],
    );

    // Infinite scroll - IntersectionObserver
    useEffect(() => {
        const container = containerRef.current;
        const trigger = loadMoreRef.current;
        if (!container || !trigger || !hasNextPage) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !isFetchingNextPage) {
                    fetchNextPage();
                }
            },
            { root: container, threshold: 0.1 },
        );

        observer.observe(trigger);
        return () => observer.disconnect();
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    // Track new messages
    const prevMessagesLengthRef = useRef(0);
    const prevFirstMessageIdRef = useRef(null);

    useEffect(() => {
        if (!messages?.length) return;

        const firstId = messages[0]?.id;
        const prevLength = prevMessagesLengthRef.current;
        const prevFirstId = prevFirstMessageIdRef.current;
        const newCount = messages.length - prevLength;

        // New message arrived (not loading older messages)
        if (newCount > 0 && prevLength > 0 && firstId !== prevFirstId) {
            const latestMessage = messages[0];

            // Track whisper for /r command
            if (
                latestMessage?.recipient_id === currentPlayerId &&
                latestMessage?.player_id !== currentPlayerId
            ) {
                setLastWhisperFrom(latestMessage.player);
            }

            // Defer scroll check to after DOM settles (iOS Safari timing issue)
            requestAnimationFrame(() => {
                const container = containerRef.current;
                // column-reverse: scrollTop near 0 = at bottom
                const isCurrentlyAtBottom = container
                    ? Math.abs(container.scrollTop) < 150
                    : true;

                // Only auto-scroll if user is at/near bottom, otherwise show badge
                if (isCurrentlyAtBottom) {
                    scrollToBottom();
                    // Note: markAsRead is now handled by visibility observer
                    setShowJumpToBottom(false);
                    setNewMessagesCount(0);
                } else {
                    // User has scrolled up - show new message count on jump button
                    setNewMessagesCount((prev) => prev + newCount);
                    setShowJumpToBottom(true);
                }
            });
        }

        prevMessagesLengthRef.current = messages.length;
        prevFirstMessageIdRef.current = firstId;
    }, [messages, currentPlayerId, scrollToBottom]);

    // Keep scroll at bottom when content size changes (images/GIFs loading)
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const resizeObserver = new ResizeObserver(() => {
            // Only auto-scroll if we're supposed to be at bottom
            if (isAtBottomRef.current) {
                container.scrollTo({ top: 0, behavior: "instant" });
            }
        });

        // Observe the scrollable content area
        if (container.firstElementChild) {
            resizeObserver.observe(container.firstElementChild);
        }

        return () => resizeObserver.disconnect();
    }, [messages?.length]); // Re-attach when message count changes

    // Note: Initial mark as read is now handled by visibility observer

    // Swipe-to-dismiss keyboard handlers
    const handleTouchStart = useCallback(() => {
        touchStartTimeRef.current = Date.now();
        // Reset drag state on new touch
        entryYRef.current = null;
        isDraggingKeyboardRef.current = false;
    }, []);

    const handleTouchMove = useCallback(
        (e) => {
            if (!inputContainerRef.current) return;

            const touchY = e.touches[0].clientY;
            const inputRect = inputContainerRef.current.getBoundingClientRect();

            // Check if touch entered the input area while keyboard is open
            if (touchY >= inputRect.top && isKeyboardOpen) {
                if (!isDraggingKeyboardRef.current) {
                    // First entry into input area - start drag and immediately blur
                    // This closes the keyboard while we animate the input
                    entryYRef.current = touchY;
                    isDraggingKeyboardRef.current = true;
                    blurInput();
                }
            }

            // If dragging, update offset (drag persists even if finger moves back up)
            if (isDraggingKeyboardRef.current && entryYRef.current !== null) {
                const dragOffset = Math.max(0, touchY - entryYRef.current);
                setInputDragOffset(dragOffset);
            }
        },
        [isKeyboardOpen, blurInput],
    );

    const handleTouchEnd = useCallback(() => {
        if (!isDraggingKeyboardRef.current) return;

        // Reset drag state with animation (keyboard already closed on drag start)
        isDraggingKeyboardRef.current = false;
        entryYRef.current = null;
        setInputDragOffset(0);
    }, []);

    // Jump to bottom
    const handleJumpToBottom = useCallback(() => {
        scrollToBottom("smooth");
        setShowJumpToBottom(false);
        setNewMessagesCount(0);
    }, [scrollToBottom]);

    // Send message
    const handleSendMessage = useCallback(
        async (messageData) => {
            if (replyTo) {
                messageData.reply_to_id = replyTo.id;
            }
            // Ensure we scroll to bottom when our message arrives
            isAtBottomRef.current = true;
            await createChatMessage(messageData);
            setReplyTo(null);
            stopTyping();
        },
        [createChatMessage, replyTo, stopTyping],
    );

    // Handle whisper from context menu
    const handleWhisper = useCallback((player) => {
        chatInputRef.current?.setWhisperRecipient?.(player);
    }, []);

    // Handle mention from context menu
    const handleMention = useCallback((player) => {
        chatInputRef.current?.insertMention?.(player);
        chatInputRef.current?.focus?.();
    }, []);

    // Handle opening reaction picker from context menu
    const handleOpenReactionPicker = useCallback((messageId) => {
        setReactionPickerMessageId(messageId);
    }, []);

    // Handle emoji selection for reaction
    const handleReactionEmojiSelect = useCallback(
        (emoji) => {
            if (reactionPickerMessageId) {
                toggleReaction({ messageId: reactionPickerMessageId, emoji });
                setReactionPickerMessageId(null);
            }
        },
        [reactionPickerMessageId, toggleReaction],
    );

    // Prepare messages with date dividers and unread divider
    const messagesWithDividers = useMemo(() => {
        if (!messages?.length) return [];

        const result = [];
        const initialLastRead = initialLastReadAtRef.current;
        const dividerCleared = dividerClearedRef.current;
        let unreadDividerInserted = false;

        // Messages come newest-first, we display newest at bottom with column-reverse
        // With column-reverse, array index 0 appears at bottom, last index at top
        // So dividers need to come AFTER messages in array to appear ABOVE them visually
        for (let i = 0; i < messages.length; i++) {
            const msg = messages[i];
            const msgDate = new Date(msg.created_at);

            // Push message first
            result.push({ type: "message", data: msg, key: msg.id });

            // Check if we need an unread divider
            // Insert it AFTER the oldest unread message (so it appears ABOVE it visually)
            // Don't show if divider has been cleared (messages have been read)
            if (
                !unreadDividerInserted &&
                !dividerCleared &&
                initialLastRead &&
                msg.player_id !== currentPlayerId
            ) {
                const nextMsg = messages[i + 1];
                const msgIsUnread =
                    new Date(msg.created_at) > new Date(initialLastRead);
                const nextMsgIsRead =
                    !nextMsg ||
                    new Date(nextMsg.created_at) <= new Date(initialLastRead) ||
                    nextMsg.player_id === currentPlayerId;

                if (msgIsUnread && nextMsgIsRead) {
                    result.push({
                        type: "unread",
                        key: "unread-divider",
                    });
                    unreadDividerInserted = true;
                }
            }

            // Check if we need a date divider (comparing with next older message)
            const nextMsg = messages[i + 1];
            if (nextMsg) {
                const nextDate = new Date(nextMsg.created_at);
                if (!isSameDay(msgDate, nextDate)) {
                    // Different day - add divider for current message's date
                    result.push({
                        type: "divider",
                        date: msgDate,
                        key: `divider-${msg.id}`,
                    });
                }
            } else {
                // Oldest message in batch - show its date divider above it
                result.push({
                    type: "divider",
                    date: msgDate,
                    key: `divider-${msg.id}`,
                });
            }
        }

        return result;
    }, [messages, currentPlayerId]);

    // Check if message is unread (only other people's messages can be unread)
    const isMessageUnread = useCallback(
        (message) => {
            if (!lastReadAt) return false;
            // Own messages are never marked as unread
            if (message.player_id === currentPlayerId) return false;
            return new Date(message.created_at) > new Date(lastReadAt);
        },
        [lastReadAt, currentPlayerId],
    );

    // Group messages by sender
    const shouldGroupMessage = useCallback((current, previous) => {
        if (!previous || previous.type !== "message") return false;
        const currentMsg = current.data;
        const prevMsg = previous.data;
        if (currentMsg.player_id !== prevMsg.player_id) return false;
        const timeDiff =
            new Date(prevMsg.created_at) - new Date(currentMsg.created_at);
        return timeDiff < 5 * 60 * 1000; // 5 minutes
    }, []);

    if (isLoading) {
        return (
            <Container>
                <EmptyState>
                    <LoadingSpinner />
                </EmptyState>
            </Container>
        );
    }

    if (!messages?.length) {
        return (
            <Container
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                <EmptyState>
                    <HiChatBubbleLeftRight />
                    <span>No messages yet. Start the conversation!</span>
                </EmptyState>
                <ChatInputMobile
                    ref={chatInputRef}
                    containerRef={inputContainerRef}
                    dragOffset={inputDragOffset}
                    onSubmit={handleSendMessage}
                    isSubmitting={isCreating}
                    onTyping={onTyping}
                    stopTyping={stopTyping}
                />
            </Container>
        );
    }

    return (
        <Container
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            <MessagesWrapper ref={containerRef} onScroll={handleScroll}>
                {/* Typing indicator at bottom (newest) */}
                <TypingIndicator $visible={!!typingText}>
                    {typingText}
                    <TypingDots>
                        <TypingDot $delay="0s" />
                        <TypingDot $delay="0.2s" />
                        <TypingDot $delay="0.4s" />
                    </TypingDots>
                </TypingIndicator>

                {messagesWithDividers.map((item, index) => {
                    if (item.type === "divider") {
                        return (
                            <DateDivider key={item.key}>
                                <DateLabel>
                                    {formatDateDivider(item.date)}
                                </DateLabel>
                            </DateDivider>
                        );
                    }

                    if (item.type === "unread") {
                        return (
                            <UnreadDivider key={item.key}>
                                <UnreadLabel>Unread messages</UnreadLabel>
                            </UnreadDivider>
                        );
                    }

                    const msg = item.data;
                    const prevItem = messagesWithDividers[index + 1];
                    const isGrouped = shouldGroupMessage(item, prevItem);
                    const reactions = messageReactionsMap?.[msg.id] || [];

                    return (
                        <ChatMessage
                            key={msg.id}
                            message={msg}
                            isOwnMessage={msg.player_id === currentPlayerId}
                            isAdmin={isAdmin}
                            isGrouped={isGrouped}
                            isUnread={isMessageUnread(msg)}
                            isHighlighted={
                                highlightedMessageId === String(msg.id)
                            }
                            reactions={reactions}
                            currentPlayerId={currentPlayerId}
                            onEdit={(id, content) =>
                                updateChatMessage({ id, content })
                            }
                            onDelete={(id) => deleteChatMessage(id)}
                            onReply={(message) => {
                                setReplyTo(message);
                                chatInputRef.current?.focus?.();
                            }}
                            onReaction={(emoji) =>
                                toggleReaction({ messageId: msg.id, emoji })
                            }
                            isUpdating={isUpdating}
                            isDeleting={isDeleting}
                            isTogglingReaction={isTogglingReaction}
                            stackIndex={messagesWithDividers.length - index}
                            onWhisper={handleWhisper}
                            onMention={handleMention}
                            onFocusInput={() => chatInputRef.current?.focus?.()}
                            onOpenReactionPicker={() =>
                                handleOpenReactionPicker(msg.id)
                            }
                        />
                    );
                })}

                {/* Load more trigger at top (oldest) */}
                <LoadMoreTrigger ref={loadMoreRef}>
                    {isFetchingNextPage && <SpinnerMini />}
                </LoadMoreTrigger>
            </MessagesWrapper>

            <JumpToBottom
                $visible={showJumpToBottom}
                onClick={handleJumpToBottom}
            >
                <HiChevronDoubleDown />
                <CountBadge
                    count={newMessagesCount}
                    size="sm"
                    position="absolute"
                    top="-4px"
                    right="-4px"
                />
            </JumpToBottom>

            {/* Reaction emoji picker - positioned above ChatInputMobile */}
            {reactionPickerMessageId && (
                <EmojiPicker
                    onSelect={handleReactionEmojiSelect}
                    onClose={() => setReactionPickerMessageId(null)}
                    position="top"
                    align="left"
                    triggerRef={inputContainerRef}
                />
            )}

            <ChatInputMobile
                ref={chatInputRef}
                containerRef={inputContainerRef}
                dragOffset={inputDragOffset}
                onSubmit={handleSendMessage}
                isSubmitting={isCreating}
                replyTo={replyTo}
                onCancelReply={() => setReplyTo(null)}
                lastWhisperFrom={lastWhisperFrom}
                onTyping={onTyping}
                stopTyping={stopTyping}
            />
        </Container>
    );
}

export default MessageListMobile;
