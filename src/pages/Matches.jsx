import MatchesTable from "../features/matches/MatchesTable";
import { useMatches } from "../features/matches/useMatches";
import Spinner from "../ui/Spinner";

function Matches() {
    const { matches, count, isLoadingMatches, errorMatches } = useMatches();

    if (isLoadingMatches) {
        return <Spinner />;
    }

    return (
        <>
            <MatchesTable matches={matches} count={count} />
        </>
    );
}

export default Matches;
