import React from "react";
import styled from "styled-components";
import {
    useRef,
    useEffect,
    useLayoutEffect,
    useMemo,
    useState,
    useCallback,
} from "react";
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
import useWindowWidth from "../../hooks/useWindowWidth";
import { media } from "../../utils/constants";

const MessagesContainer = styled.div`
    display: flex;
    /* Desktop: column-reverse (newest at bottom, scrollTop=0 is bottom) */
    /* Mobile: column with reversed array (more reliable on iOS Safari) */
    flex-direction: ${(props) =>
        props.$isMobile ? "column" : "column-reverse"};
    gap: 0.6rem;
    overflow-y: auto;
    overflow-x: hidden;
    flex: 1;
    padding: 1rem;
    position: relative;
    -webkit-overflow-scrolling: touch;
    /* Disable browser auto scroll anchoring - we handle it manually for infinite scroll */
    overflow-anchor: none;
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

// Overlay that covers the chat while media is loading
const MediaLoadingOverlay = styled.div`
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--primary-background-color);
    z-index: 10;
    opacity: ${(props) => (props.$isVisible ? 1 : 0)};
    visibility: ${(props) => (props.$isVisible ? "visible" : "hidden")};
    transition: opacity 0.2s ease-out, visibility 0.2s ease-out;
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
    // Track media loading state - wait for images before showing chat
    const [isMediaLoading, setIsMediaLoading] = useState(true);
    const mediaLoadTimeoutRef = useRef(null);
    const prevMessageCountRef = useRef(0);
    const isNearBottomRef = useRef(true);
    const prevFirstMessageIdRef = useRef(null);
    const pendingScrollRef = useRef(false);
    const hasMarkedAsReadRef = useRef(false);
    const lastScrollRequestRef = useRef(null);
    // Scroll restoration for infinite scroll (mobile) - anchor-based approach
    // Instead of saving scrollTop/scrollHeight, we save the first visible message ID
    // and its offset from the container top, then restore relative to that anchor
    const scrollRestorationRef = useRef({
        anchorMessageId: null,
        anchorOffsetFromTop: 0,
        needsRestore: false,
    });
    // Track previous isFetchingNextPage to detect fetch completion
    const prevIsFetchingRef = useRef(false);
    // Track if user manually scrolled away from bottom (prevents auto-scroll on new messages)
    const userScrolledAwayRef = useRef(false);
    // Debounce fetch to prevent rapid re-triggers
    const fetchCooldownRef = useRef(false);
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

    // Detect mobile for scroll behavior (tablet breakpoint matches ChatPage)
    const { windowWidth } = useWindowWidth();
    const isMobile = windowWidth <= media.maxTablet;

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

    // Track media loading - wait for images before showing chat to prevent jumping
    // This effect only runs on initial load (when isMediaLoading is still true)
    useEffect(() => {
        // Skip if already done loading media or if messages are still loading
        if (!isMediaLoading || isLoadingMessages || !messages?.length) return;

        const container = messagesContainerRef.current;

        // If no container yet, set a small timeout and re-check
        // The container might not be available on first render
        if (!container) {
            const checkContainerTimer = setTimeout(() => {
                // Force re-run by setting state
                setIsMediaLoading(true);
            }, 100);
            return () => clearTimeout(checkContainerTimer);
        }

        // Wait one frame to ensure all images are rendered in the DOM
        const rafId = requestAnimationFrame(() => {
            // Find all images that need to load
            const images = container.querySelectorAll("img");
            const unloadedImages = Array.from(images).filter(
                (img) => !img.complete
            );

            // If no images or all loaded, we're done
            if (unloadedImages.length === 0) {
                setIsMediaLoading(false);
                return;
            }

            let loadedCount = 0;
            const totalToLoad = unloadedImages.length;

            // Handler for each image load
            const handleImageLoad = () => {
                loadedCount++;
                // All images loaded - we're done
                if (loadedCount >= totalToLoad) {
                    clearTimeout(mediaLoadTimeoutRef.current);
                    setIsMediaLoading(false);
                }
            };

            // Attach load handlers to all unloaded images
            unloadedImages.forEach((img) => {
                img.addEventListener("load", handleImageLoad, { once: true });
                img.addEventListener("error", handleImageLoad, { once: true }); // Count errors as "loaded" to not block forever
            });

            // Timeout fallback - don't wait forever (max 3 seconds)
            mediaLoadTimeoutRef.current = setTimeout(() => {
                setIsMediaLoading(false);
            }, 3000);
        });

        // Cleanup
        return () => {
            cancelAnimationFrame(rafId);
            clearTimeout(mediaLoadTimeoutRef.current);
        };
    }, [isMediaLoading, isLoadingMessages, messages?.length]);

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
    // Mobile (column): near bottom = scrollTop + clientHeight >= scrollHeight - threshold
    // Desktop (column-reverse): near bottom = scrollTop close to 0
    const handleScroll = useCallback(() => {
        const container = messagesContainerRef.current;
        if (!container) return;

        const threshold = 100;
        let nearBottom;

        if (isMobile) {
            // Mobile: normal scroll - bottom is at scrollHeight
            const distanceFromBottom =
                container.scrollHeight -
                container.scrollTop -
                container.clientHeight;
            nearBottom = distanceFromBottom < threshold;
        } else {
            // Desktop: column-reverse - bottom is at scrollTop = 0
            nearBottom = Math.abs(container.scrollTop) < threshold;
        }

        const wasNearBottom = isNearBottomRef.current;
        isNearBottomRef.current = nearBottom;

        if (nearBottom) {
            setShowJumpToLatest(false);
            setNewMessagesCount(0);
            // User returned to bottom - reset scroll away flag
            userScrolledAwayRef.current = false;

            if (!wasNearBottom && currentKicker) {
                markAsRead();
            }
        } else {
            setShowJumpToLatest(true);
            // User scrolled away from bottom - set flag to prevent auto-scroll
            userScrolledAwayRef.current = true;
        }
    }, [currentKicker, markAsRead, isMobile]);

    // Infinite scroll - load more when scrolling to top (Mobile)
    // Anchor-based scroll restoration: find the anchor message and restore scroll relative to it
    // This runs synchronously before paint via useLayoutEffect
    useLayoutEffect(() => {
        if (!isMobile) return;

        const restoration = scrollRestorationRef.current;
        const container = messagesContainerRef.current;

        // Only restore when transitioning from fetching to not-fetching
        const wasFetching = prevIsFetchingRef.current;
        prevIsFetchingRef.current = isFetchingNextPage;

        if (
            restoration.needsRestore &&
            container &&
            wasFetching &&
            !isFetchingNextPage
        ) {
            // Find the anchor message element by its data attribute
            const anchorElement = container.querySelector(
                `[data-message-id="${restoration.anchorMessageId}"]`
            );

            if (anchorElement) {
                // Calculate where the anchor element is now and restore scroll
                // so the anchor stays at the same visual position
                const newAnchorOffset = anchorElement.offsetTop;
                const targetScrollTop =
                    newAnchorOffset - restoration.anchorOffsetFromTop;

                // Use requestAnimationFrame to ensure DOM has settled
                requestAnimationFrame(() => {
                    container.scrollTop = Math.max(0, targetScrollTop);
                    // Reset cooldown after successful restoration
                    fetchCooldownRef.current = false;
                });
            } else {
                // Anchor not found - reset cooldown anyway to prevent stuck state
                fetchCooldownRef.current = false;
            }

            restoration.needsRestore = false;
        }
    }, [messages, isMobile, isFetchingNextPage]); // Run when messages change or fetch completes

    useEffect(() => {
        const container = messagesContainerRef.current;
        if (!container || !hasNextPage || !isMobile) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (
                    entries[0].isIntersecting &&
                    !isFetchingNextPage &&
                    !fetchCooldownRef.current
                ) {
                    // Find the first visible message to use as scroll anchor
                    // This message will be used to restore scroll position after new messages load
                    const messageElements =
                        container.querySelectorAll("[data-message-id]");
                    let anchorMessageId = null;
                    let anchorOffsetFromTop = 0;

                    for (const el of messageElements) {
                        const rect = el.getBoundingClientRect();
                        const containerRect = container.getBoundingClientRect();
                        // Find first message that's at least partially visible in the viewport
                        if (
                            rect.bottom > containerRect.top &&
                            rect.top < containerRect.bottom
                        ) {
                            anchorMessageId =
                                el.getAttribute("data-message-id");
                            // Save offset from container top (how far down from container top the element is)
                            anchorOffsetFromTop =
                                el.offsetTop - container.scrollTop;
                            break;
                        }
                    }

                    // Save anchor-based scroll state
                    scrollRestorationRef.current = {
                        anchorMessageId,
                        anchorOffsetFromTop,
                        needsRestore: true,
                    };

                    // Set cooldown and fetch
                    fetchCooldownRef.current = true;
                    fetchNextPage();

                    // Fallback: reset cooldown after timeout if restoration fails
                    setTimeout(() => {
                        if (fetchCooldownRef.current) {
                            fetchCooldownRef.current = false;
                        }
                    }, 2000);
                }
            },
            {
                root: container,
                // Lower threshold for more reliable triggering on mobile
                threshold: 0.01,
            }
        );

        if (loadMoreRef.current) {
            observer.observe(loadMoreRef.current);
        }

        return () => observer.disconnect();
    }, [hasNextPage, isFetchingNextPage, fetchNextPage, isMobile]);

    // Desktop infinite scroll (no restoration needed due to column-reverse)
    useEffect(() => {
        const container = messagesContainerRef.current;
        if (!container || !hasNextPage || isMobile) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (
                    entries[0].isIntersecting &&
                    !isFetchingNextPage &&
                    !fetchCooldownRef.current
                ) {
                    fetchCooldownRef.current = true;
                    fetchNextPage();
                    // Reset cooldown after a short delay
                    setTimeout(() => {
                        fetchCooldownRef.current = false;
                    }, 500);
                }
            },
            { root: container, threshold: 0.1 }
        );

        if (loadMoreRef.current) {
            observer.observe(loadMoreRef.current);
        }

        return () => observer.disconnect();
    }, [hasNextPage, isFetchingNextPage, fetchNextPage, isMobile]);

    // Helper function to reliably scroll to bottom
    // Mobile (column): scrollTop = scrollHeight (standard scroll to bottom)
    // Desktop (column-reverse): scrollTop = 0 (inverted - 0 is bottom)
    const scrollToBottomReliable = useCallback(
        (container, options = {}) => {
            if (!container) return;

            const { retryCount = 3 } = options;

            const doScroll = () => {
                if (isMobile) {
                    // Mobile: normal flex-direction column, scroll to max
                    const targetScroll = container.scrollHeight;
                    container.scrollTop = targetScroll;
                    container.scrollTo?.({
                        top: targetScroll,
                        behavior: "instant",
                    });
                } else {
                    // Desktop: column-reverse, scrollTop = 0 is at bottom
                    container.scrollTop = 0;
                    container.scrollTo?.({ top: 0, behavior: "instant" });
                }
            };

            // Initial scroll
            doScroll();

            // iOS Safari sometimes ignores scroll commands during layout
            // Retry with RAF to ensure scroll completes
            if (retryCount > 0) {
                let remaining = retryCount;
                const retryScroll = () => {
                    doScroll();
                    remaining--;
                    if (remaining > 0) {
                        requestAnimationFrame(retryScroll);
                    }
                };
                requestAnimationFrame(retryScroll);
            }
        },
        [isMobile]
    );

    // Fix iOS Safari scroll position after keyboard opens
    // When input is focused, iOS scrolls to show the input, but with column-reverse
    // this can scroll to the wrong position. We need to scroll back to bottom after keyboard opens.
    useEffect(() => {
        if (!isKeyboardOpen) return;

        const container = messagesContainerRef.current;
        if (!container) return;

        // Check if near bottom using correct logic for current layout
        const threshold = 200;
        let isCloseToBottom;
        if (isMobile) {
            const distanceFromBottom =
                container.scrollHeight -
                container.scrollTop -
                container.clientHeight;
            isCloseToBottom = distanceFromBottom < threshold;
        } else {
            isCloseToBottom = Math.abs(container.scrollTop) < threshold;
        }

        // Only scroll if we were near bottom before keyboard opened
        if (isNearBottomRef.current || isCloseToBottom) {
            // Use RAF to scroll after iOS finishes its layout
            const rafId = requestAnimationFrame(() => {
                scrollToBottomReliable(container, { retryCount: 5 });
            });
            return () => cancelAnimationFrame(rafId);
        }
    }, [isKeyboardOpen, scrollToBottomReliable, isMobile]);

    // Scroll to bottom when user sends a message
    // Uses MutationObserver, ResizeObserver and image load events - NO TIMEOUTS
    useEffect(() => {
        if (scrollTrigger === 0) return;

        const container = messagesContainerRef.current;
        if (!container) {
            pendingScrollRef.current = false;
            return;
        }

        let isCleanedUp = false;

        const scrollToBottom = () => {
            if (isCleanedUp) return;
            scrollToBottomReliable(container);
        };

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

        // MutationObserver to catch new images added to DOM
        const mutationObserver = new MutationObserver((mutations) => {
            // Scroll on any DOM change (new message appearing)
            scrollToBottom();

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

        // ResizeObserver to catch size changes (avatar/image loading)
        const resizeObserver = new ResizeObserver(() => {
            scrollToBottom();
        });
        resizeObserver.observe(container);

        // Initial scroll
        scrollToBottom();

        // Scroll a few more frames to ensure layout is complete
        // Reduced frame count to prevent interference with user scroll
        const maxFrames = isMobile ? 5 : 5;
        let frameCount = 0;
        let rafId;
        const scrollFrames = () => {
            scrollToBottom();
            frameCount++;
            if (frameCount < maxFrames) {
                rafId = requestAnimationFrame(scrollFrames);
            } else {
                // IMPORTANT: Disconnect ALL observers after initial scroll to prevent
                // interference when loading older messages
                isCleanedUp = true;
                mutationObserver.disconnect();
                resizeObserver.disconnect();
                pendingScrollRef.current = false;
            }
        };
        rafId = requestAnimationFrame(scrollFrames);

        return () => {
            isCleanedUp = true;
            cancelAnimationFrame(rafId);
            mutationObserver.disconnect();
            resizeObserver.disconnect();
            imageLoadHandlers.forEach((handler, img) => {
                img.removeEventListener("load", handler);
            });
            imageLoadHandlers.clear();
        };
    }, [scrollTrigger, scrollToBottomReliable, isMobile]);

    // Track new messages and auto-scroll if near bottom
    // IMPORTANT: Only scroll for NEW messages (at front of array), not for older messages loaded via infinite scroll
    useEffect(() => {
        if (!messages.length) return;

        const currentFirstMessageId = messages[0]?.id;
        const newCount = messages.length - prevMessageCountRef.current;

        // Detect if this is loading OLDER messages (infinite scroll) vs NEW messages
        // When loading older messages: first message ID stays the same, but count increases
        // When receiving new messages: first message ID changes (new message at front)
        const isLoadingOlderMessages =
            newCount > 0 &&
            prevMessageCountRef.current > 0 &&
            currentFirstMessageId === prevFirstMessageIdRef.current;

        // Skip scroll logic entirely when loading older messages
        if (isLoadingOlderMessages) {
            prevMessageCountRef.current = messages.length;
            // Don't update prevFirstMessageIdRef - it stays the same
            return;
        }

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

                // Check near-bottom based on layout mode
                let isCurrentlyNearBottom;
                if (container) {
                    if (isMobile) {
                        // Mobile: normal scroll
                        const distanceFromBottom =
                            container.scrollHeight -
                            container.scrollTop -
                            container.clientHeight;
                        isCurrentlyNearBottom = distanceFromBottom < threshold;
                    } else {
                        // Desktop: column-reverse
                        isCurrentlyNearBottom =
                            Math.abs(container.scrollTop) < threshold;
                    }
                } else {
                    isCurrentlyNearBottom = true;
                }

                // On mobile, also check if user manually scrolled away
                // This prevents auto-scroll when user is reading old messages
                const shouldAutoScroll =
                    isCurrentlyNearBottom &&
                    (!isMobile || !userScrolledAwayRef.current);

                if (shouldAutoScroll) {
                    // Scroll using helper function with retries for iOS
                    scrollToBottomReliable(container, { retryCount: 3 });
                } else {
                    setNewMessagesCount((prev) => prev + newCount);
                }
            }
        }

        prevMessageCountRef.current = messages.length;
        prevFirstMessageIdRef.current = currentFirstMessageId;
    }, [messages, currentPlayerId, isMobile, scrollToBottomReliable]);

    // Force repaint on mount (fixes mobile chat view on iOS Safari)
    // Only runs once on initial mount
    useEffect(() => {
        // Skip if already ready (prevent re-running)
        if (isContainerReady) return;

        const container = messagesContainerRef.current;
        if (!container) return;

        // Force a reflow/repaint to fix iOS Safari rendering issues
        // eslint-disable-next-line no-unused-expressions
        container.offsetHeight;
        container.style.transform = "translateZ(0)";

        // Scroll to bottom - method depends on layout mode
        scrollToBottomReliable(container, { retryCount: 3 });
        setIsContainerReady(true);
    }, [scrollToBottomReliable, isContainerReady]); // Re-run if scroll method changes

    // Initial scroll - scroll to bottom when messages first loaded
    // Uses MutationObserver to catch dynamically loaded images - NO TIMEOUTS
    // IMPORTANT: Wait for media to load first to prevent jumping
    useEffect(() => {
        if (isLoadingMessages || !messages.length || hasInitiallyScrolled)
            return;

        if (isLoadingReactions) return;

        // Wait for initial media (images/gifs) to load before scrolling
        if (isMediaLoading) return;

        const container = messagesContainerRef.current;
        if (!container) return;

        // Mark as initially scrolled FIRST to prevent re-runs
        setHasInitiallyScrolled(true);
        setIsContainerReady(true);
        prevMessageCountRef.current = messages.length;

        // Force reflow to fix iOS Safari rendering issues
        // eslint-disable-next-line no-unused-expressions
        container.offsetHeight;
        container.style.transform = "translateZ(0)";

        // Don't interfere if there's a deep link - let the scroll effect handle it
        if (!deepLinkMessageId) {
            // Track all image load handlers for cleanup
            const imageLoadHandlers = new Map();
            let isActive = true;
            let imageLoadCount = 0;

            const scrollToBottom = () => {
                if (!isActive) return;
                scrollToBottomReliable(container);
            };

            // Attach load listener to an image
            const observeImage = (img) => {
                if (!img.complete && !imageLoadHandlers.has(img)) {
                    const handler = () => {
                        imageLoadCount++;
                        scrollToBottom();
                        // After enough images loaded, stop observing
                        if (imageLoadCount >= 10) {
                            isActive = false;
                            mutationObserver.disconnect();
                        }
                    };
                    imageLoadHandlers.set(img, handler);
                    img.addEventListener("load", handler, { once: true });
                }
            };

            // Observe all current images
            container.querySelectorAll("img").forEach(observeImage);

            // MutationObserver to catch new images added to DOM (e.g. GIFs loading)
            const mutationObserver = new MutationObserver((mutations) => {
                // Scroll on any DOM change
                scrollToBottom();

                mutations.forEach((mutation) => {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            if (node.tagName === "IMG") {
                                observeImage(node);
                            }
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

            // Scroll a few frames for layout completion
            // Then disconnect observers to prevent interference with user scroll
            const maxFrames = 5;
            let frameCount = 0;
            let rafId;
            const scrollFrames = () => {
                scrollToBottom();
                frameCount++;
                if (frameCount < maxFrames) {
                    rafId = requestAnimationFrame(scrollFrames);
                } else {
                    // IMPORTANT: Disconnect observer after initial scroll to prevent
                    // interference when loading older messages
                    isActive = false;
                    mutationObserver.disconnect();
                }
            };
            rafId = requestAnimationFrame(scrollFrames);

            // Cleanup
            return () => {
                isActive = false;
                cancelAnimationFrame(rafId);
                mutationObserver.disconnect();
                imageLoadHandlers.forEach((handler, img) => {
                    img.removeEventListener("load", handler);
                });
                imageLoadHandlers.clear();
            };
        }
    }, [
        isLoadingMessages,
        isLoadingReactions,
        isMediaLoading,
        messages.length,
        hasInitiallyScrolled,
        deepLinkMessageId,
        scrollToBottomReliable,
        isMobile,
    ]);

    function handleJumpToLatest() {
        const container = messagesContainerRef.current;
        if (container) {
            scrollToBottomReliable(container);
        }
        setShowJumpToLatest(false);
        setNewMessagesCount(0);
        // Reset scroll away flag - user explicitly returned to bottom
        userScrolledAwayRef.current = false;
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
        // Reset scroll away flag - user is sending a message, expects to see it
        userScrolledAwayRef.current = false;

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

    // For mobile, reverse the messages array so oldest is first (top), newest last (bottom)
    // Desktop uses column-reverse CSS, so messages array stays as-is (newest first)
    const displayMessages = useMemo(() => {
        if (!messages?.length) return [];
        return isMobile ? [...messages].reverse() : messages;
    }, [messages, isMobile]);

    // Helper to get adjacent message for grouping/date dividers
    // Mobile (column): previous message is index - 1 (chronologically before)
    // Desktop (column-reverse): next message is index + 1 (chronologically before)
    const getAdjacentMessage = useCallback(
        (displayMsgs, index) => {
            if (isMobile) {
                // Mobile: compare with previous (older) message
                return displayMsgs[index - 1];
            } else {
                // Desktop: compare with next (older due to column-reverse) message
                return displayMsgs[index + 1];
            }
        },
        [isMobile]
    );

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
                {/* Overlay while media (images/gifs) is loading */}
                <MediaLoadingOverlay $isVisible={isMediaLoading}>
                    <LoadingSpinner />
                </MediaLoadingOverlay>

                <MessagesContainer
                    ref={messagesContainerRef}
                    onScroll={handleScroll}
                    $isMobile={isMobile}
                >
                    {/* Mobile: LoadMore at top (scroll up for older) */}
                    {isMobile && hasNextPage && (
                        <LoadMoreTrigger ref={loadMoreRef}>
                            {isFetchingNextPage ? (
                                <SpinnerMini />
                            ) : (
                                "Scroll up for more messages"
                            )}
                        </LoadMoreTrigger>
                    )}

                    {/* Desktop only: Scroll anchor at start (visually at bottom due to column-reverse) */}
                    {!isMobile && (
                        <div
                            ref={messagesEndRef}
                            style={{ height: 0, width: "100%" }}
                        />
                    )}

                    {displayMessages?.length === 0 ? (
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
                            {displayMessages?.map((message, index) => {
                                const adjacentMessage = getAdjacentMessage(
                                    displayMessages,
                                    index
                                );
                                const isGrouped =
                                    adjacentMessage &&
                                    shouldGroupWithPrevious(
                                        message,
                                        adjacentMessage
                                    );

                                // Message is unread if:
                                // - Created after lastReadAt
                                // - Not from the current user
                                // - lastReadAt must be a valid date string
                                // - If no lastReadAt exists (null), all messages are considered READ
                                // TEMPORARILY DISABLED - all messages shown as read
                                const isUnread = false;

                                // Check if we need a date divider
                                // Show divider when this message is on a different day than the adjacent (older) one
                                const currentDate = new Date(
                                    message.created_at
                                );
                                const adjacentDate = adjacentMessage
                                    ? new Date(adjacentMessage.created_at)
                                    : null;
                                const showDateDivider =
                                    !adjacentDate ||
                                    !isSameDay(currentDate, adjacentDate);

                                return (
                                    <React.Fragment key={message.id}>
                                        {/* Mobile: Date divider BEFORE message (at top of day group) */}
                                        {isMobile && showDateDivider && (
                                            <DateDividerContainer>
                                                <DateLabel>
                                                    {formatDateDivider(
                                                        currentDate
                                                    )}
                                                </DateLabel>
                                            </DateDividerContainer>
                                        )}
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
                                            onFocusInput={() =>
                                                focusInputRef.current?.()
                                            }
                                        />
                                        {/* Desktop: Date divider AFTER message (column-reverse) */}
                                        {!isMobile && showDateDivider && (
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
                            {/* Desktop: LoadMore at end (visually at top due to column-reverse) */}
                            {!isMobile && hasNextPage && (
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

                    {/* Mobile only: Scroll anchor at end (bottom) */}
                    {isMobile && (
                        <div
                            ref={messagesEndRef}
                            style={{ height: 0, width: "100%" }}
                        />
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
