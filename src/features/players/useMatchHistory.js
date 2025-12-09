import { useQuery, useQueryClient } from "react-query";
import { getMatches } from "../../services/apiMatches";
import { useParams, useSearchParams } from "react-router-dom";
import { PAGE_SIZE } from "../../utils/constants";
import { useKicker } from "../../contexts/KickerContext";
import { useSelectedSeason } from "../seasons/useSelectedSeason";

export function useMatchHistory() {
    const { userId: name } = useParams();
    const [searchParams] = useSearchParams();
    const queryClient = useQueryClient();
    const { currentKicker: kicker } = useKicker();
    const {
        seasonValue,
        seasonFilter,
        isLoading: isLoadingSeason,
    } = useSelectedSeason();

    // GAMEMODE FILTERING
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
        enabled: !!name && !isLoadingSeason,
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
