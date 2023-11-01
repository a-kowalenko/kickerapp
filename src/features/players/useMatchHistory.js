import { useQuery, useQueryClient } from "react-query";
import { getMatches } from "../../services/apiMatches";
import { useSearchParams } from "react-router-dom";
import { PAGE_SIZE } from "../../utils/constants";

export function useMatchHistory(name) {
    const [searchParams] = useSearchParams();
    const queryClient = useQueryClient();

    const currentPage = searchParams.get("page")
        ? Number(searchParams.get("page"))
        : 1;

    const {
        data: { data: matches, count } = {},
        isLoading: isLoadingMatches,
        error,
    } = useQuery({
        queryKey: ["matchHistory", name, currentPage],
        queryFn: () => getMatches({ filter: { name }, currentPage }),
        enabled: !!name,
    });

    const pageCount = Math.ceil(count / PAGE_SIZE);

    if (currentPage < pageCount) {
        queryClient.prefetchQuery({
            queryKey: ["matchHistory", name, currentPage + 1],
            queryFn: () =>
                getMatches({ filter: { name }, currentPage: currentPage + 1 }),
        });
    }

    if (currentPage > 1) {
        queryClient.prefetchQuery({
            queryKey: ["matchHistory", name, currentPage - 1],
            queryFn: () =>
                getMatches({ filter: { name }, currentPage: currentPage - 1 }),
        });
    }

    return { matches, isLoadingMatches, count, error };
}
