import { useQuery } from "react-query";
import { useKicker } from "../../contexts/KickerContext";
import { useCurrentSeason } from "../seasons/useCurrentSeason";
import {
    getAchievementFeedStats,
    getAchievementLeaderboard,
} from "../../services/apiAchievements";

const ACHIEVEMENT_FEED_STATS = "achievement_feed_stats";
const ACHIEVEMENT_LEADERBOARD = "achievement_leaderboard";

/**
 * Hook to fetch achievement feed statistics and leaderboard
 * Returns daily/weekly/monthly counts and top achievement hunters
 */
export function useAchievementFeedStats() {
    const { currentKicker: kicker } = useKicker();
    const { currentSeason } = useCurrentSeason();
    const seasonId = currentSeason?.id;

    // Fetch stats
    const {
        data: stats,
        isLoading: isLoadingStats,
        error: statsError,
    } = useQuery({
        queryKey: [ACHIEVEMENT_FEED_STATS, kicker, seasonId],
        queryFn: () => getAchievementFeedStats(kicker, seasonId),
        enabled: !!kicker,
        staleTime: 60 * 1000, // 1 minute
        refetchInterval: 60 * 1000, // Refetch every minute
    });

    // Fetch leaderboard
    const {
        data: leaderboard,
        isLoading: isLoadingLeaderboard,
        error: leaderboardError,
    } = useQuery({
        queryKey: [ACHIEVEMENT_LEADERBOARD, kicker, seasonId],
        queryFn: () => getAchievementLeaderboard(kicker, seasonId, 5),
        enabled: !!kicker,
        staleTime: 60 * 1000, // 1 minute
        refetchInterval: 60 * 1000, // Refetch every minute
    });

    return {
        stats,
        leaderboard,
        isLoading: isLoadingStats || isLoadingLeaderboard,
        error: statsError || leaderboardError,
    };
}
