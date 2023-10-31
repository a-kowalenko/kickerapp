import { useQuery } from "react-query";
import { getMatches } from "../../services/apiMatches";

export function useRecentMatches() {
    const firstPage = 1;

    const {
        data: { data: matches } = {},
        isLoading: isLoadingMatches,
        errorMatches,
    } = useQuery({
        queryKey: ["matches", firstPage],
        queryFn: () => getMatches({ currentPage: firstPage }),
    });

    return { matches, isLoadingMatches };
}
