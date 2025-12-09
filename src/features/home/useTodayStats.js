import { useQuery } from "react-query";
import { getMatches } from "../../services/apiMatches";
import { useKicker } from "../../contexts/KickerContext";
import { useSearchParams } from "react-router-dom";
import { SEASON_ALL_TIME, SEASON_OFF_SEASON } from "../../utils/constants";

export function useTodayStats() {
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
            : null;

    const { data: { data: matches, count } = {}, isLoading } = useQuery({
        queryKey: ["todayStats", kicker, seasonValue],
        queryFn: () =>
            getMatches({ filter: { today: true, kicker, ...seasonFilter } }),
    });

    return { matches, isLoading, count };
}
