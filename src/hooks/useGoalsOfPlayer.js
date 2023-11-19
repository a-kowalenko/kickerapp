import { useQuery } from "react-query";
import { useParams } from "react-router";
import { useKicker } from "../contexts/KickerContext";
import { getGoalStatisticsByPlayer } from "../services/apiGoals";

export function useGoalsOfPlayer() {
    const { userId: name } = useParams();
    const { currentKicker: kicker } = useKicker();

    const { data, isLoading } = useQuery({
        queryKey: ["goals_of_player", name, kicker],
        queryFn: () => getGoalStatisticsByPlayer(kicker, name),
    });

    return { data, isLoading };
}
