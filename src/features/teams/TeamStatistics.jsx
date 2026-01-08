import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import { HiOutlineChartBar, HiOutlineUsers } from "react-icons/hi2";
import { media } from "../../utils/constants";
import { useTeamMmrHistory } from "./useTeamMmrHistory";
import { useTeamOpponentStats } from "./useTeamOpponentStats";
import SpinnerMini from "../../ui/SpinnerMini";
import EmptyState from "../../ui/EmptyState";

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

const StyledTeamStatistics = styled.div`
    display: flex;
    flex-direction: column;
    gap: 2.4rem;

    ${media.tablet} {
        padding: 0 2.4rem;
    }

    ${media.mobile} {
        padding: 0;
        gap: 1.6rem;
    }
`;

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

    ${media.mobile} {
        padding: 1.2rem;
    }
`;

const LoadingContainer = styled.div`
    display: flex;
    justify-content: center;
    padding: 3rem;
`;

// Simple Chart Container
const ChartContainer = styled.div`
    height: 20rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
`;

const ChartCanvas = styled.div`
    flex: 1;
    position: relative;
    display: flex;
    align-items: flex-end;
    gap: 0.4rem;
    padding: 1rem;
    background-color: var(--color-grey-50);
    border-radius: var(--border-radius-sm);
    overflow: hidden;
`;

const ChartBar = styled.div`
    flex: 1;
    min-width: 0.6rem;
    max-width: 3rem;
    background-color: ${(props) => props.$color};
    border-radius: 0.2rem 0.2rem 0 0;
    transition: height 0.3s ease;
    height: ${(props) => props.$height}%;
    min-height: 0.4rem;

    &:hover {
        opacity: 0.8;
    }
`;

const ChartLegend = styled.div`
    display: flex;
    justify-content: space-between;
    padding: 0 1rem;
    font-size: 1.2rem;
    color: var(--color-grey-500);
`;

const StatsRow = styled.div`
    display: flex;
    gap: 2rem;
    margin-bottom: 2rem;
    flex-wrap: wrap;

    ${media.mobile} {
        gap: 1rem;
    }
`;

const StatBox = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    padding: 1.2rem 1.6rem;
    background-color: var(--color-grey-50);
    border-radius: var(--border-radius-sm);
    min-width: 12rem;

    ${media.mobile} {
        min-width: 0;
        flex: 1;
        padding: 1rem;
    }
`;

const StatLabel = styled.span`
    font-size: 1.2rem;
    color: var(--color-grey-500);
    text-transform: uppercase;
    letter-spacing: 0.5px;
`;

const StatValue = styled.span`
    font-family: "Sono";
    font-size: 2rem;
    font-weight: 600;
    color: ${(props) => props.$color || "var(--primary-text-color)"};

    ${media.mobile} {
        font-size: 1.8rem;
    }
`;

// Opponent Stats Table
const OpponentTable = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
`;

const OpponentRow = styled.div`
    display: grid;
    grid-template-columns: 1fr 0.5fr 0.5fr 0.6fr;
    align-items: center;
    padding: 1.2rem 1.4rem;
    background-color: var(--color-grey-50);
    border-radius: var(--border-radius-sm);
    cursor: pointer;
    transition: background-color 0.2s;

    &:hover {
        background-color: var(--color-grey-100);
    }

    ${media.mobile} {
        padding: 1rem;
        grid-template-columns: 1fr 0.6fr 0.6fr 0.7fr;
    }
`;

const OpponentHeader = styled(OpponentRow)`
    background-color: transparent;
    padding: 0.8rem 1.4rem;
    cursor: default;

    &:hover {
        background-color: transparent;
    }
`;

const OpponentHeaderText = styled.span`
    font-size: 1.2rem;
    color: var(--color-grey-500);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-weight: 600;

    ${media.mobile} {
        font-size: 1.1rem;
    }
`;

const OpponentName = styled.span`
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--primary-text-color);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    ${media.mobile} {
        font-size: 1.3rem;
    }
`;

const OpponentStat = styled.span`
    font-family: "Sono";
    font-size: 1.4rem;
    font-weight: 500;
    color: ${(props) => props.$color || "var(--primary-text-color)"};
    text-align: center;

    ${media.mobile} {
        font-size: 1.3rem;
    }
`;

const WinRate = styled.span`
    font-family: "Sono";
    font-size: 1.4rem;
    font-weight: 600;
    color: ${(props) =>
        props.$rate >= 50 ? "var(--color-green-600)" : "var(--color-red-600)"};
    text-align: center;

    ${media.mobile} {
        font-size: 1.3rem;
    }
`;

// Stat Cards Grid
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

const BigStatCard = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.8rem;
    padding: 2rem;
    background-color: var(--color-grey-50);
    border-radius: var(--border-radius-sm);
    text-align: center;

    ${media.mobile} {
        padding: 1.4rem;
    }
`;

const BigStatValue = styled.span`
    font-family: "Sono";
    font-size: 2.8rem;
    font-weight: 600;
    color: ${(props) => props.$color || "var(--primary-text-color)"};

    ${media.mobile} {
        font-size: 2.2rem;
    }
`;

const BigStatLabel = styled.span`
    font-size: 1.3rem;
    color: var(--color-grey-500);
    text-align: center;

    ${media.mobile} {
        font-size: 1.2rem;
    }
`;

function TeamStatistics({ teamId, team }) {
    const navigate = useNavigate();
    const { history, isLoading: isLoadingHistory } = useTeamMmrHistory(teamId);
    const { opponentStats, isLoading: isLoadingOpponents } =
        useTeamOpponentStats(teamId);

    const isLoading = isLoadingHistory || isLoadingOpponents;

    // Calculate statistics from history
    const stats = {
        highestMmr: Math.max(
            ...history.map((h) => h.mmr_after),
            team?.mmr || 1000
        ),
        lowestMmr: Math.min(
            ...history.map((h) => h.mmr_after),
            team?.mmr || 1000
        ),
        biggestWin: Math.max(...history.map((h) => h.mmr_change), 0),
        biggestLoss: Math.abs(Math.min(...history.map((h) => h.mmr_change), 0)),
        currentStreak: 0,
    };

    // Calculate current streak
    if (history.length > 0) {
        const firstChange = history[0]?.mmr_change || 0;
        if (firstChange !== 0) {
            const isWinStreak = firstChange > 0;
            let streak = 0;
            for (const h of history) {
                if (
                    (isWinStreak && h.mmr_change > 0) ||
                    (!isWinStreak && h.mmr_change < 0)
                ) {
                    streak++;
                } else {
                    break;
                }
            }
            stats.currentStreak = isWinStreak ? streak : -streak;
        }
    }

    // Prepare chart data (reverse for chronological order)
    const chartData = [...history].reverse().slice(-20);
    const mmrValues = chartData.map((h) => h.mmr_after);
    const minMmr = Math.min(...mmrValues, 800);
    const maxMmr = Math.max(...mmrValues, 1200);
    const mmrRange = maxMmr - minMmr || 100;

    const handleOpponentClick = (opponentTeamId) => {
        navigate(`/team/${opponentTeamId}`);
    };

    return (
        <StyledTeamStatistics>
            {/* MMR Chart */}
            <Card>
                <CardHeader>
                    <IconWrapper>
                        <HiOutlineChartBar />
                    </IconWrapper>
                    <HeaderContent>
                        <CardTitle>MMR Timeline</CardTitle>
                        <CardDescription>
                            Team rating progression over recent matches
                        </CardDescription>
                    </HeaderContent>
                </CardHeader>
                <CardBody>
                    {isLoading ? (
                        <LoadingContainer>
                            <SpinnerMini />
                        </LoadingContainer>
                    ) : history.length === 0 ? (
                        <EmptyState
                            icon="📈"
                            title="No history yet"
                            description="Play some team matches to see your MMR progression!"
                        />
                    ) : (
                        <>
                            <StatsRow>
                                <StatBox>
                                    <StatLabel>Current MMR</StatLabel>
                                    <StatValue $color={getMmrColor(team?.mmr)}>
                                        {team?.mmr || 1000}
                                    </StatValue>
                                </StatBox>
                                <StatBox>
                                    <StatLabel>Highest</StatLabel>
                                    <StatValue $color="var(--color-green-600)">
                                        {stats.highestMmr}
                                    </StatValue>
                                </StatBox>
                                <StatBox>
                                    <StatLabel>Lowest</StatLabel>
                                    <StatValue $color="var(--color-red-600)">
                                        {stats.lowestMmr}
                                    </StatValue>
                                </StatBox>
                                <StatBox>
                                    <StatLabel>Streak</StatLabel>
                                    <StatValue
                                        $color={
                                            stats.currentStreak > 0
                                                ? "var(--color-green-600)"
                                                : stats.currentStreak < 0
                                                ? "var(--color-red-600)"
                                                : "var(--primary-text-color)"
                                        }
                                    >
                                        {stats.currentStreak > 0
                                            ? `${stats.currentStreak}W`
                                            : stats.currentStreak < 0
                                            ? `${Math.abs(
                                                  stats.currentStreak
                                              )}L`
                                            : "-"}
                                    </StatValue>
                                </StatBox>
                            </StatsRow>

                            <ChartContainer>
                                <ChartCanvas>
                                    {chartData.map((h, idx) => (
                                        <ChartBar
                                            key={h.id || idx}
                                            $height={
                                                ((h.mmr_after - minMmr) /
                                                    mmrRange) *
                                                100
                                            }
                                            $color={getMmrColor(h.mmr_after)}
                                            title={`${h.mmr_after} MMR (${
                                                h.mmr_change > 0 ? "+" : ""
                                            }${h.mmr_change})`}
                                        />
                                    ))}
                                </ChartCanvas>
                                <ChartLegend>
                                    <span>Oldest</span>
                                    <span>
                                        Recent Matches ({chartData.length})
                                    </span>
                                    <span>Latest</span>
                                </ChartLegend>
                            </ChartContainer>
                        </>
                    )}
                </CardBody>
            </Card>

            {/* Quick Stats */}
            <Card>
                <CardHeader>
                    <IconWrapper>
                        <HiOutlineChartBar />
                    </IconWrapper>
                    <HeaderContent>
                        <CardTitle>Performance Stats</CardTitle>
                        <CardDescription>
                            Key team statistics and achievements
                        </CardDescription>
                    </HeaderContent>
                </CardHeader>
                <CardBody>
                    <StatsGrid>
                        <BigStatCard>
                            <BigStatValue>
                                {team?.wins + team?.losses || 0}
                            </BigStatValue>
                            <BigStatLabel>Total Matches</BigStatLabel>
                        </BigStatCard>
                        <BigStatCard>
                            <BigStatValue $color="var(--color-green-600)">
                                {team?.wins || 0}
                            </BigStatValue>
                            <BigStatLabel>Wins</BigStatLabel>
                        </BigStatCard>
                        <BigStatCard>
                            <BigStatValue $color="var(--color-red-600)">
                                {team?.losses || 0}
                            </BigStatValue>
                            <BigStatLabel>Losses</BigStatLabel>
                        </BigStatCard>
                        <BigStatCard>
                            <BigStatValue
                                $color={
                                    ((team?.wins || 0) /
                                        ((team?.wins || 0) +
                                            (team?.losses || 1))) *
                                        100 >=
                                    50
                                        ? "var(--color-green-600)"
                                        : "var(--color-red-600)"
                                }
                            >
                                {team?.wins + team?.losses > 0
                                    ? Math.round(
                                          (team.wins /
                                              (team.wins + team.losses)) *
                                              100
                                      )
                                    : 0}
                                %
                            </BigStatValue>
                            <BigStatLabel>Win Rate</BigStatLabel>
                        </BigStatCard>
                    </StatsGrid>
                    <div style={{ marginTop: "2rem" }}>
                        <StatsGrid>
                            <BigStatCard>
                                <BigStatValue $color="var(--color-green-600)">
                                    +{stats.biggestWin || 0}
                                </BigStatValue>
                                <BigStatLabel>Biggest Win</BigStatLabel>
                            </BigStatCard>
                            <BigStatCard>
                                <BigStatValue $color="var(--color-red-600)">
                                    -{stats.biggestLoss || 0}
                                </BigStatValue>
                                <BigStatLabel>Biggest Loss</BigStatLabel>
                            </BigStatCard>
                            <BigStatCard>
                                <BigStatValue $color="var(--color-green-600)">
                                    {stats.highestMmr || 1000}
                                </BigStatValue>
                                <BigStatLabel>Peak MMR</BigStatLabel>
                            </BigStatCard>
                            <BigStatCard>
                                <BigStatValue>
                                    {opponentStats?.length || 0}
                                </BigStatValue>
                                <BigStatLabel>Unique Opponents</BigStatLabel>
                            </BigStatCard>
                        </StatsGrid>
                    </div>
                </CardBody>
            </Card>

            {/* Opponent Stats */}
            <Card>
                <CardHeader>
                    <IconWrapper>
                        <HiOutlineUsers />
                    </IconWrapper>
                    <HeaderContent>
                        <CardTitle>Opponent Stats</CardTitle>
                        <CardDescription>
                            Head-to-head record against other teams
                        </CardDescription>
                    </HeaderContent>
                </CardHeader>
                <CardBody>
                    {isLoadingOpponents ? (
                        <LoadingContainer>
                            <SpinnerMini />
                        </LoadingContainer>
                    ) : !opponentStats || opponentStats.length === 0 ? (
                        <EmptyState
                            icon="⚔️"
                            title="No opponents yet"
                            description="Play against other teams to see your head-to-head stats!"
                        />
                    ) : (
                        <OpponentTable>
                            <OpponentHeader>
                                <OpponentHeaderText>Opponent</OpponentHeaderText>
                                <OpponentHeaderText
                                    style={{ textAlign: "center" }}
                                >
                                    Wins
                                </OpponentHeaderText>
                                <OpponentHeaderText
                                    style={{ textAlign: "center" }}
                                >
                                    Losses
                                </OpponentHeaderText>
                                <OpponentHeaderText
                                    style={{ textAlign: "center" }}
                                >
                                    Win Rate
                                </OpponentHeaderText>
                            </OpponentHeader>
                            {opponentStats.map((opponent) => {
                                const total = opponent.wins + opponent.losses;
                                const winRate =
                                    total > 0
                                        ? Math.round(
                                              (opponent.wins / total) * 100
                                          )
                                        : 0;
                                return (
                                    <OpponentRow
                                        key={opponent.teamId}
                                        onClick={() =>
                                            handleOpponentClick(opponent.teamId)
                                        }
                                    >
                                        <OpponentName>
                                            {opponent.teamName}
                                        </OpponentName>
                                        <OpponentStat $color="var(--color-green-600)">
                                            {opponent.wins}
                                        </OpponentStat>
                                        <OpponentStat $color="var(--color-red-600)">
                                            {opponent.losses}
                                        </OpponentStat>
                                        <WinRate $rate={winRate}>
                                            {winRate}%
                                        </WinRate>
                                    </OpponentRow>
                                );
                            })}
                        </OpponentTable>
                    )}
                </CardBody>
            </Card>
        </StyledTeamStatistics>
    );
}

export default TeamStatistics;
