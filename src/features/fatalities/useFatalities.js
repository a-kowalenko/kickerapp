import { useQuery, useQueryClient } from "react-query";
import { getFatalities } from "../../services/apiMatches";
import { useSearchParams } from "react-router-dom";
import { useKicker } from "../../contexts/KickerContext";
import { PAGE_SIZE } from "../../utils/constants";

export function useFatalities() {
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
        data: { data: fatalities, count } = {},
        isLoading,
        error,
    } = useQuery({
        queryKey: ["digraces", filter, currentPage, kicker],
        queryFn: () =>
            getFatalities({ filter: { ...filter, kicker, currentPage } }),
    });

    // Prefetch next page
    const pageCount = Math.ceil(count / PAGE_SIZE);

    if (currentPage < pageCount) {
        queryClient.prefetchQuery({
            queryKey: ["digraces", filter, currentPage + 1, kicker],
            queryFn: () =>
                getFatalities({
                    filter: { ...filter, kicker, currentPage: currentPage + 1 },
                }),
        });
    }

    if (currentPage > 1) {
        queryClient.prefetchQuery({
            queryKey: ["digraces", filter, currentPage - 1, kicker],
            queryFn: () =>
                getFatalities({
                    filter: { ...filter, kicker, currentPage: currentPage - 1 },
                }),
        });
    }

    return { fatalities, count, isLoading, error };
}
