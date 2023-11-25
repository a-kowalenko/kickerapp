import styled from "styled-components";
import MatchDetail from "../features/matches/MatchDetail";
import Heading from "../ui/Heading";
import { useParams } from "react-router-dom";

const StyledMatch = styled.div`
    display: flex;
    flex-direction: column;
    height: 100%;
    padding-bottom: 2rem;
`;

function Match() {
    const { matchId } = useParams();
    return (
        <StyledMatch>
            <Heading as="h1" type="page" hasBackBtn={true} backDirection={-1}>
                Match {matchId}
            </Heading>
            <MatchDetail />
        </StyledMatch>
    );
}

export default Match;
