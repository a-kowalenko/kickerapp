import ContentBox from "../../ui/ContentBox";
import Heading from "../../ui/Heading";
import MiniTable from "../../ui/MiniTable";
import Row from "../../ui/Row";
import LoadingSpinner from "../../ui/LoadingSpinner";
import MiniMatchRow from "./MiniMatchRow";
import { useRecentMatches } from "./useRecentMatches";
import styled from "styled-components";
import useWindowWidth from "../../hooks/useWindowWidth";

const StyledRecentMatches = styled(ContentBox)`
    grid-area: 3 / 1 / 4 / 5;

    @media (max-width: 1350px) {
        grid-area: 5 / 1 / 6 / 3;
    }
`;

function RecentMatches() {
    const { matches, isLoadingMatches } = useRecentMatches();
    const windowWidth = useWindowWidth();

    const columns =
        windowWidth > 1350
            ? "0.1fr 0.5fr 0.5fr 0.5fr 0.8fr 0.4fr"
            : windowWidth > 768
            ? "0.1fr 0.5fr 0.5fr 0.5fr 0.4fr"
            : "0.1fr 0.5fr 0.5fr 0.5fr";

    return (
        <StyledRecentMatches>
            <Row type="horizontal">
                <Heading as="h2">Recent matches</Heading>
            </Row>
            <MiniTable columns={columns}>
                <MiniTable.Header>
                    <div>Id</div>
                    <div style={{ textAlign: "right" }}>Team 1</div>
                    <div style={{ textAlign: "center" }}>Score</div>
                    <div>Team 2</div>
                    {windowWidth > 1350 && <div>Start Time</div>}
                    {windowWidth > 768 && <div>Duration</div>}
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
        </StyledRecentMatches>
    );
}

export default RecentMatches;
