import { useQuery, useQueryClient } from "react-query";
import { getFatalities } from "../../services/apiMatches";
import { useSearchParams } from "react-router-dom";
import { useKicker } from "../../contexts/KickerContext";
import { PAGE_SIZE } from "../../utils/constants";
import { useSelectedSeason } from "../seasons/useSelectedSeason";

export function useFatalities() {
    const [searchParams] = useSearchParams();
    const { currentKicker: kicker } = useKicker();
    const queryClient = useQueryClient();
    const {
        seasonValue,
        seasonFilter,
        isLoading: isLoadingSeason,
    } = useSelectedSeason();

    // GAMEMODE FILTER
    const filterValue = searchParams.get("gamemode");
    const gamemodeFilter =
        !filterValue || filterValue === "all"
            ? null
            : { field: "gamemode", value: filterValue };

    const filter = { ...gamemodeFilter, ...seasonFilter };

    // PAGINATION
    const currentPage = searchParams.get("page")
        ? Number(searchParams.get("page"))
        : 1;

    const {
        data: { data: fatalities, count } = {},
        isLoading,
        error,
    } = useQuery({
        queryKey: ["digraces", filter, currentPage, kicker, seasonValue],
        queryFn: () =>
            getFatalities({ filter: { ...filter, kicker, currentPage } }),
        enabled: !isLoadingSeason,
    });

    // Prefetch next page
    const pageCount = Math.ceil(count / PAGE_SIZE);

    if (currentPage < pageCount) {
        queryClient.prefetchQuery({
            queryKey: [
                "digraces",
                filter,
                currentPage + 1,
                kicker,
                seasonValue,
            ],
            queryFn: () =>
                getFatalities({
                    filter: { ...filter, kicker, currentPage: currentPage + 1 },
                }),
        });
    }

    if (currentPage > 1) {
        queryClient.prefetchQuery({
            queryKey: [
                "digraces",
                filter,
                currentPage - 1,
                kicker,
                seasonValue,
            ],
            queryFn: () =>
                getFatalities({
                    filter: { ...filter, kicker, currentPage: currentPage - 1 },
                }),
        });
    }

    return { fatalities, count, isLoading, error };
}
