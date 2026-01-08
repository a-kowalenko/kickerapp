import { useRef, useCallback } from "react";

const LONG_PRESS_DURATION = 500; // ms

/**
 * Custom hook for handling long press events (mobile context menu)
 * @param {Function} onLongPress - Callback when long press is detected
 * @param {Object} options - Configuration options
 * @param {number} options.threshold - Movement threshold in pixels before canceling
 * @param {React.RefObject} options.cancelRef - External ref to cancel long press (e.g., when swiping)
 * @returns {Object} Event handlers for touch events
 */
export function useLongPress(onLongPress, options = {}) {
    const { threshold = 10, cancelRef = null } = options;

    const timerRef = useRef(null);
    const touchStartRef = useRef(null);
    const isLongPressRef = useRef(false);

    const clearTimer = useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    const handleTouchStart = useCallback(
        (e) => {
            // Don't start long press if touching interactive elements
            const target = e.target;
            if (
                target.closest("button") ||
                target.closest('[role="button"]') ||
                target.closest(".emoji-mart")
            ) {
                return;
            }

            const touch = e.touches[0];
            touchStartRef.current = {
                x: touch.clientX,
                y: touch.clientY,
            };
            isLongPressRef.current = false;

            timerRef.current = setTimeout(() => {
                // Check if external cancel ref is set (e.g., swipe in progress)
                if (cancelRef?.current) {
                    clearTimer();
                    return;
                }
                isLongPressRef.current = true;
                onLongPress?.(e, {
                    x: touchStartRef.current.x,
                    y: touchStartRef.current.y,
                });
            }, LONG_PRESS_DURATION);
        },
        [onLongPress, cancelRef, clearTimer]
    );

    const handleTouchMove = useCallback(
        (e) => {
            if (!touchStartRef.current) return;

            const touch = e.touches[0];
            const moveX = Math.abs(touch.clientX - touchStartRef.current.x);
            const moveY = Math.abs(touch.clientY - touchStartRef.current.y);

            // Cancel long press if moved too much or external cancel ref is set
            if (moveX > threshold || moveY > threshold || cancelRef?.current) {
                clearTimer();
            }
        },
        [threshold, clearTimer, cancelRef]
    );

    const handleTouchEnd = useCallback(() => {
        clearTimer();
        touchStartRef.current = null;
    }, [clearTimer]);

    return {
        onTouchStart: handleTouchStart,
        onTouchMove: handleTouchMove,
        onTouchEnd: handleTouchEnd,
    };
}

export default useLongPress;
