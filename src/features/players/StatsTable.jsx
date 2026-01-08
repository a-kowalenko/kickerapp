import styled from "styled-components";
import useWindowWidth from "../../hooks/useWindowWidth";
import LoadingSpinner from "../../ui/LoadingSpinner";
import Table from "../../ui/Table";
import { usePlayerSeasonStats } from "./usePlayerSeasonStats";
import { usePlayerTeamStats } from "./usePlayerTeamStats";
import { usePlaytime } from "./usePlaytime";
import { formatTimeInHoursAndMinutes } from "../../utils/helpers";

const MobileStatsContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 1.2rem;
`;

const StatCard = styled.div`
    background-color: var(--color-grey-0);
    border: 1px solid var(--secondary-border-color);
    border-radius: var(--border-radius-md);
    overflow: hidden;

    ${(props) =>
        props.$isOverall &&
        `
        background-color: var(--color-grey-50);
        border-color: var(--color-grey-300);
    `}
`;

const CardHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.2rem;
    background-color: var(--tertiary-background-color);
    border-bottom: 1px solid var(--secondary-border-color);

    ${(props) =>
        props.$isOverall &&
        `
        background-color: var(--color-grey-100);
    `}
`;

const GamemodeLabel = styled.span`
    font-weight: 600;
    font-size: 1.4rem;
    color: var(--color-grey-700);
`;

const MmrBadge = styled.span`
    font-size: 1.3rem;
    color: var(--color-grey-600);
    background-color: var(--color-grey-100);
    padding: 0.2rem 0.8rem;
    border-radius: var(--border-radius-sm);
`;

const CardBody = styled.div`
    padding: 1.2rem;
`;

const StatsGrid = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
`;

const StatItem = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
`;

const StatLabel = styled.span`
    font-size: 1.1rem;
    color: var(--color-grey-500);
    text-transform: uppercase;
    letter-spacing: 0.5px;
`;

const StatValue = styled.span`
    font-size: 1.4rem;
    font-weight: 500;
    color: var(--color-grey-700);

    ${(props) =>
        props.$highlight &&
        `
        font-size: 1.6rem;
        font-weight: 600;
    `}
`;

const WinLossRow = styled.div`
    display: flex;
    align-items: center;
    gap: 0.6rem;
`;

const WinValue = styled.span`
    color: var(--color-green-700);
    font-weight: 500;
`;

const LossValue = styled.span`
    color: var(--color-red-700);
    font-weight: 500;
`;

function StatsTable({ userId }) {
    const { stats, isLoading: isLoadingStats } = usePlayerSeasonStats(userId);
    const { teamStats, isLoading: isLoadingTeamStats } =
        usePlayerTeamStats(userId);
    const { data: playtimeData, isLoading: isLoadingPlaytime } = usePlaytime();
    const { isDesktop, isMobile } = useWindowWidth();
    const columns = isDesktop
        ? "1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr"
        : "1.3fr 0.7fr 0.7fr 0.7fr 1fr 0.7fr 0.7fr 1fr";

    const isLoading = isLoadingPlaytime || isLoadingStats || isLoadingTeamStats;

    let data;

    if (!isLoading && stats) {
        const {
            wins,
            losses,
            mmr,
            wins2on2,
            losses2on2,
            mmr2on2,
            bounty_claimed,
            bounty_claimed_2on2,
        } = stats;
        const { playtimeSolo, playtimeDuo, playtimeTeam, playtimeOverall } =
            playtimeData || {
                playtimeSolo: 0,
                playtimeDuo: 0,
                playtimeTeam: 0,
                playtimeOverall: 0,
            };

        const stats1on1 = {
            gamemode: "1on1",
            wins,
            losses,
            total: wins + losses,
            mmr,
            bounty: bounty_claimed || 0,
            playtime: playtimeSolo,
        };
        const stats2on2 = {
            gamemode: "2on2",
            wins: wins2on2,
            losses: losses2on2,
            total: wins2on2 + losses2on2,
            mmr: mmr2on2,
            bounty: bounty_claimed_2on2 || 0,
            playtime: playtimeDuo,
        };

        // Team stats (aggregated across all player's teams)
        const winsTeam = teamStats?.wins || 0;
        const lossesTeam = teamStats?.losses || 0;
        const statsTeam = {
            gamemode: "Team",
            wins: winsTeam,
            losses: lossesTeam,
            total: winsTeam + lossesTeam,
            mmr: null, // No MMR for aggregated team stats
            bounty: teamStats?.bounty_claimed || 0,
            playtime: playtimeTeam || 0,
        };

        const statsOverall = {
            gamemode: "Overall",
            wins: wins + wins2on2 + winsTeam,
            losses: losses + losses2on2 + lossesTeam,
            total:
                wins + wins2on2 + losses + losses2on2 + winsTeam + lossesTeam,
            mmr: null,
            bounty:
                (bounty_claimed || 0) +
                (bounty_claimed_2on2 || 0) +
                (teamStats?.bounty_claimed || 0),
            playtime: playtimeOverall,
        };

        data = [stats1on1, stats2on2, statsTeam, statsOverall];
    }

    if (isLoading) {
        return <LoadingSpinner />;
    }

    // Filter: Only show gamemodes with at least 1 match (except Overall which is always shown if there's any data)
    const filteredData = data?.filter(
        (stats) => stats.gamemode === "Overall" || stats.total > 0
    );

    // Mobile: Card-based layout
    if (isMobile) {
        return (
            <MobileStatsContainer>
                {filteredData?.map((stats) => (
                    <MobileStatCard key={stats.gamemode} stats={stats} />
                ))}
            </MobileStatsContainer>
        );
    }

    // Desktop/Tablet: Table layout
    return (
        <Table columns={columns}>
            <Table.Header>
                <div>Gamemode</div>
                <div>Wins</div>
                <div>Losses</div>
                <div>Total</div>
                <div>Winrate</div>
                <div>MMR</div>
                <div>💰</div>
                <div>Playtime</div>
            </Table.Header>
            <Table.Body
                noDataLabel="No stats available"
                data={filteredData}
                render={(stats) => (
                    <StatsRow key={stats.gamemode} stats={stats} />
                )}
            />
        </Table>
    );
}

function MobileStatCard({ stats }) {
    const { gamemode, wins, losses, mmr, bounty, playtime } = stats;
    const winrate = wins > 0 ? ((wins / (wins + losses)) * 100).toFixed(1) : 0;
    const isOverall = gamemode === "Overall";

    return (
        <StatCard $isOverall={isOverall}>
            <CardHeader $isOverall={isOverall}>
                <GamemodeLabel>{gamemode}</GamemodeLabel>
                {mmr !== null && <MmrBadge>MMR: {mmr}</MmrBadge>}
            </CardHeader>
            <CardBody>
                <StatsGrid>
                    <StatItem>
                        <StatLabel>Record</StatLabel>
                        <WinLossRow>
                            <WinValue>{wins}W</WinValue>
                            <span>-</span>
                            <LossValue>{losses}L</LossValue>
                        </WinLossRow>
                    </StatItem>
                    <StatItem>
                        <StatLabel>Winrate</StatLabel>
                        <StatValue $highlight>{winrate}%</StatValue>
                    </StatItem>
                    <StatItem>
                        <StatLabel>💰 Bounty</StatLabel>
                        <StatValue>{bounty}</StatValue>
                    </StatItem>
                    <StatItem>
                        <StatLabel>⏱ Playtime</StatLabel>
                        <StatValue>
                            {formatTimeInHoursAndMinutes(playtime)}
                        </StatValue>
                    </StatItem>
                </StatsGrid>
            </CardBody>
        </StatCard>
    );
}

function StatsRow({ stats }) {
    const { gamemode, wins, losses, total, mmr, bounty, playtime } = stats;
    const winrate = wins > 0 ? ((wins / (wins + losses)) * 100).toFixed(1) : 0;

    return (
        <Table.Row>
            <div>
                <span>{gamemode}</span>
            </div>
            <div>
                <span>{wins}</span>
            </div>
            <div>
                <span>{losses}</span>
            </div>
            <div>
                <span>{total}</span>
            </div>
            <div>
                <span>{winrate}</span>%
            </div>
            <div>
                <span>{mmr !== null ? mmr : "-"}</span>
            </div>
            <div>
                <span>{bounty}</span>
            </div>
            <div>
                <span>{formatTimeInHoursAndMinutes(playtime)}</span>
            </div>
        </Table.Row>
    );
}

export default StatsTable;
