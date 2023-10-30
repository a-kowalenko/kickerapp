import ContentBox from "../../ui/ContentBox";
import Heading from "../../ui/Heading";
import MiniTable from "../../ui/MiniTable";
import Row from "../../ui/Row";
import LoadingSpinner from "../../ui/LoadingSpinner";
import MiniMatchRow from "./MiniMatchRow";
import { useRecentMatches } from "./useRecentMatches";

function RecentMatches() {
    const { matches, isLoadingMatches } = useRecentMatches();

    return (
        <ContentBox>
            <Row type="horizontal">
                <Heading as="h2">Recent matches</Heading>
            </Row>
            <MiniTable columns="0.1fr 0.5fr 0.5fr 0.5fr 0.8fr 0.4fr">
                <MiniTable.Header>
                    <div>Id</div>
                    <div style={{ textAlign: "right" }}>Team 1</div>
                    <div style={{ textAlign: "center" }}>Score</div>
                    <div>Team 2</div>
                    <div>Start Time</div>
                    <div>Duration</div>
                </MiniTable.Header>
                {isLoadingMatches ? (
                    <LoadingSpinner />
                ) : (
                    <MiniTable.Body
                        noDataLabel="No matches available"
                        data={matches}
                        render={(match) => (
                            <MiniMatchRow match={match} key={match.id} />
                        )}
                    />
                )}
            </MiniTable>
        </ContentBox>
    );
}

export default RecentMatches;
