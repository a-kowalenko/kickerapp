import styled from "styled-components";
import MatchesFilterRow from "../features/matches/MatchesFilterRow";
import MatchesTable from "../features/matches/MatchesTable";
import Heading from "../ui/Heading";

const StyledMatches = styled.div`
    display: flex;
    flex-direction: column;
`;

function Matches() {
    return (
        <StyledMatches>
            <Heading as="h1" type="page" hasBackBtn={true}>
                Matches
            </Heading>
            <MatchesFilterRow />
            <MatchesTable />
        </StyledMatches>
    );
}

export default Matches;
