import { useQuery, useQueryClient } from "react-query";
import { getTeamMatches } from "../../services/apiTeams";
import { PAGE_SIZE } from "../../utils/constants";

/**
 * Hook to get paginated team match history
 * @param {number} teamId - Team ID
 * @param {number} currentPage - Current page number
 */
export function useTeamMatchHistoryPaginated(teamId, currentPage = 1) {
    const queryClient = useQueryClient();

    const { data, isLoading, error } = useQuery({
        queryKey: ["team-match-history", teamId, currentPage],
        queryFn: () =>
            getTeamMatches(teamId, { page: currentPage, pageSize: PAGE_SIZE }),
        enabled: !!teamId,
        keepPreviousData: true,
    });

    const pageCount = Math.ceil((data?.count || 0) / PAGE_SIZE);

    // Prefetch next page
    if (currentPage < pageCount) {
        queryClient.prefetchQuery({
            queryKey: ["team-match-history", teamId, currentPage + 1],
            queryFn: () =>
                getTeamMatches(teamId, {
                    page: currentPage + 1,
                    pageSize: PAGE_SIZE,
                }),
        });
    }

    // Prefetch previous page
    if (currentPage > 1) {
        queryClient.prefetchQuery({
            queryKey: ["team-match-history", teamId, currentPage - 1],
            queryFn: () =>
                getTeamMatches(teamId, {
                    page: currentPage - 1,
                    pageSize: PAGE_SIZE,
                }),
        });
    }

    return {
        matches: data?.data || [],
        totalCount: data?.count || 0,
        isLoading,
        error,
    };
}
