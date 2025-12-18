import { useQuery } from "react-query";
import { useKicker } from "../../contexts/KickerContext";
import {
    getPlayerAchievements,
    getPlayerAchievementsSummary,
} from "../../services/apiAchievements";

export function usePlayerAchievements(playerId, seasonId = null) {
    const { currentKicker: kickerId } = useKicker();

    const {
        data: achievements,
        isLoading,
        error,
    } = useQuery({
        queryKey: ["playerAchievements", playerId, kickerId, seasonId],
        queryFn: () => getPlayerAchievements(playerId, kickerId, seasonId),
        enabled: !!playerId && !!kickerId,
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
