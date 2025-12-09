import { useQuery, useQueryClient } from "react-query";
import { getMatches } from "../../services/apiMatches";
import { useParams, useSearchParams } from "react-router-dom";
import {
    PAGE_SIZE,
    SEASON_ALL_TIME,
    SEASON_OFF_SEASON,
} from "../../utils/constants";
import { useKicker } from "../../contexts/KickerContext";
import { useCurrentSeason } from "../seasons/useCurrentSeason";

export function useMatchHistory() {
    const { userId: name } = useParams();
    const [searchParams] = useSearchParams();
    const queryClient = useQueryClient();
    const { currentKicker: kicker } = useKicker();
    const { currentSeason, isLoading: isLoadingCurrentSeason } =
        useCurrentSeason();

    // GAMEMODE FILTERING
    const filterValue = searchParams.get("gamemode");
    const gamemodeFilter =
        !filterValue || filterValue === "all"
            ? null
            : { field: "gamemode", value: filterValue };

    // SEASON FILTERING - default to current season
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
        data: { data: matches, count } = {},
        isLoading: isLoadingMatches,
        error,
    } = useQuery({
        queryKey: [
            "matchHistory",
            name,
            filter,
            currentPage,
            kicker,
            seasonValue,
        ],
        queryFn: () =>
            getMatches({ filter: { name, ...filter, kicker }, currentPage }),
        enabled: !!name && !isLoadingCurrentSeason,
    });

    const pageCount = Math.ceil(count / PAGE_SIZE);

    if (currentPage < pageCount) {
        queryClient.prefetchQuery({
            queryKey: [
                "matchHistory",
                name,
                filter,
                currentPage + 1,
                kicker,
                seasonValue,
            ],
            queryFn: () =>
                getMatches({
                    filter: { name, ...filter, kicker },
                    currentPage: currentPage + 1,
                }),
        });
    }

    if (currentPage > 1) {
        queryClient.prefetchQuery({
            queryKey: [
                "matchHistory",
                name,
                filter,
                currentPage - 1,
                kicker,
                seasonValue,
            ],
            queryFn: () =>
                getMatches({
                    filter: { name, ...filter, kicker },
                    currentPage: currentPage - 1,
                }),
        });
    }

    return { matches, isLoadingMatches, count, error };
}
