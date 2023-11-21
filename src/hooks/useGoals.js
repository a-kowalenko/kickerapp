import { useQuery } from "react-query";
import { useParams } from "react-router";
import { getGoalsByMatch } from "../services/apiGoals";
import { useKicker } from "../contexts/KickerContext";
import { ACTIVE_MATCH_REFETCH_INTERVAL } from "../utils/constants";
import { useMatch } from "../features/matches/useMatch";

export function useGoals() {
    const { matchId } = useParams();
    const { currentKicker: kicker } = useKicker();
    const { match } = useMatch();

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
            const isActive = match && match.status === "active";

            return isActive ? ACTIVE_MATCH_REFETCH_INTERVAL : false;
        },
        refetchIntervalInBackground: true,
    });

    return { goals, isLoadingGoals: isLoading, countGoals: count };
}
