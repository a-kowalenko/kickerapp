import { useQuery } from "react-query";
import { useKicker } from "../../contexts/KickerContext";
import { getPlayerHistory } from "../../services/apiHistory";

export function usePlayerHistory(filter) {
    const { currentKicker: kicker } = useKicker();

    const { data: history, isLoading: isLoadingHistory } = useQuery({
        queryKey: ["player_history", filter, kicker],
        queryFn: () => getPlayerHistory(kicker, filter),
    });

    return { history, isLoadingHistory };
}
