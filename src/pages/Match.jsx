import styled from "styled-components";
import MatchDetail from "../features/matches/MatchDetail";

const StyledMatch = styled.div`
    display: flex;
    flex-direction: column;
    height: 100%;
    padding-bottom: 2rem;
`;

function Match() {
    return (
        <StyledMatch>
            <MatchDetail />
        </StyledMatch>
    );
}

export default Match;
