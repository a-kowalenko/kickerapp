import { useQuery, useQueryClient } from "react-query";
import { getMatches as getMatchesApi } from "../../services/apiMatches";
import { useSearchParams } from "react-router-dom";
import {
    MATCHES,
    PAGE_SIZE,
    SEASON_ALL_TIME,
    SEASON_OFF_SEASON,
} from "../../utils/constants";
import { useKicker } from "../../contexts/KickerContext";
import { useCurrentSeason } from "../seasons/useCurrentSeason";

export function useMatches() {
    const [searchParams] = useSearchParams();
    const queryClient = useQueryClient();
    const { currentKicker: kicker } = useKicker();
    const { currentSeason, isLoading: isLoadingCurrentSeason } =
        useCurrentSeason();

    // Gamemode Filtering
    const filterValue = searchParams.get("gamemode");
    const gamemodeFilter =
        !filterValue || filterValue === "all"
            ? null
            : { field: "gamemode", value: filterValue };

    // Season Filtering - default to current season if available and no param set
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
        queryKey: [MATCHES, filter, currentPage, kicker, seasonValue],
        queryFn: () =>
            getMatchesApi({
                currentPage,
                filter: { ...filter, kicker },
            }),
        enabled: !isLoadingCurrentSeason,
    });

    // Prefetch next page
    const pageCount = Math.ceil(count / PAGE_SIZE);

    if (currentPage < pageCount) {
        queryClient.prefetchQuery({
            queryKey: [MATCHES, filter, currentPage + 1, kicker, seasonValue],
            queryFn: () =>
                getMatchesApi({
                    currentPage: currentPage + 1,
                    filter: { ...filter, kicker },
                }),
        });
    }

    if (currentPage > 1) {
        queryClient.prefetchQuery({
            queryKey: [MATCHES, filter, currentPage - 1, kicker, seasonValue],
            queryFn: () =>
                getMatchesApi({
                    currentPage: currentPage - 1,
                    filter: { ...filter, kicker },
                }),
        });
    }

    return { matches, count, isLoadingMatches, errorMatches };
}
