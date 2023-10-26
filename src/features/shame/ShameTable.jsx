import Pagination from "../../ui/Pagination";
import Table from "../../ui/Table";
import ShameRow from "./ShameRow";

const fakeData = [
    { id: 1, player: "Sergej", shamedBy: "Andy", date: new Date() },
    { id: 2, player: "Frank", shamedBy: "Andy", date: new Date() },
    { id: 3, player: "Maxim", shamedBy: "Andy", date: new Date() },
    { id: 4, player: "Alex", shamedBy: "Andy", date: new Date() },
    { id: 5, player: "Jeshua", shamedBy: "Andy", date: new Date() },
    { id: 6, player: "Jeshua", shamedBy: "Andy", date: new Date() },
    { id: 7, player: "Jeshua", shamedBy: "Andy", date: new Date() },
    { id: 8, player: "Jeshua", shamedBy: "Andy", date: new Date() },
    { id: 9, player: "Jeshua", shamedBy: "Andy", date: new Date() },
    { id: 10, player: "Jeshua", shamedBy: "Andy", date: new Date() },
    { id: 11, player: "Jeshua", shamedBy: "Andy", date: new Date() },
    { id: 12, player: "Jeshua", shamedBy: "Andy", date: new Date() },
];

function ShameTable() {
    const numShames = fakeData.length; // TODO: Get numShames from custom hook. React Query returns count value
    return (
        <Table columns="0.5fr 1fr 1fr">
            <Table.Header>
                <div>Player</div>
                <div>Geschändet von</div>
                <div>Datum</div>
            </Table.Header>
            <Table.Body
                data={fakeData}
                render={(shame) => <ShameRow shame={shame} key={shame.id} />}
            />
            <Table.Footer>
                <Pagination numEntries={numShames} />
            </Table.Footer>
        </Table>
    );
}

export default ShameTable;
