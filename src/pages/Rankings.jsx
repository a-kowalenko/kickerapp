import styled from "styled-components";
import RankingsTable from "../features/rankings/RankingsTable";
import Heading from "../ui/Heading";
import RankingsFilterRow from "../features/rankings/RankingsFilterRow";

const StyledRankings = styled.div`
    display: flex;
    flex-direction: column;
`;

function Rankings() {
    return (
        <StyledRankings>
            <Heading as="h1" type="page" hasBackBtn={true}>
                Rankings
            </Heading>
            <RankingsFilterRow />
            <RankingsTable />
        </StyledRankings>
    );
}

export default Rankings;
