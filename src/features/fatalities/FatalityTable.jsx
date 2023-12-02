import useWindowWidth from "../../hooks/useWindowWidth";
import LoadingSpinner from "../../ui/LoadingSpinner";
import Pagination from "../../ui/Pagination";
import Table from "../../ui/Table";
import FatalityRow from "./FatalityRow";
import { useFatalities } from "./useFatalities";

function FatalityTable() {
    const { fatalities, isLoading, count } = useFatalities();

    const { isTablet, isDesktop } = useWindowWidth();

    const columns = isDesktop
        ? "0.5fr 1fr 1fr"
        : isTablet
        ? "1fr 1fr 1fr"
        : "1fr 1fr 1fr";

    return (
        <Table columns={columns}>
            <Table.Header>
                <div>Victim</div>
                <div>Finisher</div>
                <div>Date</div>
            </Table.Header>

            {isLoading ? (
                <LoadingSpinner />
            ) : (
                <Table.Body
                    noDataLabel="No fatalities available"
                    data={fatalities}
                    render={(fatality) => (
                        <FatalityRow fatality={fatality} key={fatality.id} />
                    )}
                />
            )}
            <Table.Footer>
                <Pagination numEntries={count} />
            </Table.Footer>
        </Table>
    );
}

export default FatalityTable;
