import styled from "styled-components";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import { useDarkMode } from "../contexts/DarkModeContext";
import { useRef, useEffect, useState, useMemo } from "react";

const PickerWrapper = styled.div`
    position: fixed;
    z-index: 10000;
`;

const Overlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 9999;
`;

// Calculate position immediately (not in useEffect)
function calculatePosition(triggerRef, position, align) {
    if (!triggerRef?.current) return { top: -9999, left: -9999 };

    const rect = triggerRef.current.getBoundingClientRect();
    const pickerHeight = 435;
    const pickerWidth = 352;
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

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
}) {
    const { isDarkMode } = useDarkMode();
    const pickerRef = useRef(null);

    // Calculate initial position synchronously
    const initialPosition = useMemo(
        () => calculatePosition(triggerRef, position, align),
        [triggerRef, position, align]
    );

    const [pickerPosition, setPickerPosition] = useState(initialPosition);

    // Update position if needed (e.g., window resize)
    useEffect(() => {
        setPickerPosition(calculatePosition(triggerRef, position, align));
    }, [triggerRef, position, align]);

    useEffect(() => {
        function handleClickOutside(event) {
            if (
                pickerRef.current &&
                !pickerRef.current.contains(event.target)
            ) {
                onClose();
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
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

    return (
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
        </>
    );
}

export default EmojiPicker;
