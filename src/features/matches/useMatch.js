import { useQuery } from "react-query";
import { useParams } from "react-router-dom";
import { getMatch } from "../../services/apiMatches";

export function useMatch() {
    const { matchId } = useParams();

    console.log(matchId);

    const {
        data: match,
        isLoading,
        error,
    } = useQuery({
        queryKey: ["match", matchId],
        queryFn: () => getMatch(matchId),
    });

    return { match, isLoading, error };
}
