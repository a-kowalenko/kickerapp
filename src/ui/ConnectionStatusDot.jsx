import styled, { keyframes, css } from "styled-components";
import { useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";

/* ----------------------------------------
   ConnectionStatusDot Styles
   
   Minimal status indicator for realtime connection
   Shows tooltip on hover (desktop) / long-press (mobile)
   Uses same tooltip pattern as BountyTooltip
----------------------------------------- */

const pulse = keyframes`
    0%, 100% { 
        opacity: 1; 
        transform: scale(1); 
    }
    50% { 
        opacity: 0.5; 
        transform: scale(0.8); 
    }
`;

const tooltipFadeIn = keyframes`
    from {
        opacity: 0;
        transform: translateY(-4px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
`;

const DotContainer = styled.span`
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-left: 6px;
    cursor: pointer;
`;

const Dot = styled.span`
    width: 6px;
    height: 6px;
    border-radius: 50%;
    flex-shrink: 0;
    background-color: ${(props) =>
        props.$status === "connected"
            ? "#22c55e"
            : props.$status === "disconnected"
              ? "#ef4444"
              : "#eab308"};
    ${(props) =>
        props.$status === "connecting" &&
        css`
            animation: ${pulse} 1.5s ease-in-out infinite;
        `}
`;

const TooltipContainer = styled.div`
    position: fixed;
    z-index: 10000;
    animation: ${tooltipFadeIn} 0.2s ease;
    pointer-events: none;
`;

const TooltipContent = styled.div`
    background-color: var(--color-grey-0);
    border: 1px solid var(--secondary-border-color);
    border-radius: var(--border-radius-md);
    padding: 0.6rem 1rem;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15), 0 4px 12px rgba(0, 0, 0, 0.1);
    white-space: nowrap;
    display: flex;
    align-items: center;
    gap: 0.6rem;
`;

const TooltipArrow = styled.div`
    position: absolute;
    top: -6px;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 0;
    border-left: 6px solid transparent;
    border-right: 6px solid transparent;
    border-bottom: 6px solid var(--secondary-border-color);

    &::after {
        content: "";
        position: absolute;
        top: 1px;
        left: -5px;
        width: 0;
        height: 0;
        border-left: 5px solid transparent;
        border-right: 5px solid transparent;
        border-bottom: 5px solid var(--color-grey-0);
    }
`;

const StatusDot = styled.span`
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
    background-color: ${(props) =>
        props.$status === "connected"
            ? "#22c55e"
            : props.$status === "disconnected"
              ? "#ef4444"
              : "#eab308"};
`;

const TooltipText = styled.span`
    font-size: 1.2rem;
    font-weight: 500;
    color: var(--primary-text-color);
`;

const TOOLTIP_TEXT = {
    connected: "Connected",
    disconnected: "Disconnected",
    connecting: "Connecting...",
};

const TOOLTIP_WIDTH = 120;
const LONG_PRESS_DELAY = 400;

/* ----------------------------------------
   ConnectionStatusDot Component
   
   Props:
   - status: 'connected' | 'disconnected' | 'connecting'
----------------------------------------- */
function ConnectionStatusDot({ status = "connecting" }) {
    const [showTooltip, setShowTooltip] = useState(false);
    const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });
    const triggerRef = useRef(null);
    const longPressTimer = useRef(null);

    const calculatePosition = useCallback(() => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            let left = rect.left + rect.width / 2 - TOOLTIP_WIDTH / 2;

            // Keep tooltip within viewport
            if (left < 8) left = 8;
            if (left + TOOLTIP_WIDTH > window.innerWidth - 8) {
                left = window.innerWidth - TOOLTIP_WIDTH - 8;
            }

            setTooltipPos({
                top: rect.bottom + 8,
                left,
            });
        }
    }, []);

    // Desktop hover handlers
    const handleMouseEnter = useCallback(() => {
        calculatePosition();
        setShowTooltip(true);
    }, [calculatePosition]);

    const handleMouseLeave = useCallback(() => {
        setShowTooltip(false);
    }, []);

    // Mobile long-press handlers
    const handleTouchStart = useCallback(() => {
        longPressTimer.current = setTimeout(() => {
            calculatePosition();
            setShowTooltip(true);
            // Haptic feedback if available
            if (navigator.vibrate) navigator.vibrate(30);
        }, LONG_PRESS_DELAY);
    }, [calculatePosition]);

    const handleTouchEnd = useCallback(() => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
        // Auto-hide tooltip after a short delay
        if (showTooltip) {
            setTimeout(() => setShowTooltip(false), 1500);
        }
    }, [showTooltip]);

    const handleTouchCancel = useCallback(() => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
        setShowTooltip(false);
    }, []);

    return (
        <>
            <DotContainer
                ref={triggerRef}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                onTouchCancel={handleTouchCancel}
            >
                <Dot $status={status} />
            </DotContainer>

            {showTooltip &&
                createPortal(
                    <TooltipContainer
                        style={{
                            top: tooltipPos.top,
                            left: tooltipPos.left,
                        }}
                    >
                        <TooltipContent>
                            <TooltipArrow />
                            <StatusDot $status={status} />
                            <TooltipText>{TOOLTIP_TEXT[status]}</TooltipText>
                        </TooltipContent>
                    </TooltipContainer>,
                    document.body
                )}
        </>
    );
}

export default ConnectionStatusDot;
