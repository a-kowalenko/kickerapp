import React from "react";
import styled from "styled-components";
import { useRef, useEffect, useMemo, useState, useCallback } from "react";
import { useSearchParams, useLocation } from "react-router-dom";
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
import { useKeyboard } from "../../contexts/KeyboardContext";
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
    -webkit-overflow-scrolling: touch;
    /* Force GPU acceleration for smoother rendering on mobile */
    will-change: transform;
    transform: translateZ(0);
    /* Ensure immediate paint on iOS Safari */
    backface-visibility: hidden;

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

const ChatTabWrapper = styled.div`
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
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
    const messagesEndRef = useRef(null);
    const loadMoreRef = useRef(null);
    const focusInputRef = useRef(null);
    const chatInputRef = useRef(null);
    const [showJumpToLatest, setShowJumpToLatest] = useState(false);
    const [newMessagesCount, setNewMessagesCount] = useState(0);
    const [replyTo, setReplyTo] = useState(null);
    const [lastWhisperFrom, setLastWhisperFrom] = useState(null);
    const [scrollTrigger, setScrollTrigger] = useState(0);
    const [hasInitiallyScrolled, setHasInitiallyScrolled] = useState(false);
    const [isContainerReady, setIsContainerReady] = useState(false);
    const [highlightedMessageId, setHighlightedMessageId] = useState(null);
    const [pendingScrollToMessageId, setPendingScrollToMessageId] =
        useState(null);
    const prevMessageCountRef = useRef(0);
    const isNearBottomRef = useRef(true);
    const prevFirstMessageIdRef = useRef(null);
    const pendingScrollRef = useRef(false);
    const hasMarkedAsReadRef = useRef(false);
    const lastScrollRequestRef = useRef(null);
    const [searchParams] = useSearchParams();
    const location = useLocation();

    // Get scroll target from location state (for same-page navigation)
    const scrollFromState = location.state?.scrollToMessageId;
    const scrollKey = location.state?.scrollKey;

    // Parse deep link from query param (e.g., ?scrollTo=message-123&_t=timestamp)
    const deepLinkMessageId = useMemo(() => {
        const scrollToParam = searchParams.get("scrollTo");
        if (scrollToParam && scrollToParam.startsWith("message-")) {
            return scrollToParam.replace("message-", "");
        }
        return null;
    }, [searchParams]);

    // Get timestamp param to detect new scroll requests for the same message
    const scrollTimestamp = searchParams.get("_t");

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
    const { isKeyboardOpen } = useKeyboard();

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

    // Detect new scroll request from URL params or location state
    useEffect(() => {
        const targetMessageId = deepLinkMessageId || scrollFromState;
        const scrollIdentifier = `${targetMessageId}-${
            scrollTimestamp || scrollKey
        }`;

        if (!targetMessageId) return;
        if (lastScrollRequestRef.current === scrollIdentifier) return;

        // New scroll request detected
        lastScrollRequestRef.current = scrollIdentifier;
        setPendingScrollToMessageId(targetMessageId);
        setHighlightedMessageId(null);
    }, [deepLinkMessageId, scrollTimestamp, scrollFromState, scrollKey]);

    // Handle pending scroll - try to find and scroll to message, or load more
    useEffect(() => {
        if (!pendingScrollToMessageId) return;
        if (isLoadingMessages || isFetchingNextPage) return;
        if (!messages?.length) return;

        const container = messagesContainerRef.current;
        if (!container) return;

        // Check if message exists in current messages
        const messageExists = messages.some(
            (m) => String(m.id) === String(pendingScrollToMessageId)
        );

        if (messageExists) {
            // Message found - scroll to it immediately
            const messageElement = container.querySelector(
                `[data-message-id="${pendingScrollToMessageId}"]`
            );

            if (messageElement) {
                // Use instant scroll to avoid issues with column-reverse layout
                messageElement.scrollIntoView({
                    behavior: "instant",
                    block: "center",
                });
                setHighlightedMessageId(String(pendingScrollToMessageId));
            }
            setPendingScrollToMessageId(null);

            // Clean up URL params (keep tab, remove scrollTo and _t)
            const currentParams = new URLSearchParams(window.location.search);
            currentParams.delete("scrollTo");
            currentParams.delete("_t");
            const newSearch = currentParams.toString();
            window.history.replaceState(
                null,
                "",
                `${window.location.pathname}${newSearch ? `?${newSearch}` : ""}`
            );
        } else if (hasNextPage) {
            // Message not in current batch - load more
            fetchNextPage();
        } else {
            // No more pages, message not found
            console.log(
                "[ChatTab] Message not found:",
                pendingScrollToMessageId
            );
            setPendingScrollToMessageId(null);
        }
    }, [
        pendingScrollToMessageId,
        isLoadingMessages,
        isFetchingNextPage,
        messages,
        hasNextPage,
        fetchNextPage,
    ]);

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

    // Helper function to reliably scroll to bottom (works with column-reverse on iOS)
    const scrollToBottomReliable = useCallback((container) => {
        if (!container) return;
        // For column-reverse, scrollTop = 0 is at the bottom (newest messages)
        // But iOS Safari sometimes needs both approaches
        container.scrollTop = 0;
        // Also try scrollTo as backup
        container.scrollTo?.({ top: 0, behavior: "instant" });
    }, []);

    // Fix iOS Safari scroll position after keyboard opens
    // When input is focused, iOS scrolls to show the input, but with column-reverse
    // this can scroll to the wrong position. We need to scroll back to bottom after keyboard opens.
    useEffect(() => {
        if (!isKeyboardOpen) return;

        const container = messagesContainerRef.current;
        if (!container) return;

        // Small delay to let iOS finish its default scroll behavior
        const timeoutId = setTimeout(() => {
            // Only scroll if we were near bottom before keyboard opened
            if (
                isNearBottomRef.current ||
                Math.abs(container.scrollTop) < 200
            ) {
                scrollToBottomReliable(container);
            }
        }, 100);

        return () => clearTimeout(timeoutId);
    }, [isKeyboardOpen, scrollToBottomReliable]);

    // Scroll to bottom when user sends a message
    // Scrolls once immediately, then listens for image loads
    useEffect(() => {
        if (scrollTrigger === 0) return;

        const container = messagesContainerRef.current;
        if (!container) {
            pendingScrollRef.current = false;
            return;
        }

        // Track if user has scrolled away - if so, stop auto-scrolling
        let userScrolledAway = false;
        let isCleanedUp = false;

        const scrollToBottom = () => {
            if (userScrolledAway || isCleanedUp) return;
            scrollToBottomReliable(container);
        };

        // Detect if user scrolls away (only after initial scroll settles)
        let scrollListenerEnabled = false;
        const handleUserScroll = () => {
            if (!scrollListenerEnabled) return;
            // If scrollTop is not near 0, user scrolled away
            if (Math.abs(container.scrollTop) > 100) {
                userScrolledAway = true;
            }
        };

        // Scroll immediately
        scrollToBottom();

        // Enable scroll listener after a brief delay to avoid false positives
        const enableTimeout = setTimeout(() => {
            scrollListenerEnabled = true;
        }, 300);

        // Add scroll listener to detect user interaction
        container.addEventListener("scroll", handleUserScroll, {
            passive: true,
        });

        // Track all image load handlers for cleanup
        const imageLoadHandlers = new Map();

        // Attach load listener to an image
        const observeImage = (img) => {
            if (!img.complete && !imageLoadHandlers.has(img)) {
                const handler = () => scrollToBottom();
                imageLoadHandlers.set(img, handler);
                img.addEventListener("load", handler, { once: true });
            }
        };

        // Observe all current images
        container.querySelectorAll("img").forEach(observeImage);

        // MutationObserver to catch new images added to DOM (e.g. GIFs loading)
        const mutationObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        if (node.tagName === "IMG") {
                            observeImage(node);
                        }
                        node.querySelectorAll?.("img").forEach(observeImage);
                    }
                });
            });
        });

        mutationObserver.observe(container, {
            childList: true,
            subtree: true,
        });

        // Also scroll after next paint and a few more times for iOS
        let frameCount = 0;
        let rafId;
        const scrollFrames = () => {
            scrollToBottom();
            frameCount++;
            if (frameCount < 10) {
                rafId = requestAnimationFrame(scrollFrames);
            } else {
                pendingScrollRef.current = false;
            }
        };
        rafId = requestAnimationFrame(scrollFrames);

        // Stop observing after 2 seconds
        const stopTimeout = setTimeout(() => {
            mutationObserver.disconnect();
        }, 2000);

        return () => {
            isCleanedUp = true;
            clearTimeout(enableTimeout);
            clearTimeout(stopTimeout);
            cancelAnimationFrame(rafId);
            mutationObserver.disconnect();
            container.removeEventListener("scroll", handleUserScroll);
            imageLoadHandlers.forEach((handler, img) => {
                img.removeEventListener("load", handler);
            });
            imageLoadHandlers.clear();
        };
    }, [scrollTrigger, scrollToBottomReliable]);

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

            // If we're actively sending a message, the scrollTrigger effect handles scrolling
            if (!pendingScrollRef.current) {
                const container = messagesContainerRef.current;
                const threshold = 100;
                const isCurrentlyNearBottom = container
                    ? Math.abs(container.scrollTop) < threshold
                    : true;

                if (isCurrentlyNearBottom) {
                    // Scroll using helper function
                    scrollToBottomReliable(container);
                } else {
                    setNewMessagesCount((prev) => prev + newCount);
                }
            }
        }

        prevMessageCountRef.current = messages.length;
        prevFirstMessageIdRef.current = currentFirstMessageId;
    }, [messages, currentPlayerId]);

    // Force repaint on mount (fixes mobile chat view on iOS Safari)
    useEffect(() => {
        const container = messagesContainerRef.current;
        if (!container) return;

        // Force a reflow/repaint to fix iOS Safari rendering issues
        // eslint-disable-next-line no-unused-expressions
        container.offsetHeight;
        container.style.transform = "translateZ(0)";

        // Scroll to bottom using scrollTop (column-reverse means 0 is bottom)
        container.scrollTop = 0;
        container.scrollTo?.({ top: 0, behavior: "instant" });
        setIsContainerReady(true);
    }, []); // Only on mount

    // Initial scroll - scroll to bottom when messages first loaded
    // Uses MutationObserver to catch dynamically loaded images
    useEffect(() => {
        if (isLoadingMessages || !messages.length || hasInitiallyScrolled)
            return;

        if (isLoadingReactions) return;

        const container = messagesContainerRef.current;
        if (!container) return;

        // Force reflow to fix iOS Safari rendering issues
        // eslint-disable-next-line no-unused-expressions
        container.offsetHeight;
        container.style.transform = "translateZ(0)";

        // Don't interfere if there's a deep link - let the scroll effect handle it
        if (!deepLinkMessageId) {
            // Track all image load handlers for cleanup
            const imageLoadHandlers = new Map();
            let isActive = true;

            const scrollToBottom = () => {
                if (!isActive) return;
                scrollToBottomReliable(container);
            };

            // Attach load listener to an image
            const observeImage = (img) => {
                if (!img.complete && !imageLoadHandlers.has(img)) {
                    const handler = () => scrollToBottom();
                    imageLoadHandlers.set(img, handler);
                    img.addEventListener("load", handler, { once: true });
                }
            };

            // Observe all current images
            container.querySelectorAll("img").forEach(observeImage);

            // MutationObserver to catch new images added to DOM (e.g. GIFs loading)
            const mutationObserver = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            // Check if the node itself is an image
                            if (node.tagName === "IMG") {
                                observeImage(node);
                            }
                            // Check for images within the added node
                            node.querySelectorAll?.("img").forEach(
                                observeImage
                            );
                        }
                    });
                });
            });

            mutationObserver.observe(container, {
                childList: true,
                subtree: true,
            });

            // Initial scroll
            scrollToBottom();

            // Scroll multiple times over ~300ms to handle iOS Safari delays
            let frameCount = 0;
            let rafId;
            const scrollFrames = () => {
                scrollToBottom();
                frameCount++;
                if (frameCount < 15) {
                    rafId = requestAnimationFrame(scrollFrames);
                }
            };
            rafId = requestAnimationFrame(scrollFrames);

            // Stop observing after 3 seconds (images should be loaded by then)
            const stopTimeout = setTimeout(() => {
                isActive = false;
                mutationObserver.disconnect();
            }, 3000);

            // Cleanup
            return () => {
                isActive = false;
                clearTimeout(stopTimeout);
                cancelAnimationFrame(rafId);
                mutationObserver.disconnect();
                imageLoadHandlers.forEach((handler, img) => {
                    img.removeEventListener("load", handler);
                });
                imageLoadHandlers.clear();
            };
        }

        setHasInitiallyScrolled(true);
        setIsContainerReady(true);
        prevMessageCountRef.current = messages.length;
    }, [
        isLoadingMessages,
        isLoadingReactions,
        messages.length,
        hasInitiallyScrolled,
        deepLinkMessageId,
        scrollToBottomReliable,
    ]);

    function handleJumpToLatest() {
        const container = messagesContainerRef.current;
        if (container) {
            scrollToBottomReliable(container);
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
            scrollToBottomReliable(container);
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
        // Focus input after state update using requestAnimationFrame
        requestAnimationFrame(() => {
            focusInputRef.current?.();
        });
    }

    function handleCancelReply() {
        setReplyTo(null);
    }

    // Context menu: start whisper to player
    function handleWhisper(player) {
        if (!player) return;
        // Call the ChatInput's external whisper setter
        chatInputRef.current?.setWhisperRecipient(player);
        requestAnimationFrame(() => {
            focusInputRef.current?.();
        });
    }

    // Context menu: mention player in input
    function handleMention(player) {
        if (!player) return;
        // Call the ChatInput's external mention inserter
        chatInputRef.current?.insertMention(player);
        requestAnimationFrame(() => {
            focusInputRef.current?.();
        });
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
            <ChatTabWrapper>
                <ContentWrapper>
                    <EmptyState>
                        <LoadingSpinner />
                    </EmptyState>
                </ContentWrapper>
            </ChatTabWrapper>
        );
    }

    return (
        <ChatTabWrapper>
            <ContentWrapper>
                <MessagesContainer
                    ref={messagesContainerRef}
                    onScroll={handleScroll}
                >
                    {/* Scroll anchor - visually at bottom due to column-reverse */}
                    <div
                        ref={messagesEndRef}
                        style={{ height: 0, width: "100%" }}
                    />
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
                                            isHighlighted={
                                                String(message.id) ===
                                                highlightedMessageId
                                            }
                                            onHighlightEnd={() =>
                                                setHighlightedMessageId(null)
                                            }
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
        </ChatTabWrapper>
    );
}

export default ChatTab;
