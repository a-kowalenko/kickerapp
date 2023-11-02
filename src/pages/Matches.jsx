import styled from "styled-components";
import MatchesFilterRow from "../features/matches/MatchesFilterRow";
import MatchesTable from "../features/matches/MatchesTable";
import { useMatches } from "../features/matches/useMatches";

import Spinner from "../ui/Spinner";
import Heading from "../ui/Heading";

const StyledMatches = styled.div`
    display: flex;
    flex-direction: column;
`;

function Matches() {
    const { matches, count, isLoadingMatches, errorMatches } = useMatches();

    if (isLoadingMatches) {
        return <Spinner />;
    }

    return (
        <StyledMatches>
            <Heading as="h1" type="page">
                Matches
            </Heading>
            <MatchesFilterRow />
            <MatchesTable matches={matches} count={count} />
        </StyledMatches>
    );
}

export default Matches;
