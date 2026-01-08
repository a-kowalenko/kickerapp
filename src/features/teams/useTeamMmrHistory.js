import { useQuery } from "react-query";
import { getTeamMmrHistory } from "../../services/apiTeams";

/**
 * Hook to fetch team MMR history for charts/statistics
 * @param {number|string} teamId - Team ID
 * @param {number} limit - Max number of records (default 50)
 */
export function useTeamMmrHistory(teamId, limit = 50) {
    const {
        data: history = [],
        isLoading,
        error,
    } = useQuery(
        ["teamMmrHistory", teamId, limit],
        () => getTeamMmrHistory(parseInt(teamId), limit),
        {
            enabled: !!teamId,
            staleTime: 1000 * 60 * 5, // 5 minutes
        }
    );

    return {
        history,
        isLoading,
        error,
    };
}
