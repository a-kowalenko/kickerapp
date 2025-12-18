import { useQuery } from "react-query";
import { useKicker } from "../../contexts/KickerContext";
import { getAchievementDefinitions } from "../../services/apiAchievements";

export function useAchievementDefinitions(seasonId = null) {
    const { currentKicker: kickerId } = useKicker();

    const {
        data: definitions,
        isLoading,
        error,
    } = useQuery({
        queryKey: ["achievementDefinitions", kickerId, seasonId],
        queryFn: () => getAchievementDefinitions(kickerId, seasonId),
        enabled: !!kickerId,
    });

    return { definitions, isLoading, error };
}
