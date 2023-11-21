import { useQuery } from "react-query";
import { useParams } from "react-router-dom";
import { getMatch } from "../../services/apiMatches";
import { useKicker } from "../../contexts/KickerContext";

export function useMatch(id) {
    const { matchId } = useParams();
    const effectiveId = matchId || id;
    const { currentKicker: kicker } = useKicker();

    const {
        data: match,
        isLoading,
        error,
    } = useQuery({
        queryKey: ["match", Number(effectiveId), kicker],
        queryFn: () => getMatch({ matchId: effectiveId, kicker }),
    });

    return { match, isLoading, error };
}
