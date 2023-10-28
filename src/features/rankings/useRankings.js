import { useQuery } from "react-query";
import { getRankings } from "../../services/apiRankings";

export function useRankings() {
    const {
        data: { data: rankings, count } = {},
        isLoading: isLoadingRankings,
        errorRankings,
    } = useQuery({
        queryKey: ["rankings"],
        queryFn: getRankings,
    });

    return { rankings, count, isLoadingRankings, errorRankings };
}
