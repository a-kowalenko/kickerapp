import { useQuery } from "react-query";
import { useSearchParams } from "react-router-dom";
import { getRankByPlayerName } from "../services/apiRankings";
import { useKicker } from "../contexts/KickerContext";
import { useCurrentSeason } from "../features/seasons/useCurrentSeason";

export function usePlayerRank(playerName) {
    const [searchParams] = useSearchParams();
    const { currentKicker: kicker } = useKicker();
    const { currentSeason, isLoading: isLoadingCurrentSeason } =
        useCurrentSeason();

    // Season filter - default to current season
    const seasonParam = searchParams.get("season");
    const seasonValue =
        seasonParam || (currentSeason ? String(currentSeason.id) : null);

    const { data: { rank1on1, rank2on2 } = {}, isLoading } = useQuery({
        queryKey: ["player_rank", playerName, kicker, seasonValue],
        queryFn: () => getRankByPlayerName(kicker, playerName, seasonValue),
        enabled: !isLoadingCurrentSeason,
    });

    return { rank1on1, rank2on2, isLoading };
}
