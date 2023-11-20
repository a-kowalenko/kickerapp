import { useQuery, useQueryClient } from "react-query";
import { getDisgraces } from "../../services/apiMatches";
import { useSearchParams } from "react-router-dom";
import { useKicker } from "../../contexts/KickerContext";
import { PAGE_SIZE } from "../../utils/constants";

export function useDisgraces() {
    const [searchParams] = useSearchParams();
    const { currentKicker: kicker } = useKicker();
    const queryClient = useQueryClient();

    // FILTER
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
        data: { data: disgraces, count } = {},
        isLoading,
        error,
    } = useQuery({
        queryKey: ["digraces", filter, currentPage, kicker],
        queryFn: () =>
            getDisgraces({ filter: { ...filter, kicker, currentPage } }),
    });

    // Prefetch next page
    const pageCount = Math.ceil(count / PAGE_SIZE);

    if (currentPage < pageCount) {
        queryClient.prefetchQuery({
            queryKey: ["digraces", filter, currentPage + 1, kicker],
            queryFn: () =>
                getDisgraces({
                    filter: { ...filter, kicker, currentPage: currentPage + 1 },
                }),
        });
    }

    if (currentPage > 1) {
        queryClient.prefetchQuery({
            queryKey: ["digraces", filter, currentPage - 1, kicker],
            queryFn: () =>
                getDisgraces({
                    filter: { ...filter, kicker, currentPage: currentPage - 1 },
                }),
        });
    }

    return { disgraces, count, isLoading, error };
}
