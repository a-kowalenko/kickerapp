import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import styled, { keyframes } from "styled-components";

/* ----------------------------------------
   Bounty Tooltip Styles
----------------------------------------- */
const tooltipFadeIn = keyframes`
    from {
        opacity: 0;
        transform: translateY(4px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
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
    padding: 0.8rem 1.2rem;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15), 0 4px 12px rgba(0, 0, 0, 0.1);
    min-width: 12rem;
`;

const TooltipHeader = styled.div`
    display: flex;
    align-items: center;
    gap: 0.6rem;
    margin-bottom: 0.6rem;
    padding-bottom: 0.6rem;
    border-bottom: 1px solid var(--secondary-border-color);
`;

const TooltipIcon = styled.span`
    font-size: 1.6rem;
`;

const TooltipTitle = styled.span`
    font-size: 1.3rem;
    font-weight: 600;
    color: var(--primary-text-color);
`;

const TooltipRow = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.3rem 0;
    font-size: 1.2rem;
`;

const GamemodeLabel = styled.span`
    color: var(--secondary-text-color);
`;

const BountyValue = styled.span`
    font-weight: 600;
    color: var(--color-yellow-600);
`;

const StreakValue = styled.span`
    font-weight: 600;
    color: #ff6432;
    display: flex;
    align-items: center;
    gap: 0.3rem;
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

/* ----------------------------------------
   BountyTooltip Component
   
   Zeigt ein Tooltip mit Bounty-Aufschlüsselung nach Gamemode
   
   Props:
   - bounty1on1: number - Bounty für 1on1 Modus
   - bounty2on2: number - Bounty für 2on2 Modus
   - position: { top, left } - Position des Tooltips
   - title: string - Titel im Header (default: "Active Bounty")
   - icon: string - Icon/Emoji im Header (default: "💰")
----------------------------------------- */
export function BountyTooltipContent({
    bounty1on1 = 0,
    bounty2on2 = 0,
    title = "Active Bounty",
    icon = "💰",
}) {
    return (
        <TooltipContent>
            <TooltipArrow />
            <TooltipHeader>
                <TooltipIcon>{icon}</TooltipIcon>
                <TooltipTitle>{title}</TooltipTitle>
            </TooltipHeader>
            {bounty1on1 > 0 && (
                <TooltipRow>
                    <GamemodeLabel>1on1</GamemodeLabel>
                    <BountyValue>{bounty1on1}</BountyValue>
                </TooltipRow>
            )}
            {bounty2on2 > 0 && (
                <TooltipRow>
                    <GamemodeLabel>2on2</GamemodeLabel>
                    <BountyValue>{bounty2on2}</BountyValue>
                </TooltipRow>
            )}
        </TooltipContent>
    );
}

/* ----------------------------------------
   BountyTooltip Component (Portal Version)
   
   Rendert das Tooltip als Portal zu document.body
   
   Props:
   - isVisible: boolean - Ob das Tooltip sichtbar ist
   - position: { top, left } - Position des Tooltips
   - bounty1on1: number - Bounty für 1on1 Modus
   - bounty2on2: number - Bounty für 2on2 Modus
   - title: string - Titel im Header
   - icon: string - Icon/Emoji im Header
----------------------------------------- */
export function BountyTooltip({
    isVisible,
    position,
    bounty1on1 = 0,
    bounty2on2 = 0,
    title = "Active Bounty",
    icon = "💰",
}) {
    if (!isVisible) return null;

    return createPortal(
        <TooltipContainer
            style={{
                top: position.top,
                left: position.left,
            }}
        >
            <BountyTooltipContent
                bounty1on1={bounty1on1}
                bounty2on2={bounty2on2}
                title={title}
                icon={icon}
            />
        </TooltipContainer>,
        document.body
    );
}

/* ----------------------------------------
   useBountyTooltip Hook
   
   Handhabt die Tooltip-Logik (hover state, position calculation)
   
   Returns:
   - isHovered: boolean
   - tooltipPos: { top, left }
   - handleMouseEnter: (event) => void
   - handleMouseLeave: () => void
   - triggerRef: React.RefObject
----------------------------------------- */
export function useBountyTooltip(tooltipWidth = 140) {
    const [isHovered, setIsHovered] = useState(false);
    const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });
    const triggerRef = useRef(null);

    const handleMouseEnter = () => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            let left = rect.left + rect.width / 2 - tooltipWidth / 2;

            // Keep tooltip within viewport
            if (left < 8) left = 8;
            if (left + tooltipWidth > window.innerWidth - 8) {
                left = window.innerWidth - tooltipWidth - 8;
            }

            setTooltipPos({
                top: rect.bottom + 8,
                left,
            });
        }
        setIsHovered(true);
    };

    const handleMouseLeave = () => {
        setIsHovered(false);
    };

    return {
        isHovered,
        tooltipPos,
        handleMouseEnter,
        handleMouseLeave,
        triggerRef,
    };
}

/* ----------------------------------------
   StreakTooltipContent Component
   
   Zeigt ein Tooltip mit Streak-Aufschlüsselung nach Gamemode
   
   Props:
   - streak1on1: number - Streak für 1on1 Modus
   - streak2on2: number - Streak für 2on2 Modus
   - title: string - Titel im Header (default: "Win Streaks")
   - icon: string - Icon/Emoji im Header (default: "🔥")
----------------------------------------- */
export function StreakTooltipContent({
    streak1on1 = 0,
    streak2on2 = 0,
    title = "Win Streaks",
    icon = "🔥",
}) {
    const show1on1 = streak1on1 >= 3;
    const show2on2 = streak2on2 >= 3;

    return (
        <TooltipContent>
            <TooltipArrow />
            <TooltipHeader>
                <TooltipIcon>{icon}</TooltipIcon>
                <TooltipTitle>{title}</TooltipTitle>
            </TooltipHeader>
            {show1on1 && (
                <TooltipRow>
                    <GamemodeLabel>1on1</GamemodeLabel>
                    <StreakValue>{streak1on1} 🔥</StreakValue>
                </TooltipRow>
            )}
            {show2on2 && (
                <TooltipRow>
                    <GamemodeLabel>2on2</GamemodeLabel>
                    <StreakValue>{streak2on2} 🔥</StreakValue>
                </TooltipRow>
            )}
            {!show1on1 && !show2on2 && (
                <TooltipRow>
                    <GamemodeLabel
                        style={{ color: "var(--secondary-text-color)" }}
                    >
                        No active streaks
                    </GamemodeLabel>
                </TooltipRow>
            )}
        </TooltipContent>
    );
}

/* ----------------------------------------
   StreakTooltip Component (Portal Version)
   
   Rendert das Streak-Tooltip als Portal zu document.body
   
   Props:
   - isVisible: boolean - Ob das Tooltip sichtbar ist
   - position: { top, left } - Position des Tooltips
   - streak1on1: number - Streak für 1on1 Modus
   - streak2on2: number - Streak für 2on2 Modus
   - title: string - Titel im Header
   - icon: string - Icon/Emoji im Header
----------------------------------------- */
export function StreakTooltip({
    isVisible,
    position,
    streak1on1 = 0,
    streak2on2 = 0,
    title = "Win Streaks",
    icon = "🔥",
}) {
    if (!isVisible) return null;

    return createPortal(
        <TooltipContainer
            style={{
                top: position.top,
                left: position.left,
            }}
        >
            <StreakTooltipContent
                streak1on1={streak1on1}
                streak2on2={streak2on2}
                title={title}
                icon={icon}
            />
        </TooltipContainer>,
        document.body
    );
}

export default BountyTooltip;
