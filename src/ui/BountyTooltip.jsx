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
    color: ${(props) => (props.$cold ? "#3B82F6" : "#EF4444")};
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
   - streak1on1: number - Streak für 1on1 Modus (positive = wins, negative = losses)
   - streak2on2: number - Streak für 2on2 Modus (positive = wins, negative = losses)
   - title: string - Titel im Header (default: auto based on streaks)
   - icon: string - Icon/Emoji im Header (default: auto based on streaks)
----------------------------------------- */
export function StreakTooltipContent({
    streak1on1 = 0,
    streak2on2 = 0,
    title,
    icon,
}) {
    const show1on1 = Math.abs(streak1on1) >= 3;
    const show2on2 = Math.abs(streak2on2) >= 3;

    // Determine if we have any losing streaks
    const hasLosingStreak = streak1on1 <= -3 || streak2on2 <= -3;
    const hasWinningStreak = streak1on1 >= 3 || streak2on2 >= 3;

    // Auto-determine title and icon based on streak types
    const displayTitle =
        title ||
        (hasLosingStreak && !hasWinningStreak
            ? "Loss Streaks"
            : hasWinningStreak && !hasLosingStreak
            ? "Win Streaks"
            : "Streaks");
    const displayIcon =
        icon ||
        (hasLosingStreak && !hasWinningStreak
            ? "❄️"
            : hasWinningStreak && !hasLosingStreak
            ? "🔥"
            : "📊");

    return (
        <TooltipContent>
            <TooltipArrow />
            <TooltipHeader>
                <TooltipIcon>{displayIcon}</TooltipIcon>
                <TooltipTitle>{displayTitle}</TooltipTitle>
            </TooltipHeader>
            {show1on1 && (
                <TooltipRow>
                    <GamemodeLabel>1on1</GamemodeLabel>
                    <StreakValue $cold={streak1on1 < 0}>
                        {streak1on1 > 0 ? "+" : ""}
                        {streak1on1} {streak1on1 > 0 ? "🔥" : "❄️"}
                    </StreakValue>
                </TooltipRow>
            )}
            {show2on2 && (
                <TooltipRow>
                    <GamemodeLabel>2on2</GamemodeLabel>
                    <StreakValue $cold={streak2on2 < 0}>
                        {streak2on2 > 0 ? "+" : ""}
                        {streak2on2} {streak2on2 > 0 ? "🔥" : "❄️"}
                    </StreakValue>
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
   - streak1on1: number - Streak für 1on1 Modus (positive = wins, negative = losses)
   - streak2on2: number - Streak für 2on2 Modus (positive = wins, negative = losses)
   - title: string - Titel im Header (optional, auto-determined)
   - icon: string - Icon/Emoji im Header (optional, auto-determined)
----------------------------------------- */
export function StreakTooltip({
    isVisible,
    position,
    streak1on1 = 0,
    streak2on2 = 0,
    title,
    icon,
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

/* ----------------------------------------
   StatusTooltip Components
   
   Zeigt aktive Status pro Gamemode an
----------------------------------------- */

// Maps both camelCase and snake_case keys to icons
const STATUS_ICONS_MAP = {
    // camelCase keys
    warmingUp: "✨",
    hotStreak: "🔥",
    onFire: "🔥",
    legendary: "👑",
    cold: "❄️",
    iceCold: "🥶",
    frozen: "🧊",
    humiliated: "😢",
    dominator: "💪",
    giantSlayer: "⚔️",
    comeback: "🚀",
    underdog: "🐺",
    // snake_case keys (from database)
    warming_up: "✨",
    hot_streak: "🔥",
    on_fire: "🔥",
    ice_cold: "🥶",
    giant_slayer: "⚔️",
};

// Maps both camelCase and snake_case keys to display labels
const STATUS_LABELS_MAP = {
    // camelCase keys
    warmingUp: "Warming Up",
    hotStreak: "Hot Streak",
    onFire: "On Fire!",
    legendary: "Legendary",
    cold: "Cold",
    iceCold: "Ice Cold",
    frozen: "Frozen",
    humiliated: "Humiliated",
    dominator: "Dominator",
    giantSlayer: "Giant Slayer",
    comeback: "Comeback",
    underdog: "Underdog",
    // snake_case keys (from database)
    warming_up: "Warming Up",
    hot_streak: "Hot Streak",
    on_fire: "On Fire!",
    ice_cold: "Ice Cold",
    giant_slayer: "Giant Slayer",
};

const StatusItem = styled.div`
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.2rem 0;
    font-size: 1.1rem;
`;

const StatusIcon = styled.span`
    font-size: 1.2rem;
`;

const StatusLabel = styled.span`
    color: var(--primary-text-color);
    font-weight: 500;
`;

const GamemodeSection = styled.div`
    &:not(:last-child) {
        margin-bottom: 0.6rem;
        padding-bottom: 0.6rem;
        border-bottom: 1px solid var(--secondary-border-color);
    }
`;

const GamemodeHeader = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.4rem;
`;

const GamemodeTitle = styled.span`
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--secondary-text-color);
`;

const StreakIndicator = styled.span`
    font-size: 1rem;
    font-weight: 600;
    color: ${(props) =>
        props.$streak > 0
            ? "#EF4444"
            : props.$streak < 0
            ? "#3B82F6"
            : "var(--secondary-text-color)"};
`;

const NoStatusText = styled.span`
    color: var(--secondary-text-color);
    font-size: 1rem;
    font-style: italic;
`;

export function StatusTooltipContent({
    statuses1on1 = [],
    statuses2on2 = [],
    streak1on1 = 0,
    streak2on2 = 0,
}) {
    const hasStatuses = statuses1on1.length > 0 || statuses2on2.length > 0;

    if (!hasStatuses) {
        return (
            <TooltipContent>
                <TooltipArrow />
                <TooltipHeader>
                    <TooltipIcon>📊</TooltipIcon>
                    <TooltipTitle>Status</TooltipTitle>
                </TooltipHeader>
                <NoStatusText>Keine aktiven Status</NoStatusText>
            </TooltipContent>
        );
    }

    return (
        <TooltipContent>
            <TooltipArrow />
            <TooltipHeader>
                <TooltipIcon>📊</TooltipIcon>
                <TooltipTitle>Active Status</TooltipTitle>
            </TooltipHeader>

            {statuses1on1.length > 0 && (
                <GamemodeSection>
                    <GamemodeHeader>
                        <GamemodeTitle>1on1</GamemodeTitle>
                        {streak1on1 !== 0 && (
                            <StreakIndicator $streak={streak1on1}>
                                {streak1on1 > 0 ? "+" : ""}
                                {streak1on1}
                            </StreakIndicator>
                        )}
                    </GamemodeHeader>
                    {statuses1on1.map((status) => (
                        <StatusItem key={status}>
                            <StatusIcon>
                                {STATUS_ICONS_MAP[status] || "•"}
                            </StatusIcon>
                            <StatusLabel>
                                {STATUS_LABELS_MAP[status] || status}
                            </StatusLabel>
                        </StatusItem>
                    ))}
                </GamemodeSection>
            )}

            {statuses2on2.length > 0 && (
                <GamemodeSection>
                    <GamemodeHeader>
                        <GamemodeTitle>2on2</GamemodeTitle>
                        {streak2on2 !== 0 && (
                            <StreakIndicator $streak={streak2on2}>
                                {streak2on2 > 0 ? "+" : ""}
                                {streak2on2}
                            </StreakIndicator>
                        )}
                    </GamemodeHeader>
                    {statuses2on2.map((status) => (
                        <StatusItem key={status}>
                            <StatusIcon>
                                {STATUS_ICONS_MAP[status] || "•"}
                            </StatusIcon>
                            <StatusLabel>
                                {STATUS_LABELS_MAP[status] || status}
                            </StatusLabel>
                        </StatusItem>
                    ))}
                </GamemodeSection>
            )}
        </TooltipContent>
    );
}

export function StatusTooltip({
    isVisible,
    position,
    statuses1on1 = [],
    statuses2on2 = [],
    streak1on1 = 0,
    streak2on2 = 0,
}) {
    if (!isVisible) return null;

    return createPortal(
        <TooltipContainer
            style={{
                top: position.top,
                left: position.left,
            }}
        >
            <StatusTooltipContent
                statuses1on1={statuses1on1}
                statuses2on2={statuses2on2}
                streak1on1={streak1on1}
                streak2on2={streak2on2}
            />
        </TooltipContainer>,
        document.body
    );
}

/* ----------------------------------------
   TeamStatusTooltip Component
   
   Simplified tooltip for team statuses (no gamemode separation)
   Props:
   - isVisible: boolean
   - position: { top, left }
   - statuses: string[] - Active status keys
   - streak: number - Current streak
----------------------------------------- */
export function TeamStatusTooltip({
    isVisible,
    position,
    statuses = [],
    streak = 0,
}) {
    if (!isVisible || statuses.length === 0) return null;

    return createPortal(
        <TooltipContainer
            style={{
                top: position.top,
                left: position.left,
            }}
        >
            <TooltipContent>
                <TooltipArrow />
                <TooltipHeader>
                    <TooltipIcon>📊</TooltipIcon>
                    <TooltipTitle>Active Status</TooltipTitle>
                </TooltipHeader>
                <GamemodeSection>
                    <GamemodeHeader>
                        <GamemodeTitle>Team (2on2)</GamemodeTitle>
                        {streak !== 0 && (
                            <StreakIndicator $streak={streak}>
                                {streak > 0 ? "+" : ""}
                                {streak}
                            </StreakIndicator>
                        )}
                    </GamemodeHeader>
                    {statuses.map((status) => (
                        <StatusItem key={status}>
                            <StatusIcon>
                                {STATUS_ICONS_MAP[status] || "•"}
                            </StatusIcon>
                            <StatusLabel>
                                {STATUS_LABELS_MAP[status] || status}
                            </StatusLabel>
                        </StatusItem>
                    ))}
                </GamemodeSection>
            </TooltipContent>
        </TooltipContainer>,
        document.body
    );
}

export default BountyTooltip;
