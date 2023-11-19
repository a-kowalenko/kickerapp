import { useQuery } from "react-query";
import { useParams } from "react-router";
import { getGoalsByMatch } from "../services/apiGoals";
import { useKicker } from "../contexts/KickerContext";
import { ACTIVE_MATCH_REFETCH_INTERVAL } from "../utils/constants";

export function useGoals() {
    const { matchId } = useParams();
    const { currentKicker: kicker } = useKicker();

    const sortBy = {
        field: "created_at",
        direction: "asc",
    };

    const { data: { data: goals, count } = {}, isLoading } = useQuery({
        queryKey: ["goals", `match_${matchId}`],
        queryFn: () => getGoalsByMatch(kicker, Number(matchId), sortBy),
        refetchInterval: (data) => {
            if (!data) {
                return false;
            }
            const { data: goals } = data;
            const matchStatus =
                goals.length === 0 ||
                (goals.length > 0 && goals[0].match.status === "active")
                    ? "active"
                    : "ended";
            return matchStatus === "active"
                ? ACTIVE_MATCH_REFETCH_INTERVAL
                : false;
        },
        refetchIntervalInBackground: true,
    });

    return { goals, isLoadingGoals: isLoading, countGoals: count };
}
