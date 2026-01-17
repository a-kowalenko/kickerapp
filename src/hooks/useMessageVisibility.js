import { useRef, useEffect, useCallback } from "react";

/**
 * useMessageVisibility - WhatsApp/Discord-style message visibility tracking
 *
 * Uses IntersectionObserver to track when messages are visible in the viewport.
 * A message is considered "seen" when it's at least 50% visible for 300ms.
 *
 * @param {Object} options
 * @param {React.RefObject} options.containerRef - Ref to the scrollable container
 * @param {Function} options.onMessageSeen - Callback when a message is considered seen (receives messageId)
 * @param {string|null} options.lastReadAt - ISO timestamp of last read, messages newer than this are tracked
 * @param {number} options.currentPlayerId - Current user's player ID (to skip own messages)
 * @param {boolean} options.enabled - Whether tracking is enabled (default: true)
 */
export function useMessageVisibility({
    containerRef,
    onMessageSeen,
    lastReadAt,
    currentPlayerId,
    enabled = true,
}) {
    // Map of messageId -> timerId for tracking 300ms dwell time
    const visibilityTimersRef = useRef(new Map());
    // Track the highest seen message ID to avoid redundant callbacks
    const highestSeenIdRef = useRef(null);
    // Observer instance ref
    const observerRef = useRef(null);
    // Set of currently observed elements
    const observedElementsRef = useRef(new Set());

    // Cleanup function to clear all timers
    const clearAllTimers = useCallback(() => {
        visibilityTimersRef.current.forEach((timerId) => clearTimeout(timerId));
        visibilityTimersRef.current.clear();
    }, []);

    // Handle intersection changes
    const handleIntersection = useCallback(
        (entries) => {
            if (!enabled) return;

            entries.forEach((entry) => {
                const messageId = entry.target.getAttribute("data-message-id");
                const messageCreatedAt = entry.target.getAttribute(
                    "data-message-created-at",
                );
                const messagePlayerId = entry.target.getAttribute(
                    "data-message-player-id",
                );

                if (!messageId) return;

                // Skip own messages
                if (
                    currentPlayerId &&
                    String(messagePlayerId) === String(currentPlayerId)
                ) {
                    return;
                }

                // Skip already-read messages (older than lastReadAt)
                if (lastReadAt && messageCreatedAt) {
                    const messageTime = new Date(messageCreatedAt).getTime();
                    const lastReadTime = new Date(lastReadAt).getTime();
                    if (messageTime <= lastReadTime) {
                        return;
                    }
                }

                const numericId = parseInt(messageId, 10);

                if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
                    // Message is 50%+ visible - start 300ms timer
                    if (!visibilityTimersRef.current.has(messageId)) {
                        const timerId = setTimeout(() => {
                            // Message has been visible for 300ms - mark as seen
                            visibilityTimersRef.current.delete(messageId);

                            // Only trigger callback if this is a new highest ID
                            if (
                                highestSeenIdRef.current === null ||
                                numericId > highestSeenIdRef.current
                            ) {
                                highestSeenIdRef.current = numericId;
                                onMessageSeen?.(messageId);
                            }
                        }, 300);
                        visibilityTimersRef.current.set(messageId, timerId);
                    }
                } else {
                    // Message scrolled out of view before 300ms - cancel timer
                    const existingTimer =
                        visibilityTimersRef.current.get(messageId);
                    if (existingTimer) {
                        clearTimeout(existingTimer);
                        visibilityTimersRef.current.delete(messageId);
                    }
                }
            });
        },
        [enabled, lastReadAt, currentPlayerId, onMessageSeen],
    );

    // Setup observer
    useEffect(() => {
        if (!enabled || !containerRef.current) return;

        // Create observer with 50% threshold
        observerRef.current = new IntersectionObserver(handleIntersection, {
            root: containerRef.current,
            threshold: 0.5, // 50% visibility required
            rootMargin: "0px",
        });

        // Observe any existing message elements
        const container = containerRef.current;
        const messageElements = container.querySelectorAll("[data-message-id]");
        const observedSet = observedElementsRef.current;
        messageElements.forEach((el) => {
            observerRef.current.observe(el);
            observedSet.add(el);
        });

        return () => {
            clearAllTimers();
            observerRef.current?.disconnect();
            observedSet.clear();
        };
    }, [enabled, containerRef, handleIntersection, clearAllTimers]);

    // Function to observe new message elements (call when messages change)
    const observeMessages = useCallback(() => {
        if (!enabled || !observerRef.current || !containerRef.current) return;

        const container = containerRef.current;
        const messageElements = container.querySelectorAll("[data-message-id]");

        messageElements.forEach((el) => {
            if (!observedElementsRef.current.has(el)) {
                observerRef.current.observe(el);
                observedElementsRef.current.add(el);
            }
        });
    }, [enabled, containerRef]);

    // Reset highest seen ID (call when switching kickers or user)
    const resetTracking = useCallback(() => {
        highestSeenIdRef.current = null;
        clearAllTimers();
    }, [clearAllTimers]);

    return {
        observeMessages,
        resetTracking,
    };
}

export default useMessageVisibility;
