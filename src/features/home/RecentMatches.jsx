import ContentBox from "../../ui/ContentBox";
import Heading from "../../ui/Heading";
import MiniTable from "../../ui/MiniTable";
import Row from "../../ui/Row";
import LoadingSpinner from "../../ui/LoadingSpinner";
import MiniMatchRow from "./MiniMatchRow";
import { useRecentMatches } from "./useRecentMatches";
import styled from "styled-components";
import useWindowWidth from "../../hooks/useWindowWidth";
import { media } from "../../utils/constants";

const StyledRecentMatches = styled(ContentBox)`
    grid-area: 3 / 1 / 4 / 5;

    @media (max-width: 1350px) {
        grid-area: 5 / 1 / 6 / 3;
    }
`;

function RecentMatches() {
    const { matches, isLoadingMatches } = useRecentMatches();
    const windowWidth = useWindowWidth();
    const showStartTime = windowWidth > 1350;
    const showDuration = windowWidth > 768;
    const showId = windowWidth > 650;
    const isMobile = windowWidth <= media.maxMobile;

    const columns = showStartTime
        ? "0.1fr 0.5fr 0.5fr 0.5fr 0.8fr 0.4fr"
        : showDuration
        ? "0.1fr 0.5fr 0.5fr 0.5fr 0.4fr"
        : showId
        ? "0.1fr 0.5fr 0.5fr 0.5fr"
        : isMobile
        ? "0.5fr 0.3fr 0.5fr"
        : "0.5fr 0.5fr 0.5fr";

    return (
        <StyledRecentMatches>
            <Row type="horizontal">
                <Heading as="h2">Recent matches</Heading>
            </Row>
            <MiniTable columns={columns}>
                <MiniTable.Header>
                    {showId && <div>Id</div>}
                    <div style={{ textAlign: isMobile ? "center" : "right" }}>
                        Team 1
                    </div>
                    <div style={{ textAlign: "center" }}>Score</div>
                    <div style={{ textAlign: isMobile ? "center" : "" }}>
                        Team 2
                    </div>
                    {showStartTime && <div>Start Time</div>}
                    {showDuration && <div>Duration</div>}
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
