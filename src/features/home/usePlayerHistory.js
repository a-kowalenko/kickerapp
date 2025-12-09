import { useQuery } from "react-query";
import { useSearchParams } from "react-router-dom";
import { useKicker } from "../../contexts/KickerContext";
import { getPlayerHistory } from "../../services/apiHistory";
import { SEASON_ALL_TIME, SEASON_OFF_SEASON } from "../../utils/constants";

export function usePlayerHistory(filter) {
    const { currentKicker: kicker } = useKicker();
    const [searchParams] = useSearchParams();

    // Season filter from URL
    const seasonValue = searchParams.get("season");
    const seasonFilter =
        seasonValue && seasonValue !== SEASON_ALL_TIME
            ? {
                  seasonId:
                      seasonValue === SEASON_OFF_SEASON ? null : seasonValue,
              }
            : {};

    const combinedFilter = { ...filter, ...seasonFilter };

    const { data: history, isLoading: isLoadingHistory } = useQuery({
        queryKey: ["player_history", combinedFilter, kicker, seasonValue],
        queryFn: () => getPlayerHistory(kicker, combinedFilter),
    });

    return { history, isLoadingHistory };
}
