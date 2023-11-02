import { useQuery, useQueryClient } from "react-query";
import { getMatches as getMatchesApi } from "../../services/apiMatches";
import { useSearchParams } from "react-router-dom";
import { MATCHES, PAGE_SIZE } from "../../utils/constants";

export function useMatches() {
    const [searchParams] = useSearchParams();
    const queryClient = useQueryClient();

    // Pagination
    const currentPage = searchParams.get("page")
        ? Number(searchParams.get("page"))
        : 1;

    // Get current page data
    const {
        data: { data: matches, count } = {},
        isLoading: isLoadingMatches,
        errorMatches,
    } = useQuery({
        queryKey: [MATCHES, currentPage],
        queryFn: () => getMatchesApi({ currentPage }),
    });

    // Prefetch next page
    const pageCount = Math.ceil(count / PAGE_SIZE);

    if (currentPage < pageCount) {
        queryClient.prefetchQuery({
            queryKey: [MATCHES, currentPage + 1],
            queryFn: () => getMatchesApi({ currentPage: currentPage + 1 }),
        });
    }

    if (currentPage > 1) {
        queryClient.prefetchQuery({
            queryKey: [MATCHES, currentPage - 1],
            queryFn: () => getMatchesApi({ currentPage: currentPage - 1 }),
        });
    }

    return { matches, count, isLoadingMatches, errorMatches };
}
