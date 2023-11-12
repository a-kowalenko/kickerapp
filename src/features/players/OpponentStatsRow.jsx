import PlayerName from "../../ui/PlayerName";
import Table from "../../ui/Table";

function OpponentStatsRow({ stats }) {
    const { name, wins, losses, total, winrate } = stats;

    return (
        <Table.Row>
            <PlayerName to={`/user/${name}/profile`}>
                <span>{name}</span>
            </PlayerName>
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
                <span>{(winrate * 100).toFixed(1)}</span>%
            </div>
        </Table.Row>
    );
}

export default OpponentStatsRow;
