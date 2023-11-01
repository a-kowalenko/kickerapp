import { useQuery } from "react-query";
import { getMatches } from "../../services/apiMatches";

export function useTodayStats() {
    const { data: { data: matches, count } = {}, isLoading } = useQuery({
        queryKey: ["todayStats"],
        queryFn: () => getMatches({ filter: { today: true } }),
    });

    return { matches, isLoading, count };
}
