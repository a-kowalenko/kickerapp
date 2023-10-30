import Pagination from "../../ui/Pagination";
import Spinner from "../../ui/Spinner";
import Table from "../../ui/Table";
import DisgraceRow from "./DisgraceRow";
import { useDisgraces } from "./useDisgraces";

function DisgraceTable() {
    const { disgraces, isLoading, count, error } = useDisgraces();

    if (isLoading) {
        return <Spinner />;
    }

    return (
        <Table columns="0.5fr 1fr 1fr">
            <Table.Header>
                <div>Player</div>
                <div>Geschändet von</div>
                <div>Datum</div>
            </Table.Header>
            <Table.Body
                noDataLabel="Bisher noch niemand geschändet"
                data={disgraces}
                render={(disgrace) => (
                    <DisgraceRow disgrace={disgrace} key={disgrace.id} />
                )}
            />
            <Table.Footer>
                <Pagination numEntries={count} />
            </Table.Footer>
        </Table>
    );
}

export default DisgraceTable;
