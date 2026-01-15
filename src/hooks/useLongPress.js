import { useRef, useCallback, useState } from "react";

const LONG_PRESS_DURATION = 500; // ms

/**
 * Trigger haptic feedback on supported devices
 */
function triggerHapticFeedback() {
    try {
        // Use Vibration API if available (Android, some iOS via WebKit)
        if (navigator.vibrate) {
            navigator.vibrate(50); // Short vibration
        }
    } catch (e) {
        // Silently fail if not supported
    }
}

/**
 * Custom hook for handling long press events (mobile context menu)
 * @param {Function} onLongPress - Callback when long press is detected
 * @param {Object} options - Configuration options
 * @param {number} options.threshold - Movement threshold in pixels before canceling
 * @param {React.RefObject} options.cancelRef - External ref to cancel long press (e.g., when swiping)
 * @param {Function} options.onPressStart - Callback when press starts (for visual feedback)
 * @param {Function} options.onPressEnd - Callback when press ends (for visual feedback)
 * @returns {Object} Event handlers for touch events and isPressing state
 */
export function useLongPress(onLongPress, options = {}) {
    const {
        threshold = 10,
        cancelRef = null,
        onPressStart,
        onPressEnd,
    } = options;

    const timerRef = useRef(null);
    const touchStartRef = useRef(null);
    const isLongPressRef = useRef(false);
    const [isPressing, setIsPressing] = useState(false);

    const clearTimer = useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    // Prevent text selection during long press
    const preventSelection = useCallback((e) => {
        e.preventDefault();
    }, []);

    // Cancel the long press detection
    const cancelPress = useCallback(() => {
        clearTimer();
        setIsPressing(false);
        onPressEnd?.();
        document.removeEventListener("selectstart", preventSelection);
    }, [clearTimer, onPressEnd, preventSelection]);

    const handleTouchStart = useCallback(
        (e) => {
            // Don't start long press if touching interactive elements
            const target = e.target;
            if (
                target.closest("button") ||
                target.closest('[role="button"]') ||
                target.closest(".emoji-mart") ||
                target.closest("a")
            ) {
                return;
            }

            const touch = e.touches[0];
            touchStartRef.current = {
                x: touch.clientX,
                y: touch.clientY,
            };
            isLongPressRef.current = false;

            // Add selection prevention during long press detection
            document.addEventListener("selectstart", preventSelection);

            // Start visual feedback immediately
            setIsPressing(true);
            onPressStart?.();

            timerRef.current = setTimeout(() => {
                // Check if external cancel ref is set (e.g., swipe in progress)
                if (cancelRef?.current) {
                    cancelPress();
                    return;
                }

                isLongPressRef.current = true;

                // Trigger haptic feedback
                triggerHapticFeedback();

                // Clear selection that might have started
                window.getSelection()?.removeAllRanges();

                onLongPress?.(e, {
                    x: touchStartRef.current.x,
                    y: touchStartRef.current.y,
                });

                // Keep visual feedback until touch end
            }, LONG_PRESS_DURATION);
        },
        [onLongPress, cancelRef, preventSelection, onPressStart, cancelPress]
    );

    const handleTouchMove = useCallback(
        (e) => {
            if (!touchStartRef.current) return;

            const touch = e.touches[0];
            const moveX = Math.abs(touch.clientX - touchStartRef.current.x);
            const moveY = Math.abs(touch.clientY - touchStartRef.current.y);

            // Cancel long press if moved too much or external cancel ref is set
            if (moveX > threshold || moveY > threshold || cancelRef?.current) {
                cancelPress();
            }
        },
        [threshold, cancelRef, cancelPress]
    );

    const handleTouchEnd = useCallback(() => {
        clearTimer();
        touchStartRef.current = null;
        setIsPressing(false);
        onPressEnd?.();
        document.removeEventListener("selectstart", preventSelection);

        // Clear any lingering selection
        if (isLongPressRef.current) {
            window.getSelection()?.removeAllRanges();
        }
    }, [clearTimer, preventSelection, onPressEnd]);

    return {
        onTouchStart: handleTouchStart,
        onTouchMove: handleTouchMove,
        onTouchEnd: handleTouchEnd,
        isPressing,
    };
}

export default useLongPress;
