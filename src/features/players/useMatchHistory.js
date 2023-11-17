import { useQuery, useQueryClient } from "react-query";
import { getMatches } from "../../services/apiMatches";
import { useParams, useSearchParams } from "react-router-dom";
import { PAGE_SIZE } from "../../utils/constants";
import { useKicker } from "../../contexts/KickerContext";

export function useMatchHistory() {
    const { userId: name } = useParams();
    const [searchParams] = useSearchParams();
    const queryClient = useQueryClient();
    const { currentKicker: kicker } = useKicker();

    // FILTERING
    const filterValue = searchParams.get("gamemode");
    const filter =
        !filterValue || filterValue === "all"
            ? null
            : { field: "gamemode", value: filterValue };

    // PAGINATION
    const currentPage = searchParams.get("page")
        ? Number(searchParams.get("page"))
        : 1;

    const {
        data: { data: matches, count } = {},
        isLoading: isLoadingMatches,
        error,
    } = useQuery({
        queryKey: ["matchHistory", name, filter, currentPage, kicker],
        queryFn: () =>
            getMatches({ filter: { name, ...filter, kicker }, currentPage }),
        enabled: !!name,
    });

    const pageCount = Math.ceil(count / PAGE_SIZE);

    if (currentPage < pageCount) {
        queryClient.prefetchQuery({
            queryKey: ["matchHistory", name, filter, currentPage + 1, kicker],
            queryFn: () =>
                getMatches({
                    filter: { name, ...filter, kicker },
                    currentPage: currentPage + 1,
                }),
        });
    }

    if (currentPage > 1) {
        queryClient.prefetchQuery({
            queryKey: ["matchHistory", name, filter, currentPage - 1, kicker],
            queryFn: () =>
                getMatches({
                    filter: { name, ...filter, kicker },
                    currentPage: currentPage - 1,
                }),
        });
    }

    return { matches, isLoadingMatches, count, error };
}
