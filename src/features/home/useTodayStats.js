import { useQuery } from "react-query";
import { getMatches } from "../../services/apiMatches";
import { useKicker } from "../../contexts/KickerContext";
import { useSelectedSeason } from "../seasons/useSelectedSeason";

export function useTodayStats() {
    const { currentKicker: kicker } = useKicker();
    const {
        seasonValue,
        seasonFilter,
        isLoading: isLoadingSeason,
    } = useSelectedSeason();

    const { data: { data: matches, count } = {}, isLoading } = useQuery({
        queryKey: ["todayStats", kicker, seasonValue],
        queryFn: () =>
            getMatches({ filter: { today: true, kicker, ...seasonFilter } }),
        enabled: !isLoadingSeason,
    });

    return { matches, isLoading: isLoading || isLoadingSeason, count };
}
