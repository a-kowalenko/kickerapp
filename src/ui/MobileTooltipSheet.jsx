import { useEffect, useCallback, useRef, useState } from "react";
import { createPortal } from "react-dom";
import styled, { keyframes, css } from "styled-components";

/* ----------------------------------------
   MobileTooltipSheet Styles
   
   Bottom sheet component for mobile touch interactions
   Slides up from bottom with backdrop overlay
   Supports swipe-to-close gesture
----------------------------------------- */

const fadeIn = keyframes`
    from { opacity: 0; }
    to { opacity: 1; }
`;

const slideUp = keyframes`
    from { transform: translateY(100%); }
    to { transform: translateY(0); }
`;

const Overlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(2px);
    z-index: 9999;
    animation: ${fadeIn} 0.2s ease-out;
    opacity: ${(props) => props.$opacity ?? 1};
    transition: ${(props) => (props.$isDragging ? "none" : "opacity 0.2s ease")};
`;

const SheetContainer = styled.div`
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 10000;
    background: var(--secondary-background-color);
    border-radius: 1.6rem 1.6rem 0 0;
    box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.2);
    max-height: 70vh;
    overflow: hidden;
    touch-action: none;

    /* Safe area for devices with home indicator */
    padding-bottom: env(safe-area-inset-bottom, 0);

    ${(props) =>
        props.$isDragging
            ? css`
                  transform: translateY(${props.$translateY}px);
                  transition: none;
              `
            : css`
                  animation: ${slideUp} 0.3s cubic-bezier(0.32, 0.72, 0, 1);
              `}
`;

const SheetHandle = styled.div`
    width: 4rem;
    height: 0.4rem;
    background: var(--secondary-border-color);
    border-radius: 0.2rem;
    margin: 1.2rem auto 0;
    cursor: grab;

    &:active {
        cursor: grabbing;
    }
`;

const DragArea = styled.div`
    padding: 0.8rem 0;
    cursor: grab;
    touch-action: none;

    &:active {
        cursor: grabbing;
    }
`;

const SheetHeader = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.8rem;
    padding: 0.8rem 2rem 1.2rem;
    border-bottom: 1px solid var(--secondary-border-color);
`;

const HeaderIcon = styled.span`
    font-size: 2rem;
`;

const HeaderTitle = styled.h3`
    font-size: 1.6rem;
    font-weight: 600;
    color: var(--primary-text-color);
    margin: 0;
`;

const SheetScrollContent = styled.div`
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    max-height: calc(70vh - 8rem);
    padding: 1.6rem 2rem 2rem;
`;

const SWIPE_THRESHOLD = 80; // Pixels to swipe before closing
const VELOCITY_THRESHOLD = 0.5; // Velocity threshold for fast swipe

/* ----------------------------------------
   MobileTooltipSheet Component
   
   Reusable bottom sheet for mobile tooltips/modals
   Supports swipe-to-close gesture
   
   Props:
   - isOpen: boolean - Whether the sheet is visible
   - onClose: () => void - Callback when sheet should close
   - title: string - Header title (optional)
   - icon: string - Header icon/emoji (optional)
   - children: React.ReactNode - Sheet content
----------------------------------------- */
function MobileTooltipSheet({ isOpen, onClose, title, icon, children }) {
    const [isDragging, setIsDragging] = useState(false);
    const [translateY, setTranslateY] = useState(0);
    const dragStartRef = useRef({ y: 0, time: 0 });
    const sheetRef = useRef(null);

    // Close on escape key
    useEffect(() => {
        if (!isOpen) return;

        const handleEscape = (e) => {
            if (e.key === "Escape") onClose();
        };

        document.addEventListener("keydown", handleEscape);
        return () => document.removeEventListener("keydown", handleEscape);
    }, [isOpen, onClose]);

    // Prevent body scroll when sheet is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [isOpen]);

    // Reset state when opening
    useEffect(() => {
        if (isOpen) {
            setIsDragging(false);
            setTranslateY(0);
        }
    }, [isOpen]);

    const handleOverlayClick = useCallback(
        (e) => {
            if (e.target === e.currentTarget) {
                onClose();
            }
        },
        [onClose]
    );

    // Touch handlers for swipe-to-close
    const handleTouchStart = useCallback((e) => {
        dragStartRef.current = {
            y: e.touches[0].clientY,
            time: Date.now(),
        };
        setIsDragging(true);
    }, []);

    const handleTouchMove = useCallback((e) => {
        if (!isDragging) return;
        
        const currentY = e.touches[0].clientY;
        const deltaY = currentY - dragStartRef.current.y;
        
        // Only allow dragging downward
        if (deltaY > 0) {
            setTranslateY(deltaY);
        }
    }, [isDragging]);

    const handleTouchEnd = useCallback(() => {
        if (!isDragging) return;
        
        const deltaTime = Date.now() - dragStartRef.current.time;
        const velocity = translateY / deltaTime;
        
        // Close if swiped far enough or fast enough
        if (translateY > SWIPE_THRESHOLD || velocity > VELOCITY_THRESHOLD) {
            onClose();
        } else {
            // Spring back to original position
            setTranslateY(0);
        }
        
        setIsDragging(false);
    }, [isDragging, translateY, onClose]);

    // Calculate overlay opacity based on drag distance
    const overlayOpacity = isDragging
        ? Math.max(0, 1 - translateY / 300)
        : 1;

    if (!isOpen) return null;

    return createPortal(
        <>
            <Overlay
                onClick={handleOverlayClick}
                $opacity={overlayOpacity}
                $isDragging={isDragging}
            />
            <SheetContainer
                ref={sheetRef}
                $isDragging={isDragging}
                $translateY={translateY}
            >
                <DragArea
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                >
                    <SheetHandle />
                </DragArea>
                {(title || icon) && (
                    <SheetHeader>
                        {icon && <HeaderIcon>{icon}</HeaderIcon>}
                        {title && <HeaderTitle>{title}</HeaderTitle>}
                    </SheetHeader>
                )}
                <SheetScrollContent>{children}</SheetScrollContent>
            </SheetContainer>
        </>,
        document.body
    );
}

export default MobileTooltipSheet;
