import { useQuery, useQueryClient } from "react-query";
import { getMatches as getMatchesApi } from "../../services/apiMatches";
import { useSearchParams } from "react-router-dom";
import { MATCHES, PAGE_SIZE } from "../../utils/constants";
import { useKicker } from "../../contexts/KickerContext";
import { useSelectedSeason } from "../seasons/useSelectedSeason";

export function useMatches() {
    const [searchParams] = useSearchParams();
    const queryClient = useQueryClient();
    const { currentKicker: kicker } = useKicker();
    const {
        seasonValue,
        seasonFilter,
        isLoading: isLoadingSeason,
    } = useSelectedSeason();

    // Gamemode Filtering
    const filterValue = searchParams.get("gamemode");
    const gamemodeFilter =
        !filterValue || filterValue === "all"
            ? null
            : { field: "gamemode", value: filterValue };

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
        enabled: !isLoadingSeason,
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
