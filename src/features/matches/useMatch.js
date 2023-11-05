import { useQuery } from "react-query";
import { useParams } from "react-router-dom";
import { getMatch } from "../../services/apiMatches";
import { ACTIVE_MATCH_REFETCH_INTERVAL } from "../../utils/constants";

export function useMatch(id) {
    const { matchId } = useParams();
    const effectiveId = matchId || id;

    const {
        data: match,
        isLoading,
        error,
    } = useQuery({
        queryKey: ["match", Number(effectiveId)],
        queryFn: () => getMatch(effectiveId),
        refetchInterval: (match) =>
            match?.status === "active" ? ACTIVE_MATCH_REFETCH_INTERVAL : false,
        refetchIntervalInBackground: true,
    });

    return { match, isLoading, error };
}
