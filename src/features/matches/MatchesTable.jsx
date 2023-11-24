import useWindowWidth from "../../hooks/useWindowWidth";
import LoadingSpinner from "../../ui/LoadingSpinner";
import Pagination from "../../ui/Pagination";
import Table from "../../ui/Table";
import MatchesRow from "./MatchesRow";
import { useMatches } from "./useMatches";

function MatchesTable({ historyMatches, historyCount }) {
    const { matches, count, isLoadingMatches } = useMatches();

    const finalMatches = historyMatches ? historyMatches : matches;
    const finalCount = historyCount ? historyCount : count;

    const { isDesktop, isMobile } = useWindowWidth();

    const columns = isDesktop
        ? "0.1fr 1fr 0.4fr 1fr 0.5fr 0.5fr 0.3fr"
        : "0.1fr 1fr 0.5fr 1fr";

    return (
        <Table columns={columns}>
            <Table.Header>
                <div>Id</div>
                <div style={{ textAlign: isMobile ? "center" : "right" }}>
                    Team 1
                </div>
                <div style={{ textAlign: "center" }}>Score</div>
                <div style={{ textAlign: isMobile ? "center" : "" }}>
                    Team 2
                </div>
                {isDesktop && (
                    <div style={{ textAlign: "center" }}>Game Mode</div>
                )}
                {isDesktop && (
                    <div style={{ textAlign: "center" }}>Start Time</div>
                )}
                {isDesktop && <div>Duration</div>}
            </Table.Header>
            {isLoadingMatches ? (
                <LoadingSpinner />
            ) : (
                <Table.Body
                    noDataLabel="No matches available"
                    data={finalMatches}
                    render={(match) => (
                        <MatchesRow key={match.id} match={match} />
                    )}
                />
            )}
            <Table.Footer>
                <Pagination numEntries={finalCount} />
            </Table.Footer>
        </Table>
    );
}

export default MatchesTable;
