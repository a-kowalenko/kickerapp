import { useQuery } from "react-query";
import { useKicker } from "../../contexts/KickerContext";
import { getPlayerHistory } from "../../services/apiHistory";
import { useSelectedSeason } from "../seasons/useSelectedSeason";

export function usePlayerHistory(filter) {
    const { currentKicker: kicker } = useKicker();
    const {
        seasonValue,
        seasonFilter,
        isLoading: isLoadingSeason,
    } = useSelectedSeason();

    const combinedFilter = { ...filter, ...(seasonFilter || {}) };

    const { data: history, isLoading: isLoadingHistory } = useQuery({
        queryKey: ["player_history", combinedFilter, kicker, seasonValue],
        queryFn: () => getPlayerHistory(kicker, combinedFilter),
        enabled: !isLoadingSeason,
    });

    return {
        history,
        isLoadingHistory: isLoadingHistory || isLoadingSeason,
    };
}
