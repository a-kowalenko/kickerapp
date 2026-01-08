import { useQuery } from "react-query";
import { getAchievementCategories } from "../../services/apiAchievements";

export function useAchievementCategories() {
    const {
        data: categories,
        isLoading,
        error,
    } = useQuery({
        queryKey: ["achievementCategories"],
        queryFn: () => getAchievementCategories(),
    });

    return { categories, isLoading, error };
}
