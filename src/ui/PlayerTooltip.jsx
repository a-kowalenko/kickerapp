import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import styled, { keyframes, css } from "styled-components";
import { FaFire, FaSnowflake } from "react-icons/fa";
import { GiCoins } from "react-icons/gi";
import Avatar from "./Avatar";
import StatusBadge from "./StatusBadge";
import SpinnerMini from "./SpinnerMini";
import { usePlayerStatusForAvatar } from "../features/players/usePlayerStatus";

/* ----------------------------------------
   Constants
----------------------------------------- */
const TOOLTIP_DELAY = 500; // ms
const LONG_PRESS_DELAY = 500; // ms for mobile
const TOOLTIP_WIDTH = 240;

/* ----------------------------------------
   Animations
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

/* ----------------------------------------
   Styled Components
----------------------------------------- */
const TooltipContainer = styled.div`
    position: fixed;
    z-index: 10000;
    animation: ${tooltipFadeIn} 0.2s ease;
    pointer-events: none;
`;

const TooltipCard = styled.div`
    background-color: var(--color-grey-0);
    border: 1px solid var(--secondary-border-color);
    border-radius: var(--border-radius-lg);
    padding: 1.2rem;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2), 0 4px 12px rgba(0, 0, 0, 0.1);
    min-width: ${TOOLTIP_WIDTH}px;
    max-width: ${TOOLTIP_WIDTH + 40}px;

    ${(props) =>
        props.$hasHighBounty &&
        css`
            border-color: rgba(234, 179, 8, 0.4);
            box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2),
                0 0 20px rgba(234, 179, 8, 0.15);
        `}

    ${(props) =>
        props.$hasColdStreak &&
        css`
            border-color: rgba(59, 130, 246, 0.4);
            box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2),
                0 0 20px rgba(59, 130, 246, 0.15);
        `}
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

const PlayerHeader = styled.div`
    display: flex;
    align-items: center;
    gap: 1rem;
`;

const PlayerInfo = styled.div`
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
`;

const PlayerName = styled.span`
    font-weight: 700;
    font-size: 1.4rem;
    color: var(--primary-text-color);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
`;

const StatusRow = styled.div`
    display: flex;
    align-items: center;
    gap: 0.4rem;
    flex-wrap: wrap;
`;

const Divider = styled.div`
    height: 1px;
    background: linear-gradient(
        90deg,
        transparent,
        var(--secondary-border-color),
        transparent
    );
    margin: 1rem 0;
`;

const StatsRow = styled.div`
    display: flex;
    gap: 1.5rem;
    justify-content: center;
`;

const StatItem = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.3rem;
`;

const StatLabel = styled.span`
    font-size: 0.9rem;
    color: var(--tertiary-text-color);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-weight: 500;
`;

const StatValues = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.2rem;
`;

const StatValue = styled.span`
    display: flex;
    align-items: center;
    gap: 0.3rem;
    font-size: 1.2rem;
    font-weight: 700;
    color: ${(props) => props.$color || "var(--primary-text-color)"};

    svg {
        font-size: 1.1rem;
    }
`;

const GamemodeTag = styled.span`
    font-size: 0.85rem;
    color: var(--tertiary-text-color);
    font-weight: 500;
    background: var(--secondary-background-color);
    padding: 0.1rem 0.4rem;
    border-radius: var(--border-radius-sm);
`;

const LoadingContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1.5rem;
    min-width: 100px;
`;

const NoStatsMessage = styled.div`
    text-align: center;
    color: var(--tertiary-text-color);
    font-size: 1.1rem;
    font-style: italic;
    padding: 0.5rem 0;
`;

/* ----------------------------------------
   PlayerTooltipContent Component
----------------------------------------- */
function PlayerTooltipContent({ player, playerId }) {
    const {
        bounty1on1,
        bounty2on2,
        totalBounty,
        streak1on1,
        streak2on2,
        bestStreak,
        statuses1on1,
        statuses2on2,
        isLoading: statusLoading,
    } = usePlayerStatusForAvatar(playerId);

    if (statusLoading) {
        return (
            <TooltipCard>
                <LoadingContainer>
                    <SpinnerMini />
                </LoadingContainer>
            </TooltipCard>
        );
    }

    const hasBounty = totalBounty > 0;
    const hasStreak = Math.abs(bestStreak) >= 3;
    const hasStats = hasBounty || hasStreak;
    const hasHighBounty = totalBounty >= 30;
    const hasColdStreak = bestStreak <= -5;

    // Get all unique statuses from both gamemodes
    const allStatuses = [...new Set([...statuses1on1, ...statuses2on2])];

    return (
        <TooltipCard
            $hasHighBounty={hasHighBounty}
            $hasColdStreak={hasColdStreak && !hasHighBounty}
        >
            <TooltipArrow />
            <PlayerHeader>
                <Avatar
                    player={player}
                    $size="small"
                    showStatus={true}
                    $cursor="default"
                    bountyData={{ bounty1on1, bounty2on2 }}
                />
                <PlayerInfo>
                    <PlayerName>{player?.name || "Unknown"}</PlayerName>
                    {allStatuses.length > 0 && (
                        <StatusRow>
                            {allStatuses.slice(0, 2).map((status) => (
                                <StatusBadge
                                    key={status}
                                    status={status}
                                    size="small"
                                    showLabel
                                />
                            ))}
                        </StatusRow>
                    )}
                </PlayerInfo>
            </PlayerHeader>

            {hasStats && (
                <>
                    <Divider />
                    <StatsRow>
                        {/* Bounty Section */}
                        {hasBounty && (
                            <StatItem>
                                <StatLabel>Bounty</StatLabel>
                                <StatValues>
                                    {bounty1on1 > 0 && (
                                        <StatValue $color="#EAB308">
                                            <GiCoins />
                                            {bounty1on1}
                                            <GamemodeTag>1v1</GamemodeTag>
                                        </StatValue>
                                    )}
                                    {bounty2on2 > 0 && (
                                        <StatValue $color="#EAB308">
                                            <GiCoins />
                                            {bounty2on2}
                                            <GamemodeTag>2v2</GamemodeTag>
                                        </StatValue>
                                    )}
                                </StatValues>
                            </StatItem>
                        )}

                        {/* Streak Section */}
                        {hasStreak && (
                            <StatItem>
                                <StatLabel>Streak</StatLabel>
                                <StatValues>
                                    {Math.abs(streak1on1) >= 3 && (
                                        <StatValue
                                            $color={
                                                streak1on1 > 0
                                                    ? "#EF4444"
                                                    : "#3B82F6"
                                            }
                                        >
                                            {streak1on1 > 0 ? (
                                                <FaFire />
                                            ) : (
                                                <FaSnowflake />
                                            )}
                                            {Math.abs(streak1on1)}
                                            <GamemodeTag>1v1</GamemodeTag>
                                        </StatValue>
                                    )}
                                    {Math.abs(streak2on2) >= 3 && (
                                        <StatValue
                                            $color={
                                                streak2on2 > 0
                                                    ? "#EF4444"
                                                    : "#3B82F6"
                                            }
                                        >
                                            {streak2on2 > 0 ? (
                                                <FaFire />
                                            ) : (
                                                <FaSnowflake />
                                            )}
                                            {Math.abs(streak2on2)}
                                            <GamemodeTag>2v2</GamemodeTag>
                                        </StatValue>
                                    )}
                                </StatValues>
                            </StatItem>
                        )}
                    </StatsRow>
                </>
            )}

            {!hasStats && allStatuses.length === 0 && (
                <NoStatsMessage>No active bounty or streak</NoStatsMessage>
            )}
        </TooltipCard>
    );
}

/* ----------------------------------------
   PlayerTooltip Component (Portal)
----------------------------------------- */
export function PlayerTooltip({ isVisible, position, player, playerId }) {
    if (!isVisible || !playerId) return null;

    return createPortal(
        <TooltipContainer
            style={{
                top: position.top,
                left: position.left,
            }}
        >
            <PlayerTooltipContent player={player} playerId={playerId} />
        </TooltipContainer>,
        document.body
    );
}

/* ----------------------------------------
   usePlayerTooltip Hook
   
   Handles tooltip logic with:
   - 500ms hover delay (desktop)
   - Long-press support (mobile)
   - Position calculation with viewport bounds
   
   Returns:
   - isVisible: boolean - Whether tooltip should be shown
   - tooltipPos: { top, left } - Position for tooltip
   - handleMouseEnter: () => void
   - handleMouseLeave: () => void
   - handleTouchStart: (e) => void
   - handleTouchEnd: () => void
   - triggerRef: React.RefObject
----------------------------------------- */
export function usePlayerTooltip(tooltipWidth = TOOLTIP_WIDTH) {
    const [isVisible, setIsVisible] = useState(false);
    const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });
    const triggerRef = useRef(null);
    const hoverTimeoutRef = useRef(null);
    const longPressTimeoutRef = useRef(null);
    const isLongPressRef = useRef(false);

    const calculatePosition = useCallback(() => {
        if (!triggerRef.current) return;

        const rect = triggerRef.current.getBoundingClientRect();
        let left = rect.left + rect.width / 2 - tooltipWidth / 2;

        // Keep tooltip within viewport horizontally
        if (left < 8) left = 8;
        if (left + tooltipWidth > window.innerWidth - 8) {
            left = window.innerWidth - tooltipWidth - 8;
        }

        // Position below the element
        let top = rect.bottom + 8;

        // If tooltip would go below viewport, position above
        const estimatedHeight = 150; // Rough estimate
        if (top + estimatedHeight > window.innerHeight - 8) {
            top = rect.top - estimatedHeight - 8;
        }

        setTooltipPos({ top, left });
    }, [tooltipWidth]);

    const handleMouseEnter = useCallback(() => {
        calculatePosition();
        hoverTimeoutRef.current = setTimeout(() => {
            setIsVisible(true);
        }, TOOLTIP_DELAY);
    }, [calculatePosition]);

    const handleMouseLeave = useCallback(() => {
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
            hoverTimeoutRef.current = null;
        }
        setIsVisible(false);
    }, []);

    const handleTouchStart = useCallback(() => {
        // Reset long press flag
        isLongPressRef.current = false;
        calculatePosition();

        longPressTimeoutRef.current = setTimeout(() => {
            isLongPressRef.current = true;
            setIsVisible(true);
            // Provide haptic feedback if available
            if (navigator.vibrate) {
                navigator.vibrate(50);
            }
        }, LONG_PRESS_DELAY);
    }, [calculatePosition]);

    const handleTouchEnd = useCallback((e) => {
        if (longPressTimeoutRef.current) {
            clearTimeout(longPressTimeoutRef.current);
            longPressTimeoutRef.current = null;
        }

        // If it was a long press, prevent the click/navigation
        if (isLongPressRef.current) {
            e.preventDefault();
            // Keep tooltip visible for a moment, then hide
            setTimeout(() => {
                setIsVisible(false);
            }, 2000);
        }
    }, []);

    const handleTouchMove = useCallback(() => {
        // Cancel long press if user moves finger
        if (longPressTimeoutRef.current) {
            clearTimeout(longPressTimeoutRef.current);
            longPressTimeoutRef.current = null;
        }
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (hoverTimeoutRef.current) {
                clearTimeout(hoverTimeoutRef.current);
            }
            if (longPressTimeoutRef.current) {
                clearTimeout(longPressTimeoutRef.current);
            }
        };
    }, []);

    // Close tooltip when clicking outside (for mobile long-press)
    useEffect(() => {
        if (!isVisible) return;

        const handleClickOutside = (e) => {
            if (triggerRef.current && !triggerRef.current.contains(e.target)) {
                setIsVisible(false);
            }
        };

        document.addEventListener("touchstart", handleClickOutside);
        document.addEventListener("click", handleClickOutside);

        return () => {
            document.removeEventListener("touchstart", handleClickOutside);
            document.removeEventListener("click", handleClickOutside);
        };
    }, [isVisible]);

    return {
        isVisible,
        tooltipPos,
        handleMouseEnter,
        handleMouseLeave,
        handleTouchStart,
        handleTouchEnd,
        handleTouchMove,
        triggerRef,
    };
}

/* ----------------------------------------
   PlayerNameWithTooltip Component
   
   Wrapper that adds tooltip functionality to player name
   
   Props:
   - player: object - Player object { id, name, avatar }
   - playerId: string | number - Player ID (fallback if player not provided)
   - children: ReactNode - The content to wrap (player name)
   - className: string - Optional class name
----------------------------------------- */
const TooltipTrigger = styled.span`
    cursor: pointer;
    display: inline;
`;

export function PlayerNameWithTooltip({
    player,
    playerId,
    children,
    className,
}) {
    const {
        isVisible,
        tooltipPos,
        handleMouseEnter,
        handleMouseLeave,
        handleTouchStart,
        handleTouchEnd,
        handleTouchMove,
        triggerRef,
    } = usePlayerTooltip();

    const resolvedPlayerId = player?.id || playerId;

    if (!resolvedPlayerId) {
        return <>{children}</>;
    }

    return (
        <>
            <TooltipTrigger
                ref={triggerRef}
                className={className}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                onTouchMove={handleTouchMove}
            >
                {children}
            </TooltipTrigger>
            <PlayerTooltip
                isVisible={isVisible}
                position={tooltipPos}
                player={player}
                playerId={resolvedPlayerId}
            />
        </>
    );
}

export default PlayerTooltip;
