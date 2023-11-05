import Table from "../../ui/Table";

function StatsTable({ player }) {
    const { wins, losses, mmr, wins2on2, losses2on2, mmr2on2 } = player;
    const stats1on1 = { gamemode: "1on1", wins, losses, mmr };
    const stats2on2 = {
        gamemode: "2on2",
        wins: wins2on2,
        losses: losses2on2,
        mmr: mmr2on2,
    };
    const statsOverall = {
        gamemode: "Overall",
        wins: wins + wins2on2,
        losses: losses + losses2on2,
        mmr: null,
    };
    const data = [stats1on1, stats2on2, statsOverall];

    return (
        <Table columns="1fr 1fr 1fr 1fr 1fr">
            <Table.Header>
                <div>Gamemode</div>
                <div>Wins</div>
                <div>Losses</div>
                <div>Winrate</div>
                <div>MMR</div>
            </Table.Header>
            <Table.Body
                noDataLabel="No stats available"
                data={data}
                render={(stats) => (
                    <StatsRow key={stats.gamemode} stats={stats} />
                )}
            />
        </Table>
    );
}

function StatsRow({ stats }) {
    const { gamemode, wins, losses, mmr } = stats;
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
                <span>{winrate}</span>%
            </div>
            <div>
                <span>{mmr}</span>
            </div>
        </Table.Row>
    );
}

export default StatsTable;
