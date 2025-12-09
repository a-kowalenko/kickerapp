import { useQuery, useQueryClient } from "react-query";
import { getFatalities } from "../../services/apiMatches";
import { useSearchParams } from "react-router-dom";
import { useKicker } from "../../contexts/KickerContext";
import {
    PAGE_SIZE,
    SEASON_ALL_TIME,
    SEASON_OFF_SEASON,
} from "../../utils/constants";
import { useCurrentSeason } from "../seasons/useCurrentSeason";

export function useFatalities() {
    const [searchParams] = useSearchParams();
    const { currentKicker: kicker } = useKicker();
    const queryClient = useQueryClient();
    const { currentSeason, isLoading: isLoadingCurrentSeason } =
        useCurrentSeason();

    // GAMEMODE FILTER
    const filterValue = searchParams.get("gamemode");
    const gamemodeFilter =
        !filterValue || filterValue === "all"
            ? null
            : { field: "gamemode", value: filterValue };

    // SEASON FILTER - default to current season if available and no param set
    const seasonParam = searchParams.get("season");
    const seasonValue =
        seasonParam || (currentSeason ? String(currentSeason.id) : null);

    const seasonFilter =
        seasonValue && seasonValue !== SEASON_ALL_TIME
            ? {
                  seasonId:
                      seasonValue === SEASON_OFF_SEASON ? null : seasonValue,
              }
            : null;

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
        enabled: !isLoadingCurrentSeason,
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
