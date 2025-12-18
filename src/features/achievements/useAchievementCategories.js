import { useQuery } from "react-query";
import { useKicker } from "../../contexts/KickerContext";
import { getAchievementCategories } from "../../services/apiAchievements";

export function useAchievementCategories() {
    const { currentKicker: kickerId } = useKicker();

    const {
        data: categories,
        isLoading,
        error,
    } = useQuery({
        queryKey: ["achievementCategories", kickerId],
        queryFn: () => getAchievementCategories(kickerId),
        enabled: !!kickerId,
    });

    return { categories, isLoading, error };
}
