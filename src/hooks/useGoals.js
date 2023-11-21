import { useQuery } from "react-query";
import { useParams } from "react-router";
import { getGoalsByMatch } from "../services/apiGoals";
import { useKicker } from "../contexts/KickerContext";
import { GOALS } from "../utils/constants";

export function useGoals() {
    const { matchId } = useParams();
    const { currentKicker: kicker } = useKicker();

    const sortBy = {
        field: "created_at",
        direction: "asc",
    };

    const { data: { data: goals, count } = {}, isLoading } = useQuery({
        queryKey: [GOALS, `match_${matchId}`],
        queryFn: () => getGoalsByMatch(kicker, Number(matchId), sortBy),
    });

    return { goals, isLoadingGoals: isLoading, countGoals: count };
}
