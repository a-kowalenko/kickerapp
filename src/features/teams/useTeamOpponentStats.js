import { useQuery } from "react-query";
import { getTeamOpponentStats } from "../../services/apiTeams";

/**
 * Hook to get aggregated opponent statistics for a team
 * @param {number} teamId - Team ID
 * @returns {{ opponentStats: Array, isLoading: boolean, error: Error }}
 */
export function useTeamOpponentStats(teamId) {
    const { data, isLoading, error } = useQuery({
        queryKey: ["team-opponent-stats", teamId],
        queryFn: () => getTeamOpponentStats(teamId),
        enabled: !!teamId,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    return {
        opponentStats: data || [],
        isLoading,
        error,
    };
}
