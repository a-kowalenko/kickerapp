import styled from "styled-components";
import DisgraceTable from "../features/disgraces/DisgraceTable";
import Heading from "../ui/Heading";
import MatchesFilterRow from "../features/matches/MatchesFilterRow";

const StyledDisgrace = styled.div`
    display: flex;
    flex-direction: column;
`;

function Disgrace() {
    return (
        <StyledDisgrace>
            <Heading as="h1" type="page" hasBackBtn={true}>
                Disgraces
            </Heading>
            <MatchesFilterRow />
            <DisgraceTable />
        </StyledDisgrace>
    );
}

export default Disgrace;
