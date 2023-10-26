import Pagination from "../../ui/Pagination";
import Table from "../../ui/Table";
import RankingsRow from "./RankingsRow";

const fakeData = [
    { id: 1, name: "Andy", wins: 15, losses: 1, rank: 1 },
    { id: 2, name: "Maxim", wins: 10, losses: 4, rank: 2 },
    { id: 3, name: "Alex", wins: 5, losses: 5, rank: 3 },
    { id: 4, name: "Sergej", wins: 4, losses: 7, rank: 4 },
];

function RankingsTable() {
    const numEntries = fakeData.length; // TODO: Get numShames from custom hook. React Query returns count value
    return (
        <Table columns="0.5fr 1fr 1fr 1fr 1fr 1fr">
            <Table.Header>
                <div style={{ textAlign: "center" }}>Rank</div>
                <div>Player</div>
                <div style={{ textAlign: "center" }}>Wins</div>
                <div style={{ textAlign: "center" }}>Losses</div>
                <div style={{ textAlign: "center" }}>Total</div>
                <div style={{ textAlign: "center" }}>Winrate</div>
            </Table.Header>
            <Table.Body
                data={fakeData}
                render={(player) => (
                    <RankingsRow key={player.id} player={player} />
                )}
            />
            <Table.Footer>
                <Pagination numEntries={numEntries} />
            </Table.Footer>
        </Table>
    );
}

export default RankingsTable;
