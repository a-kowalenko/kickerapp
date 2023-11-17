import { useQuery } from "react-query";
import { getMatches } from "../../services/apiMatches";
import { useKicker } from "../../contexts/KickerContext";

export function useTodayStats() {
    const { currentKicker: kicker } = useKicker();

    const { data: { data: matches, count } = {}, isLoading } = useQuery({
        queryKey: ["todayStats", kicker],
        queryFn: () => getMatches({ filter: { today: true, kicker } }),
    });

    return { matches, isLoading, count };
}
