import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import styled, { keyframes, css } from "styled-components";
import SpinnerMini from "./SpinnerMini";
import { MATCH_ACTIVE } from "../utils/constants";

/* ----------------------------------------
   Constants
----------------------------------------- */
const TOOLTIP_DELAY = 500; // ms
const LONG_PRESS_DELAY = 500; // ms for mobile
const TOOLTIP_WIDTH = 280;

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

const livePulse = keyframes`
    0%, 100% {
        opacity: 1;
    }
    50% {
        opacity: 0.5;
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
        props.$isLive &&
        css`
            border-color: rgba(34, 197, 94, 0.5);
            box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2),
                0 0 20px rgba(34, 197, 94, 0.15);
        `}
`;

const TooltipArrow = styled.div`
    position: absolute;
    width: 0;
    height: 0;
    border-left: 6px solid transparent;
    border-right: 6px solid transparent;

    ${(props) =>
        props.$position === "below"
            ? css`
                  top: -6px;
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
              `
            : css`
                  bottom: -6px;
                  border-top: 6px solid var(--secondary-border-color);

                  &::after {
                      content: "";
                      position: absolute;
                      bottom: 1px;
                      left: -5px;
                      width: 0;
                      height: 0;
                      border-left: 5px solid transparent;
                      border-right: 5px solid transparent;
                      border-top: 5px solid var(--color-grey-0);
                  }
              `}
`;

const MatchHeader = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.6rem;
    margin-bottom: 0.8rem;
`;

const MatchNumber = styled.span`
    font-size: 1.1rem;
    color: var(--tertiary-text-color);
    font-weight: 500;
`;

const LiveBadge = styled.span`
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    background-color: rgba(34, 197, 94, 0.15);
    color: #22c55e;
    font-size: 0.85rem;
    font-weight: 700;
    padding: 0.2rem 0.6rem;
    border-radius: var(--border-radius-sm);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    animation: ${livePulse} 2s ease-in-out infinite;
`;

const LiveDot = styled.span`
    width: 6px;
    height: 6px;
    background-color: #22c55e;
    border-radius: 50%;
`;

const GamemodeTag = styled.span`
    font-size: 0.85rem;
    color: var(--tertiary-text-color);
    font-weight: 500;
    background: var(--secondary-background-color);
    padding: 0.1rem 0.5rem;
    border-radius: var(--border-radius-sm);
`;

const MatchContent = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
`;

const TeamSection = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: ${(props) =>
        props.$align === "left" ? "flex-start" : "flex-end"};
    gap: 0.3rem;
    min-width: 0;
`;

const PlayerName = styled.span`
    font-size: 1.2rem;
    font-weight: 600;
    color: var(--primary-text-color);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
`;

const ScoreSection = styled.div`
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0 0.8rem;
`;

const Score = styled.span`
    font-size: 2rem;
    font-weight: 700;
    color: ${(props) =>
        props.$winning ? "#22c55e" : "var(--primary-text-color)"};
    min-width: 2rem;
    text-align: center;
`;

const ScoreDivider = styled.span`
    font-size: 1.6rem;
    color: var(--tertiary-text-color);
    font-weight: 300;
`;

const LoadingContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1.5rem;
    min-width: 100px;
`;

const ErrorMessage = styled.div`
    text-align: center;
    color: var(--color-red-500);
    font-size: 1.1rem;
    padding: 0.5rem 0;
`;

/* ----------------------------------------
   MatchTooltipContent Component
----------------------------------------- */
function MatchTooltipContent({
    match,
    isLoading,
    error,
    arrowPosition,
    arrowLeft,
}) {
    if (isLoading) {
        return (
            <TooltipCard>
                <TooltipArrow
                    $position={arrowPosition}
                    style={{ left: arrowLeft }}
                />
                <LoadingContainer>
                    <SpinnerMini />
                </LoadingContainer>
            </TooltipCard>
        );
    }

    if (error || !match) {
        return (
            <TooltipCard>
                <TooltipArrow
                    $position={arrowPosition}
                    style={{ left: arrowLeft }}
                />
                <ErrorMessage>Match not found</ErrorMessage>
            </TooltipCard>
        );
    }

    const isLive = match.status === MATCH_ACTIVE;
    const is2on2 = match.gamemode === "2on2";

    const team1Score = match.scoreTeam1 ?? 0;
    const team2Score = match.scoreTeam2 ?? 0;
    const team1Winning = team1Score > team2Score;
    const team2Winning = team2Score > team1Score;

    // Get player names
    const team1Players = [match.player1?.name];
    const team2Players = [match.player2?.name];

    if (is2on2) {
        team1Players.push(match.player3?.name);
        team2Players.push(match.player4?.name);
    }

    return (
        <TooltipCard $isLive={isLive}>
            <TooltipArrow
                $position={arrowPosition}
                style={{ left: arrowLeft }}
            />

            <MatchHeader>
                <MatchNumber>#{match.nr}</MatchNumber>
                <GamemodeTag>{is2on2 ? "2v2" : "1v1"}</GamemodeTag>
                {isLive && (
                    <LiveBadge>
                        <LiveDot />
                        Live
                    </LiveBadge>
                )}
            </MatchHeader>

            <MatchContent>
                <TeamSection $align="left">
                    {team1Players.map(
                        (name, idx) =>
                            name && <PlayerName key={idx}>{name}</PlayerName>
                    )}
                </TeamSection>

                <ScoreSection>
                    <Score $winning={team1Winning}>{team1Score}</Score>
                    <ScoreDivider>:</ScoreDivider>
                    <Score $winning={team2Winning}>{team2Score}</Score>
                </ScoreSection>

                <TeamSection $align="right">
                    {team2Players.map(
                        (name, idx) =>
                            name && <PlayerName key={idx}>{name}</PlayerName>
                    )}
                </TeamSection>
            </MatchContent>
        </TooltipCard>
    );
}

/* ----------------------------------------
   MatchTooltip Component (Portal)
----------------------------------------- */
export function MatchTooltip({
    isVisible,
    position,
    arrowPosition,
    arrowLeft,
    match,
    isLoading,
    error,
}) {
    if (!isVisible) return null;

    return createPortal(
        <TooltipContainer
            style={{
                top: position.top,
                left: position.left,
            }}
        >
            <MatchTooltipContent
                match={match}
                isLoading={isLoading}
                error={error}
                arrowPosition={arrowPosition}
                arrowLeft={arrowLeft}
            />
        </TooltipContainer>,
        document.body
    );
}

/* ----------------------------------------
   useMatchTooltip Hook
   
   Handles tooltip logic with:
   - 500ms hover delay (desktop)
   - Long-press support (mobile)
   - Position calculation with viewport bounds (prefer below)
----------------------------------------- */
export function useMatchTooltip(tooltipWidth = TOOLTIP_WIDTH) {
    const [isVisible, setIsVisible] = useState(false);
    const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });
    const [arrowPosition, setArrowPosition] = useState("below"); // "below" = arrow on top, tooltip below trigger
    const [arrowLeft, setArrowLeft] = useState("50%");
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

        // Calculate arrow position to point at trigger center
        const triggerCenter = rect.left + rect.width / 2;
        const arrowLeftPos = triggerCenter - left;
        setArrowLeft(`${arrowLeftPos}px`);

        // Position below the element (preferred)
        const estimatedHeight = 120;
        let top = rect.bottom + 8;
        let arrowPos = "below";

        // If tooltip would go below viewport, position above
        if (top + estimatedHeight > window.innerHeight - 8) {
            top = rect.top - estimatedHeight - 8;
            arrowPos = "above";
        }

        setArrowPosition(arrowPos);
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
        isLongPressRef.current = false;
        calculatePosition();

        longPressTimeoutRef.current = setTimeout(() => {
            isLongPressRef.current = true;
            setIsVisible(true);
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

        if (isLongPressRef.current) {
            e.preventDefault();
            setTimeout(() => {
                setIsVisible(false);
            }, 2000);
        }
    }, []);

    const handleTouchMove = useCallback(() => {
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
        arrowPosition,
        arrowLeft,
        handleMouseEnter,
        handleMouseLeave,
        handleTouchStart,
        handleTouchEnd,
        handleTouchMove,
        triggerRef,
    };
}

export default MatchTooltip;
