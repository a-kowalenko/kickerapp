import useWindowWidth from "../../hooks/useWindowWidth";
import LoadingSpinner from "../../ui/LoadingSpinner";
import Table from "../../ui/Table";
import { usePlayerSeasonStats } from "./usePlayerSeasonStats";
import { usePlayerTeamStats } from "./usePlayerTeamStats";
import { usePlaytime } from "./usePlaytime";
import { formatTimeInHoursAndMinutes } from "../../utils/helpers";

function StatsTable({ userId }) {
    const { stats, isLoading: isLoadingStats } = usePlayerSeasonStats(userId);
    const { teamStats, isLoading: isLoadingTeamStats } =
        usePlayerTeamStats(userId);
    const { data: playtimeData, isLoading: isLoadingPlaytime } = usePlaytime();
    const { isDesktop, isTablet, isMobile } = useWindowWidth();
    const columns = isDesktop
        ? "1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr"
        : isTablet
        ? "1.3fr 0.7fr 0.7fr 0.7fr 1fr 0.7fr 0.7fr 1fr"
        : "0.8fr 0.4fr 0.4fr 0.4fr 0.6fr 0.7fr 0.5fr 1fr";

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

    return (
        <Table columns={columns}>
            <Table.Header>
                <div>{isMobile ? "Mode" : "Gamemode"}</div>
                <div>{isMobile ? "W" : "Wins"}</div>
                <div>{isMobile ? "L" : "Losses"}</div>
                <div>{isMobile ? "T" : "Total"}</div>
                <div>{isMobile ? "Win%" : "Winrate"}</div>
                <div>MMR</div>
                <div>💰</div>
                <div>Playtime</div>
            </Table.Header>
            {isLoading ? (
                <LoadingSpinner />
            ) : (
                <Table.Body
                    noDataLabel="No stats available"
                    data={data}
                    render={(stats) => (
                        <StatsRow key={stats.gamemode} stats={stats} />
                    )}
                />
            )}
        </Table>
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
