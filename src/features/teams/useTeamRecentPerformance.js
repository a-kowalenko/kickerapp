import { useQuery } from "react-query";
import { getTeamMatches } from "../../services/apiTeams";

/**
 * Hook to fetch the last N matches for a team.
 * @param {number} teamId - The team ID
 * @param {number} limit - Number of matches to fetch (default: 10)
 */
export function useTeamRecentPerformance(teamId, limit = 10) {
    const {
        data: { data: matches, count } = {},
        isLoading,
        error,
    } = useQuery({
        queryKey: ["teamRecentPerformance", teamId, limit],
        queryFn: () => getTeamMatches(teamId, { page: 1, pageSize: limit }),
        enabled: !!teamId,
    });

    return {
        matches: matches || [],
        totalCount: count || 0,
        isLoading,
        error,
    };
}
