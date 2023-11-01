import Spinner from "../../ui/Spinner";
import MatchesTable from "../matches/MatchesTable";
import { useMatchHistory } from "./useMatchHistory";

function ProfileMatches({ username }) {
    const { matches, count, isLoadingMatches } = useMatchHistory(username);
    if (isLoadingMatches) {
        return <Spinner />;
    }

    return (
        <>
            <MatchesTable matches={matches} count={count} />
        </>
    );
}

export default ProfileMatches;
