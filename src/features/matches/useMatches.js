import { useQuery } from "react-query";
import { getMatches as getMatchesApi } from "../../services/apiMatches";

export function useMatches() {
    const {
        data: { data: matches, count } = {},
        isLoading: isLoadingMatches,
        errorMatches,
    } = useQuery({
        queryKey: ["matches"],
        queryFn: getMatchesApi,
    });

    return { matches, count, isLoadingMatches, errorMatches };
}
