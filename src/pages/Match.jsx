import styled from "styled-components";
import MatchDetail from "../features/matches/MatchDetail";
import Heading from "../ui/Heading";
import { useMatch } from "../features/matches/useMatch";

const StyledMatch = styled.div`
    display: flex;
    flex-direction: column;
    height: 100%;
    padding-bottom: 2rem;
`;

function Match() {
    const { match } = useMatch();
    return (
        <StyledMatch>
            <Heading as="h1" type="page" hasBackBtn={true} backDirection={-1}>
                Match {match?.nr}
            </Heading>
            <MatchDetail />
        </StyledMatch>
    );
}

export default Match;
