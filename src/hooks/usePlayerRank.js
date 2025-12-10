import { useQuery } from "react-query";
import { getRankByPlayerName } from "../services/apiRankings";
import { useKicker } from "../contexts/KickerContext";
import { useSelectedSeason } from "../features/seasons/useSelectedSeason";

export function usePlayerRank(playerName) {
    const { currentKicker: kicker } = useKicker();
    const { seasonValue, isLoading: isLoadingSeason } = useSelectedSeason();

    const { data: { rank1on1, rank2on2 } = {}, isLoading } = useQuery({
        queryKey: ["player_rank", playerName, kicker, seasonValue],
        queryFn: () => getRankByPlayerName(kicker, playerName, seasonValue),
        enabled: !isLoadingSeason && !!playerName,
    });

    return { rank1on1, rank2on2, isLoading: isLoading || isLoadingSeason };
}
