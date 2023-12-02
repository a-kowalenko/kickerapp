import styled from "styled-components";
import FatalityTable from "../features/fatalities/FatalityTable";
import Heading from "../ui/Heading";
import MatchesFilterRow from "../features/matches/MatchesFilterRow";

const StyledFatality = styled.div`
    display: flex;
    flex-direction: column;
`;

function Fatality() {
    return (
        <StyledFatality>
            <Heading as="h1" type="page" hasBackBtn={true}>
                Fatalities
            </Heading>
            <MatchesFilterRow />
            <FatalityTable />
        </StyledFatality>
    );
}

export default Fatality;
