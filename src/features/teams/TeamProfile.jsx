import { useParams, useNavigate } from "react-router-dom";
import styled from "styled-components";
import { useState } from "react";
import {
    HiOutlineChartBar,
    HiOutlineTrophy,
    HiArrowLeft,
} from "react-icons/hi2";
import {
    DEFAULT_AVATAR,
    media,
    TEAM_STATUS_DISSOLVED,
    TEAM_STATUS_ACTIVE,
} from "../../utils/constants";
import Avatar from "../../ui/Avatar";
import Button from "../../ui/Button";
import LoadingSpinner from "../../ui/LoadingSpinner";
import Error from "../../ui/Error";
import SpinnerMini from "../../ui/SpinnerMini";
import { useTeam, useDissolveTeam, useTeamMatches } from "./useTeams";
import { useOwnPlayer } from "../../hooks/useOwnPlayer";

/* ----------------------------------------
   MMR Color Helpers
----------------------------------------- */
const getMmrColor = (mmr) => {
    if (mmr >= 1500) return "var(--mmr-gold)";
    if (mmr >= 1400) return "var(--mmr-red)";
    if (mmr >= 1300) return "var(--mmr-pink)";
    if (mmr >= 1100) return "var(--mmr-purple)";
    if (mmr >= 900) return "var(--mmr-blue)";
    if (mmr >= 700) return "var(--mmr-cyan)";
    return "var(--mmr-grey)";
};

const PageContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 2.4rem;
    max-width: 80rem;
    margin: 0 auto;
    padding: 2rem;

    ${media.mobile} {
        padding: 1rem;
        gap: 1.6rem;
    }
`;

const BackButton = styled.button`
    display: flex;
    align-items: center;
    gap: 0.8rem;
    padding: 0.8rem 1.2rem;
    font-size: 1.4rem;
    font-weight: 500;
    color: var(--color-grey-600);
    background: none;
    border: none;
    cursor: pointer;
    transition: color 0.2s ease;
    align-self: flex-start;

    &:hover {
        color: var(--primary-text-color);
    }

    & svg {
        width: 1.8rem;
        height: 1.8rem;
    }
`;

const Card = styled.div`
    background-color: var(--color-grey-0);
    border: 1px solid var(--secondary-border-color);
    border-radius: var(--border-radius-md);
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

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
`;

const CardBody = styled.div`
    padding: 2.4rem;

    ${media.mobile} {
        padding: 1.6rem;
    }
`;

// Team Header Card
const TeamHeaderCard = styled(Card)`
    overflow: visible;
`;

const TeamHeaderContent = styled.div`
    display: flex;
    align-items: center;
    gap: 2.4rem;
    padding: 2.4rem;

    ${media.mobile} {
        flex-direction: column;
        text-align: center;
        padding: 2rem;
    }
`;

const TeamLogo = styled.img`
    width: 10rem;
    height: 10rem;
    border-radius: var(--border-radius-lg);
    object-fit: cover;
    border: 3px solid var(--secondary-border-color);

    ${media.mobile} {
        width: 8rem;
        height: 8rem;
    }
`;

const DefaultLogo = styled.div`
    width: 10rem;
    height: 10rem;
    border-radius: var(--border-radius-lg);
    background: linear-gradient(
        135deg,
        var(--color-brand-100) 0%,
        var(--color-brand-200) 100%
    );
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 4rem;
    font-weight: 700;
    color: var(--color-brand-600);
    border: 3px solid var(--secondary-border-color);

    ${media.mobile} {
        width: 8rem;
        height: 8rem;
        font-size: 3rem;
    }
`;

const TeamInfo = styled.div`
    display: flex;
    flex-direction: column;
    gap: 1.2rem;
    flex: 1;
`;

const TeamName = styled.h1`
    font-size: 2.8rem;
    font-weight: 700;
    color: var(--primary-text-color);
    margin: 0;

    ${media.mobile} {
        font-size: 2.2rem;
    }
`;

const TeamPlayers = styled.div`
    display: flex;
    align-items: center;
    gap: 1.2rem;

    ${media.mobile} {
        justify-content: center;
    }
`;

const PlayerAvatars = styled.div`
    display: flex;
    align-items: center;

    & > *:not(:first-child) {
        margin-left: -1rem;
    }
`;

const PlayerNames = styled.span`
    font-size: 1.6rem;
    color: var(--color-grey-600);
`;

const TeamStatsRow = styled.div`
    display: flex;
    gap: 2.4rem;

    ${media.mobile} {
        justify-content: center;
    }
`;

const StatItem = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.4rem;
`;

const StatValue = styled.span`
    font-family: "Sono";
    font-size: 2.4rem;
    font-weight: 600;
    color: ${(props) => props.$color || "var(--primary-text-color)"};
`;

const StatLabel = styled.span`
    font-size: 1.2rem;
    color: var(--color-grey-500);
    text-transform: uppercase;
    letter-spacing: 0.05em;
`;

const DissolvedBadge = styled.span`
    display: inline-flex;
    padding: 0.4rem 1.2rem;
    background-color: var(--color-grey-200);
    color: var(--color-grey-700);
    border-radius: var(--border-radius-sm);
    font-size: 1.2rem;
    font-weight: 600;
    text-transform: uppercase;
`;

const TeamActions = styled.div`
    display: flex;
    flex-direction: column;
    gap: 1rem;

    ${media.mobile} {
        width: 100%;
    }
`;

// Stats Grid
const StatsGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1.6rem;

    ${media.tablet} {
        grid-template-columns: repeat(2, 1fr);
    }

    ${media.mobile} {
        grid-template-columns: repeat(2, 1fr);
        gap: 1rem;
    }
`;

const StatCard = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.8rem;
    padding: 2rem;
    background-color: var(--color-grey-50);
    border-radius: var(--border-radius-sm);
`;

const StatCardValue = styled.span`
    font-family: "Sono";
    font-size: 2.8rem;
    font-weight: 600;
    color: var(--primary-text-color);
`;

const StatCardLabel = styled.span`
    font-size: 1.3rem;
    color: var(--color-grey-500);
    text-align: center;
`;

// Match History
const MatchList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 1rem;
`;

const MatchRow = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.2rem 1.6rem;
    background-color: var(--color-grey-50);
    border-radius: var(--border-radius-sm);
    border-left: 4px solid
        ${(props) =>
            props.$won ? "var(--color-green-600)" : "var(--color-red-600)"};
`;

const MatchTeams = styled.div`
    display: flex;
    align-items: center;
    gap: 1.2rem;
`;

const MatchScore = styled.span`
    font-family: "Sono";
    font-size: 1.8rem;
    font-weight: 600;
    color: var(--primary-text-color);
`;

const MatchMmrChange = styled.span`
    font-family: "Sono";
    font-size: 1.4rem;
    font-weight: 500;
    color: ${(props) =>
        props.$positive ? "var(--color-green-600)" : "var(--color-red-600)"};
`;

const EmptyMatches = styled.div`
    text-align: center;
    padding: 3rem;
    color: var(--color-grey-500);
`;

// Dissolve confirmation
const ConfirmBox = styled.div`
    display: flex;
    flex-direction: column;
    gap: 1.2rem;
    padding: 1.6rem;
    background-color: var(--color-red-50);
    border: 1px solid var(--color-red-200);
    border-radius: var(--border-radius-sm);
    margin-top: 1rem;
`;

const ConfirmText = styled.p`
    font-size: 1.4rem;
    color: var(--color-red-700);
    margin: 0;
`;

const ConfirmButtons = styled.div`
    display: flex;
    gap: 1rem;
`;

function TeamProfile() {
    const { teamId } = useParams();
    const navigate = useNavigate();
    const [showDissolveConfirm, setShowDissolveConfirm] = useState(false);

    const { team, isLoading, error } = useTeam(teamId);
    const { matches, isLoading: isLoadingMatches } = useTeamMatches(teamId);
    const { data: ownPlayer } = useOwnPlayer();
    const { dissolveTeam, isLoading: isDissolving } = useDissolveTeam();

    if (isLoading) return <LoadingSpinner />;
    if (error) return <Error message="Team not found" />;
    if (!team) return <Error message="Team not found" />;

    const { name, logo_url, player1, player2, status, mmr, wins, losses } =
        team;

    const isDissolved = status === TEAM_STATUS_DISSOLVED;
    const isTeamMember =
        ownPlayer?.id === player1?.id || ownPlayer?.id === player2?.id;
    const canDissolve = isTeamMember && status === TEAM_STATUS_ACTIVE;

    const totalGames = wins + losses;
    const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;
    const mmrColor = getMmrColor(mmr);

    const initials = name
        .split(" ")
        .map((word) => word[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    const handleDissolve = () => {
        dissolveTeam(teamId, {
            onSuccess: () => {
                navigate("/teams");
            },
        });
    };

    return (
        <PageContainer>
            <BackButton onClick={() => navigate("/teams")}>
                <HiArrowLeft /> Back to Teams
            </BackButton>

            {/* Team Header */}
            <TeamHeaderCard>
                <TeamHeaderContent>
                    {logo_url ? (
                        <TeamLogo src={logo_url} alt={name} />
                    ) : (
                        <DefaultLogo>{initials}</DefaultLogo>
                    )}

                    <TeamInfo>
                        <TeamName>
                            {name}
                            {isDissolved && (
                                <>
                                    {" "}
                                    <DissolvedBadge>Dissolved</DissolvedBadge>
                                </>
                            )}
                        </TeamName>

                        <TeamPlayers>
                            <PlayerAvatars>
                                <Avatar
                                    $size="small"
                                    src={player1?.avatar || DEFAULT_AVATAR}
                                />
                                <Avatar
                                    $size="small"
                                    src={player2?.avatar || DEFAULT_AVATAR}
                                />
                            </PlayerAvatars>
                            <PlayerNames>
                                {player1?.name} & {player2?.name}
                            </PlayerNames>
                        </TeamPlayers>

                        <TeamStatsRow>
                            <StatItem>
                                <StatValue $color={mmrColor}>{mmr}</StatValue>
                                <StatLabel>MMR</StatLabel>
                            </StatItem>
                            <StatItem>
                                <StatValue>{wins}</StatValue>
                                <StatLabel>Wins</StatLabel>
                            </StatItem>
                            <StatItem>
                                <StatValue>{losses}</StatValue>
                                <StatLabel>Losses</StatLabel>
                            </StatItem>
                            <StatItem>
                                <StatValue>{winRate}%</StatValue>
                                <StatLabel>Win Rate</StatLabel>
                            </StatItem>
                        </TeamStatsRow>
                    </TeamInfo>

                    {canDissolve && (
                        <TeamActions>
                            {!showDissolveConfirm ? (
                                <Button
                                    $variation="danger"
                                    $size="small"
                                    onClick={() => setShowDissolveConfirm(true)}
                                >
                                    Dissolve Team
                                </Button>
                            ) : (
                                <ConfirmBox>
                                    <ConfirmText>
                                        Are you sure you want to dissolve this
                                        team? This cannot be undone.
                                    </ConfirmText>
                                    <ConfirmButtons>
                                        <Button
                                            $variation="secondary"
                                            $size="small"
                                            onClick={() =>
                                                setShowDissolveConfirm(false)
                                            }
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            $variation="danger"
                                            $size="small"
                                            onClick={handleDissolve}
                                            disabled={isDissolving}
                                        >
                                            {isDissolving ? (
                                                <SpinnerMini />
                                            ) : (
                                                "Confirm Dissolve"
                                            )}
                                        </Button>
                                    </ConfirmButtons>
                                </ConfirmBox>
                            )}
                        </TeamActions>
                    )}
                </TeamHeaderContent>
            </TeamHeaderCard>

            {/* Statistics */}
            <Card>
                <CardHeader>
                    <IconWrapper>
                        <HiOutlineChartBar />
                    </IconWrapper>
                    <HeaderContent>
                        <CardTitle>Statistics</CardTitle>
                    </HeaderContent>
                </CardHeader>
                <CardBody>
                    <StatsGrid>
                        <StatCard>
                            <StatCardValue>{totalGames}</StatCardValue>
                            <StatCardLabel>Total Games</StatCardLabel>
                        </StatCard>
                        <StatCard>
                            <StatCardValue>{wins}</StatCardValue>
                            <StatCardLabel>Victories</StatCardLabel>
                        </StatCard>
                        <StatCard>
                            <StatCardValue>{losses}</StatCardValue>
                            <StatCardLabel>Defeats</StatCardLabel>
                        </StatCard>
                        <StatCard>
                            <StatCardValue>{winRate}%</StatCardValue>
                            <StatCardLabel>Win Rate</StatCardLabel>
                        </StatCard>
                    </StatsGrid>
                </CardBody>
            </Card>

            {/* Match History */}
            <Card>
                <CardHeader>
                    <IconWrapper>
                        <HiOutlineTrophy />
                    </IconWrapper>
                    <HeaderContent>
                        <CardTitle>Recent Matches</CardTitle>
                    </HeaderContent>
                </CardHeader>
                <CardBody>
                    {isLoadingMatches ? (
                        <SpinnerMini />
                    ) : matches.length === 0 ? (
                        <EmptyMatches>
                            No matches played yet. Start a Team Match to see
                            your history here!
                        </EmptyMatches>
                    ) : (
                        <MatchList>
                            {matches.slice(0, 10).map((match) => {
                                const isTeam1 =
                                    match.team1_id === parseInt(teamId);
                                const won = isTeam1
                                    ? match.scoreTeam1 > match.scoreTeam2
                                    : match.scoreTeam2 > match.scoreTeam1;
                                const teamScore = isTeam1
                                    ? match.scoreTeam1
                                    : match.scoreTeam2;
                                const opponentScore = isTeam1
                                    ? match.scoreTeam2
                                    : match.scoreTeam1;
                                const opponentTeam = isTeam1
                                    ? match.team2
                                    : match.team1;
                                const mmrChange = isTeam1
                                    ? match.mmrChangeTeam1
                                    : match.mmrChangeTeam2;

                                return (
                                    <MatchRow key={match.id} $won={won}>
                                        <MatchTeams>
                                            <span>
                                                vs{" "}
                                                {opponentTeam?.name ||
                                                    "Unknown"}
                                            </span>
                                        </MatchTeams>
                                        <MatchScore>
                                            {teamScore} - {opponentScore}
                                        </MatchScore>
                                        {mmrChange && (
                                            <MatchMmrChange
                                                $positive={mmrChange > 0}
                                            >
                                                {mmrChange > 0 ? "+" : ""}
                                                {mmrChange}
                                            </MatchMmrChange>
                                        )}
                                    </MatchRow>
                                );
                            })}
                        </MatchList>
                    )}
                </CardBody>
            </Card>
        </PageContainer>
    );
}

export default TeamProfile;
