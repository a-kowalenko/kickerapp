import { useQuery } from "react-query";
import { getRankings } from "../../services/apiRankings";
import { useSearchParams } from "react-router-dom";
import { useKicker } from "../../contexts/KickerContext";
import { useSelectedSeason } from "../seasons/useSelectedSeason";

export function useRankings() {
    const [searchParams] = useSearchParams();
    const { currentKicker: kicker } = useKicker();
    const { seasonValue, isLoading: isLoadingSeason } = useSelectedSeason();

    // GAMEMODE FILTER
    const filterValue = searchParams.get("gamemode");
    const field = !filterValue || filterValue === "1on1" ? "mmr" : "mmr2on2";

    const filter = { field, kicker, seasonId: seasonValue };

    const {
        data: { data: rankings, count } = {},
        isLoading: isLoadingRankings,
        errorRankings,
    } = useQuery({
        queryKey: ["rankings", filter, kicker, seasonValue],
        queryFn: () => getRankings({ filter }),
        enabled: !isLoadingSeason,
    });

    return { rankings, count, isLoadingRankings, errorRankings };
}
