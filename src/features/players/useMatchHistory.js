import { useQuery } from "react-query";
import { getMatches } from "../../services/apiMatches";

export function useMatchHistory(name) {
    const {
        data: { data: matches, count } = {},
        isLoading: isLoadingMatches,
        error,
    } = useQuery({
        queryKey: ["matchHistory", name],
        queryFn: () => getMatches({ name }),
        enabled: !!name,
    });

    return { matches, isLoadingMatches, count, error };
}
