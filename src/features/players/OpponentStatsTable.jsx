import LoadingSpinner from "../../ui/LoadingSpinner";
import Table from "../../ui/Table";
import OpponentStatsRow from "./OpponentStatsRow";
import { useOpponentStats } from "./useOpponentStats";

function OpponentStatsTable() {
    const { data, isLoading } = useOpponentStats();

    return (
        <Table columns="1fr 1fr 1fr 1fr 1fr 1fr 1fr">
            <Table.Header>
                <div>Opponent</div>
                <div>Wins</div>
                <div>Losses</div>
                <div>Total games</div>
                <div>Winrate</div>
                <div>Goals</div>
                <div>Own Goals</div>
            </Table.Header>
            {isLoading ? (
                <LoadingSpinner />
            ) : (
                <Table.Body
                    noDataLabel="No stats available"
                    data={data}
                    render={(stats) => (
                        <OpponentStatsRow key={stats.name} stats={stats} />
                    )}
                />
            )}
        </Table>
    );
}

export default OpponentStatsTable;
