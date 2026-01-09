import styled, { keyframes } from "styled-components";
import { Link } from "react-router-dom";
import { MatchTooltip, useMatchTooltip } from "./MatchTooltip";
import { useMatchPreview } from "../features/matches/useMatchPreview";

/* ----------------------------------------
   Animations
----------------------------------------- */
const livePulse = keyframes`
    0%, 100% {
        opacity: 1;
    }
    50% {
        opacity: 0.6;
    }
`;

/* ----------------------------------------
   Styled Components
----------------------------------------- */
const MatchLinkStyled = styled(Link)`
    color: var(--color-orange-500, #f97316);
    font-weight: 600;
    text-decoration: none;
    background-color: rgba(249, 115, 22, 0.1);
    border-radius: 3px;
    padding: 0 3px;
    display: inline;
    cursor: pointer;

    &:hover {
        text-decoration: underline;
        background-color: rgba(249, 115, 22, 0.2);
    }
`;

const LiveIndicator = styled.span`
    color: #22c55e;
    font-size: 0.85em;
    font-weight: 700;
    margin-left: 0.3rem;
    animation: ${livePulse} 2s ease-in-out infinite;
`;

/**
 * MatchLinkWithTooltip - A match link that shows a tooltip with match details on hover
 *
 * @param {Object} props
 * @param {string|number} props.matchId - The ID of the match
 * @param {string} props.display - The display text for the link
 */
function MatchLinkWithTooltip({ matchId, display }) {
    const { match, isLoading, error, isLive } = useMatchPreview(matchId);
    const {
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
    } = useMatchTooltip();

    return (
        <>
            <MatchLinkStyled
                ref={triggerRef}
                to={`/matches/${matchId}`}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                onTouchMove={handleTouchMove}
            >
                #{display}
                {isLive && <LiveIndicator>(live)</LiveIndicator>}
            </MatchLinkStyled>
            <MatchTooltip
                isVisible={isVisible}
                position={tooltipPos}
                arrowPosition={arrowPosition}
                arrowLeft={arrowLeft}
                match={match}
                isLoading={isLoading}
                error={error}
            />
        </>
    );
}

export default MatchLinkWithTooltip;
