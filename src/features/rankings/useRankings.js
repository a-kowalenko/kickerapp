import { useQuery } from "react-query";
import { getRankings } from "../../services/apiRankings";
import { useSearchParams } from "react-router-dom";
import { useKicker } from "../../contexts/KickerContext";
import { useCurrentSeason } from "../seasons/useCurrentSeason";

export function useRankings() {
    const [searchParams] = useSearchParams();
    const { currentKicker: kicker } = useKicker();
    const { currentSeason, isLoading: isLoadingCurrentSeason } =
        useCurrentSeason();

    // GAMEMODE FILTER
    const filterValue = searchParams.get("gamemode");
    const field = !filterValue || filterValue === "1on1" ? "mmr" : "mmr2on2";

    // SEASON FILTER - default to current season if available and no param set
    const seasonParam = searchParams.get("season");
    const seasonId =
        seasonParam || (currentSeason ? String(currentSeason.id) : null);

    const filter = { field, kicker, seasonId };

    const {
        data: { data: rankings, count } = {},
        isLoading: isLoadingRankings,
        errorRankings,
    } = useQuery({
        queryKey: ["rankings", filter, kicker, seasonId],
        queryFn: () => getRankings({ filter }),
        enabled: !isLoadingCurrentSeason,
    });

    return { rankings, count, isLoadingRankings, errorRankings };
}
