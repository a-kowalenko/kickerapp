import styled from "styled-components";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import { useDarkMode } from "../contexts/DarkModeContext";
import { useRef, useEffect, useState, useMemo } from "react";
import { createPortal } from "react-dom";

const PickerWrapper = styled.div`
    position: fixed;
    z-index: 10001;
`;

const Overlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 10000;
`;

// Calculate position immediately (not in useEffect)
function calculatePosition(
    triggerRef,
    position,
    align,
    fixedPosition,
    useCenteredPicker
) {
    const pickerHeight = 435;
    const pickerWidth = 352;
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const padding = 10;

    // On mobile (centered picker), position it in the center of the screen
    // Position near the top to avoid the keyboard
    if (useCenteredPicker) {
        const left = Math.max(padding, (viewportWidth - pickerWidth) / 2);
        // Position near top of viewport (10% from top)
        const top = Math.max(padding, viewportHeight * 0.1);
        return { top, left };
    }

    // If fixedPosition is provided, use it directly with smart positioning
    if (fixedPosition) {
        let top = fixedPosition.y;
        let left = fixedPosition.x - pickerWidth / 2; // Center horizontally on touch point

        // Check available space below vs above the touch point
        const spaceBelow = viewportHeight - fixedPosition.y;
        const spaceAbove = fixedPosition.y;

        // Prefer showing above the touch point if not enough space below
        if (
            spaceBelow < pickerHeight + padding &&
            spaceAbove > pickerHeight + padding
        ) {
            top = fixedPosition.y - pickerHeight - padding;
        } else if (spaceBelow >= pickerHeight + padding) {
            top = fixedPosition.y + padding;
        } else {
            // Not enough space either way, position at best spot
            top = Math.max(padding, viewportHeight - pickerHeight - padding);
        }

        // Horizontal bounds check
        if (left + pickerWidth > viewportWidth - padding) {
            left = viewportWidth - pickerWidth - padding;
        }
        if (left < padding) {
            left = padding;
        }

        return { top, left };
    }

    if (!triggerRef?.current) return { top: -9999, left: -9999 };

    const rect = triggerRef.current.getBoundingClientRect();

    let top, left;

    if (position === "top" || rect.bottom + pickerHeight > viewportHeight) {
        top = Math.max(10, rect.top - pickerHeight - 8);
    } else {
        top = rect.bottom + 8;
    }

    if (align === "right") {
        left = Math.max(10, rect.right - pickerWidth);
    } else {
        left = rect.left;
    }

    if (left + pickerWidth > viewportWidth) {
        left = viewportWidth - pickerWidth - 10;
    }

    return { top, left };
}

function EmojiPicker({
    onSelect,
    onClose,
    position = "bottom",
    align = "left",
    triggerRef,
    fixedPosition = null, // { x, y } for context menu positioning
    useCenteredPicker = false, // Center picker on mobile
}) {
    const { isDarkMode } = useDarkMode();
    const pickerRef = useRef(null);

    // Calculate initial position synchronously
    const initialPosition = useMemo(
        () =>
            calculatePosition(
                triggerRef,
                position,
                align,
                fixedPosition,
                useCenteredPicker
            ),
        [triggerRef, position, align, fixedPosition, useCenteredPicker]
    );

    const [pickerPosition, setPickerPosition] = useState(initialPosition);

    // Update position if needed (e.g., window resize)
    useEffect(() => {
        setPickerPosition(
            calculatePosition(
                triggerRef,
                position,
                align,
                fixedPosition,
                useCenteredPicker
            )
        );
    }, [triggerRef, position, align, fixedPosition, useCenteredPicker]);

    useEffect(() => {
        function handleClickOutside(event) {
            // Don't close if clicking on the picker itself
            if (
                pickerRef.current &&
                !pickerRef.current.contains(event.target)
            ) {
                onClose();
            }
        }

        // Longer delay to prevent immediate close on mobile touch
        // Mobile touch events can fire in unexpected order
        const timeoutId = setTimeout(() => {
            document.addEventListener("mousedown", handleClickOutside);
            document.addEventListener("touchend", handleClickOutside);
        }, 200);

        return () => {
            clearTimeout(timeoutId);
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("touchend", handleClickOutside);
        };
    }, [onClose]);

    // Capture all wheel events and forward them to the picker's scrollable area
    useEffect(() => {
        function handleWheel(event) {
            if (!pickerRef.current) return;

            // emoji-mart uses a shadow DOM, find the em-emoji-picker element
            const emojiPicker =
                pickerRef.current.querySelector("em-emoji-picker");
            if (!emojiPicker?.shadowRoot) return;

            // Find the scroll container inside shadow DOM
            const scrollContainer =
                emojiPicker.shadowRoot.querySelector(".scroll");

            if (scrollContainer) {
                // Prevent default scroll behavior everywhere
                event.preventDefault();
                // Forward the scroll to the emoji picker
                scrollContainer.scrollTop += event.deltaY;
            }
        }

        // Capture wheel events on the entire document
        document.addEventListener("wheel", handleWheel, { passive: false });
        return () => {
            document.removeEventListener("wheel", handleWheel);
        };
    }, []);

    function handleEmojiSelect(emoji) {
        onSelect(emoji.native);
        onClose();
    }

    return createPortal(
        <>
            <Overlay onClick={onClose} />
            <PickerWrapper
                ref={pickerRef}
                style={{ top: pickerPosition.top, left: pickerPosition.left }}
            >
                <Picker
                    data={data}
                    onEmojiSelect={handleEmojiSelect}
                    theme={isDarkMode ? "dark" : "light"}
                    previewPosition="none"
                    skinTonePosition="none"
                    maxFrequentRows={2}
                />
            </PickerWrapper>
        </>,
        document.body
    );
}

export default EmojiPicker;
