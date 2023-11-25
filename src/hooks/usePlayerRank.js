import { useQuery } from "react-query";
import { getRankByPlayerName } from "../services/apiRankings";
import { useKicker } from "../contexts/KickerContext";

export function usePlayerRank(playerName) {
    const { currentKicker: kicker } = useKicker();
    const { data: { rank1on1, rank2on2 } = {}, isLoading } = useQuery({
        queryKey: ["player_rank", playerName],
        queryFn: () => getRankByPlayerName(kicker, playerName),
    });

    return { rank1on1, rank2on2, isLoading };
}
