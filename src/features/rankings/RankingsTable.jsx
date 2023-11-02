import { useSearchParams } from "react-router-dom";
import Pagination from "../../ui/Pagination";
import Spinner from "../../ui/Spinner";
import Table from "../../ui/Table";
import RankingsRow from "./RankingsRow";
import { useRankings } from "./useRankings";

function RankingsTable() {
    const { rankings, count, isLoadingRankings } = useRankings();
    const [searchParams] = useSearchParams();
    const gamemode = searchParams.get("gamemode")
        ? searchParams.get("gamemode")
        : "1on1";

    if (isLoadingRankings) {
        <Spinner />;
    }

    return (
        <Table columns="0.5fr 1fr 1fr 1fr 1fr 1fr 1fr">
            <Table.Header>
                <div>Rank</div>
                <div>Player</div>
                <div style={{ textAlign: "center" }}>Wins</div>
                <div style={{ textAlign: "center" }}>Losses</div>
                <div style={{ textAlign: "center" }}>Total</div>
                <div style={{ textAlign: "center" }}>Winrate</div>
                <div style={{ textAlign: "center" }}>MMR</div>
            </Table.Header>
            <Table.Body
                noDataLabel="No rankings available"
                data={rankings}
                render={(player) => (
                    <RankingsRow
                        key={player.id}
                        player={player}
                        gamemode={gamemode}
                    />
                )}
            />
            <Table.Footer>
                <Pagination numEntries={count} />
            </Table.Footer>
        </Table>
    );
}

export default RankingsTable;
