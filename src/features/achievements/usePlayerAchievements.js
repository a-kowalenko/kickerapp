import { useQuery } from "react-query";
import {
    getPlayerAchievements,
    getPlayerAchievementsSummary,
} from "../../services/apiAchievements";

export function usePlayerAchievements(playerId, seasonId = null) {
    const {
        data: achievements,
        isLoading,
        error,
    } = useQuery({
        queryKey: ["playerAchievements", playerId, seasonId],
        queryFn: () => getPlayerAchievements(playerId, seasonId),
        enabled: !!playerId,
    });

    return { achievements, isLoading, error };
}

export function usePlayerAchievementsSummary(playerId) {
    const {
        data: summary,
        isLoading,
        error,
    } = useQuery({
        queryKey: ["playerAchievementsSummary", playerId],
        queryFn: () => getPlayerAchievementsSummary(playerId),
        enabled: !!playerId,
    });

    return {
        totalPoints: summary?.totalPoints || 0,
        totalUnlocked: summary?.totalUnlocked || 0,
        isLoading,
        error,
    };
}
