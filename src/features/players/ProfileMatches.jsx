import styled from "styled-components";
import Spinner from "../../ui/Spinner";
import MatchesFilterRow from "../matches/MatchesFilterRow";
import MatchesTable from "../matches/MatchesTable";
import { useMatchHistory } from "./useMatchHistory";

const StyledMatches = styled.div`
    display: flex;
    flex-direction: column;
`;

function ProfileMatches() {
    const { matches, count, isLoadingMatches } = useMatchHistory();
    if (isLoadingMatches) {
        return <Spinner />;
    }

    return (
        <StyledMatches>
            <MatchesFilterRow />
            <MatchesTable matches={matches} count={count} />
        </StyledMatches>
    );
}

export default ProfileMatches;
