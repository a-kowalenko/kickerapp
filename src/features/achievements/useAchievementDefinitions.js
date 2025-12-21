import { useQuery } from "react-query";
import { getAchievementDefinitions } from "../../services/apiAchievements";

export function useAchievementDefinitions(seasonId = null) {
    const {
        data: definitions,
        isLoading,
        error,
    } = useQuery({
        queryKey: ["achievementDefinitions", seasonId],
        queryFn: () => getAchievementDefinitions(seasonId),
    });

    return { definitions, isLoading, error };
}
