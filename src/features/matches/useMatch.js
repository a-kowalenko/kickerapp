import { useQuery } from "react-query";
import { useParams } from "react-router-dom";
import { getMatch } from "../../services/apiMatches";

export function useMatch(id) {
    const { matchId } = useParams();

    if (matchId) {
        id = matchId;
    }

    const {
        data: match,
        isLoading,
        error,
    } = useQuery({
        queryKey: ["match", Number(id)],
        queryFn: () => getMatch(id),
    });

    return { match, isLoading, error };
}
