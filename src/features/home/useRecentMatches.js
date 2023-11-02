import { useQuery } from "react-query";
import { getMatches } from "../../services/apiMatches";
import { MATCHES } from "../../utils/constants";

export function useRecentMatches() {
    const firstPage = 1;

    const {
        data: { data: matches } = {},
        isLoading: isLoadingMatches,
        errorMatches,
    } = useQuery({
        queryKey: [MATCHES, firstPage],
        queryFn: () => getMatches({ currentPage: firstPage }),
    });

    return { matches, isLoadingMatches };
}
