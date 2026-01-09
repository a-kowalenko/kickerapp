import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import { HiOutlineChartBar } from "react-icons/hi2";
import { FaCrown } from "react-icons/fa";
import { useRecentPerformance } from "./useRecentPerformance";
import { hasPlayerWonMatch } from "../../utils/helpers";
import LoadingSpinner from "../../ui/LoadingSpinner";
import { MatchTooltip, useMatchTooltip } from "../../ui/MatchTooltip";
import { useMatchPreview } from "../matches/useMatchPreview";
import { media } from "../../utils/constants";

const Card = styled.div`
    background-color: var(--color-grey-0);
    border: 1px solid var(--secondary-border-color);
    border-radius: var(--border-radius-md);
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

    ${media.tablet} {
        border-radius: var(--border-radius-sm);
    }

    ${media.mobile} {
        border-radius: 0;
        border-left: none;
        border-right: none;
    }
`;

const CardHeader = styled.div`
    display: flex;
    align-items: center;
    gap: 1.2rem;
    padding: 2rem 2.4rem;
    background-color: var(--color-grey-50);
    border-bottom: 1px solid var(--secondary-border-color);

    ${media.mobile} {
        padding: 1.6rem;
    }
`;

const IconWrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 4rem;
    height: 4rem;
    border-radius: 50%;
    background-color: var(--primary-button-color);
    color: var(--primary-button-color-text);

    svg {
        width: 2rem;
        height: 2rem;
    }

    ${media.mobile} {
        width: 3.2rem;
        height: 3.2rem;

        svg {
            width: 1.6rem;
            height: 1.6rem;
        }
    }
`;

const HeaderContent = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
`;

const CardTitle = styled.span`
    font-size: 1.8rem;
    font-weight: 600;
    color: var(--color-grey-800);

    ${media.mobile} {
        font-size: 1.6rem;
    }
`;

const CardDescription = styled.span`
    font-size: 1.4rem;
    color: var(--color-grey-500);

    ${media.mobile} {
        font-size: 1.2rem;
    }
`;

const CardBody = styled.div`
    padding: 2.4rem;
    display: flex;
    flex-direction: ${(props) => (props.$hasBoth ? "row" : "column")};
    justify-content: ${(props) => (props.$hasBoth ? "space-evenly" : "center")};
    align-items: ${(props) => (props.$hasBoth ? "flex-start" : "center")};
    gap: 3.6rem;
    flex-wrap: wrap;

    ${media.tablet} {
        flex-direction: column;
        align-items: center;
        gap: 2.4rem;
    }

    ${media.mobile} {
        padding: 1.6rem;
        gap: 2rem;
        flex-direction: column;
        align-items: center;
    }
`;

const GamemodeSection = styled.div`
    display: flex;
    flex-direction: column;
    gap: 1.2rem;
`;

const GamemodeHeader = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
`;

const GamemodeTitle = styled.span`
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--color-grey-700);
    text-transform: uppercase;
    letter-spacing: 1px;
`;

const ShieldsContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.6rem;
    flex-wrap: nowrap;

    ${media.mobile} {
        gap: 0.4rem;
    }
`;

const Shield = styled.div`
    position: relative;
    width: 3.6rem;
    height: 4.2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    opacity: ${(props) => props.$opacity || 1};
    transition: transform 0.15s ease, filter 0.15s ease;

    &:hover {
        transform: scale(1.15);
        filter: brightness(1.1);
    }

    ${media.mobile} {
        width: 3rem;
        height: 3.6rem;
    }
`;

const ShieldSvg = styled.svg`
    width: 100%;
    height: 100%;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
`;

const CrownIcon = styled(FaCrown)`
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 1.6rem;
    height: 1.6rem;
    color: ${(props) => (props.$isWin ? "#2d5016" : "#7a1f1f")};

    ${media.mobile} {
        width: 1.3rem;
        height: 1.3rem;
    }
`;

const MmrChange = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    font-size: 1.6rem;
    font-weight: 700;
    color: ${(props) =>
        props.$positive
            ? "var(--color-green-700)"
            : props.$negative
            ? "var(--color-red-700)"
            : "var(--color-grey-600)"};

    ${media.mobile} {
        font-size: 1.4rem;
    }
`;

const MmrArrow = styled.span`
    font-size: 1.4rem;
`;

const LoadingContainer = styled.div`
    display: flex;
    justify-content: center;
    padding: 2rem;
`;

function ShieldIcon({ isWin, matchId, opacity }) {
    const navigate = useNavigate();
    const { match, isLoading, error } = useMatchPreview(matchId);
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

    const fillColor = isWin ? "#4ade80" : "#f87171";
    const strokeColor = isWin ? "#166534" : "#991b1b";

    const handleClick = (e) => {
        e.preventDefault();
        navigate(`/matches/${matchId}`);
    };

    return (
        <>
            <Shield
                ref={triggerRef}
                $opacity={opacity}
                onClick={handleClick}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                onTouchMove={handleTouchMove}
            >
                <ShieldSvg viewBox="0 0 36 42" fill="none">
                    <path
                        d="M18 2L4 8V18C4 28 18 38 18 38C18 38 32 28 32 18V8L18 2Z"
                        fill={fillColor}
                        stroke={strokeColor}
                        strokeWidth="2"
                    />
                </ShieldSvg>
                <CrownIcon $isWin={isWin} />
            </Shield>
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

function GamemodePerformance({ title, matches, playerId, isTeamMode = false }) {
    if (!matches || matches.length === 0) {
        return null;
    }

    // Calculate total MMR change
    const totalMmrChange = matches.reduce((sum, match) => {
        if (isTeamMode) {
            // For team matches, check which team the player is on
            const isTeam1 =
                playerId === match.player1?.id ||
                playerId === match.player3?.id;
            const mmrChange = isTeam1
                ? match.mmrChangeTeam1
                : match.mmrChangeTeam2;
            return sum + (mmrChange || 0);
        }
        const isTeam1 =
            playerId === match.player1?.id || playerId === match.player3?.id;
        const mmrChange = isTeam1 ? match.mmrChangeTeam1 : match.mmrChangeTeam2;
        return sum + (mmrChange || 0);
    }, 0);

    // Reverse to show oldest first (newest on right)
    const orderedMatches = [...matches].reverse();
    const matchCount = orderedMatches.length;

    // Calculate opacity: oldest (left) gets 0.5, newest (right) gets 1.0
    const getOpacity = (index) => {
        if (matchCount <= 1) return 1;
        // Linear interpolation from 0.5 (oldest) to 1.0 (newest)
        return 0.5 + (index / (matchCount - 1)) * 0.5;
    };

    return (
        <GamemodeSection>
            <GamemodeHeader>
                <GamemodeTitle>
                    Last {matches.length} Games - {title}
                </GamemodeTitle>
            </GamemodeHeader>
            <ShieldsContainer>
                {orderedMatches.map((match, index) => {
                    const isWin = hasPlayerWonMatch(playerId, match);
                    return (
                        <ShieldIcon
                            key={match.id}
                            isWin={isWin}
                            matchId={match.id}
                            opacity={getOpacity(index)}
                        />
                    );
                })}
            </ShieldsContainer>
            <MmrChange
                $positive={totalMmrChange > 0}
                $negative={totalMmrChange < 0}
            >
                <MmrArrow>{totalMmrChange >= 0 ? "▲" : "▼"}</MmrArrow>
                {Math.abs(Math.round(totalMmrChange))} MMR
            </MmrChange>
        </GamemodeSection>
    );
}

function RecentPerformance({ playerName, playerId }) {
    const { matches1on1, matches2on2, matchesTeam, isLoading } =
        useRecentPerformance(playerName);

    const hasData =
        matches1on1?.length > 0 ||
        matches2on2?.length > 0 ||
        matchesTeam?.length > 0;

    if (!isLoading && !hasData) {
        return null;
    }

    // Count how many gamemodes have data for layout
    const gamemodesWithData = [
        matches1on1?.length > 0,
        matches2on2?.length > 0,
        matchesTeam?.length > 0,
    ].filter(Boolean).length;

    return (
        <Card>
            <CardHeader>
                <IconWrapper>
                    <HiOutlineChartBar />
                </IconWrapper>
                <HeaderContent>
                    <CardTitle>Recent Performance</CardTitle>
                    <CardDescription>
                        Win/loss record from recent matches
                    </CardDescription>
                </HeaderContent>
            </CardHeader>
            {isLoading ? (
                <LoadingContainer>
                    <LoadingSpinner />
                </LoadingContainer>
            ) : (
                <CardBody $hasBoth={gamemodesWithData >= 2}>
                    <GamemodePerformance
                        title="1v1"
                        matches={matches1on1}
                        playerId={playerId}
                    />
                    <GamemodePerformance
                        title="2v2"
                        matches={matches2on2}
                        playerId={playerId}
                    />
                    <GamemodePerformance
                        title="Team"
                        matches={matchesTeam}
                        playerId={playerId}
                        isTeamMode={true}
                    />
                </CardBody>
            )}
        </Card>
    );
}

export default RecentPerformance;
