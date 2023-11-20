import styled from "styled-components";
import MatchesFilterRow from "../matches/MatchesFilterRow";
import MatchesTable from "../matches/MatchesTable";
import { useMatchHistory } from "./useMatchHistory";
import LoadingSpinner from "../../ui/LoadingSpinner";

const StyledMatches = styled.div`
    display: flex;
    flex-direction: column;
`;

function ProfileMatches() {
    const { matches, count, isLoadingMatches } = useMatchHistory();

    return (
        <StyledMatches>
            <MatchesFilterRow />
            {isLoadingMatches ? (
                <LoadingSpinner />
            ) : (
                <MatchesTable historyMatches={matches} historyCount={count} />
            )}
        </StyledMatches>
    );
}

export default ProfileMatches;
