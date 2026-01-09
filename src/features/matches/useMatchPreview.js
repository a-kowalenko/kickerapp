import { useQuery, useQueryClient } from "react-query";
import { useEffect, useCallback } from "react";
import { getMatch } from "../../services/apiMatches";
import { useKicker } from "../../contexts/KickerContext";
import supabase, { databaseSchema } from "../../services/supabase";
import { MATCH_ACTIVE } from "../../utils/constants";

/**
 * Hook for fetching match preview data with real-time updates.
 * Subscription starts immediately on mount to keep live status and score current.
 *
 * @param {number|string} matchId - The ID of the match to fetch
 * @returns {{ match: object, isLoading: boolean, isLive: boolean }}
 */
export function useMatchPreview(matchId) {
    const { currentKicker: kicker } = useKicker();
    const queryClient = useQueryClient();

    const {
        data: match,
        isLoading,
        error,
    } = useQuery({
        queryKey: ["matchPreview", Number(matchId), kicker],
        queryFn: () => getMatch({ matchId, kicker }),
        enabled: !!matchId && !!kicker,
        staleTime: 10000, // 10 seconds
    });

    // Real-time subscription for live score updates
    const handleRealtimeChange = useCallback(
        (payload) => {
            if (payload.new) {
                // Update only specific fields to preserve nested player objects
                queryClient.setQueryData(
                    ["matchPreview", Number(matchId), kicker],
                    (oldData) => {
                        if (!oldData) return oldData;
                        return {
                            ...oldData,
                            scoreTeam1: payload.new.scoreTeam1,
                            scoreTeam2: payload.new.scoreTeam2,
                            status: payload.new.status,
                        };
                    }
                );
            }
        },
        [queryClient, matchId, kicker]
    );

    useEffect(() => {
        if (!matchId || !kicker) return;

        const channelInstance = supabase
            .channel(`match-preview-${matchId}`)
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: databaseSchema,
                    table: "matches",
                    filter: `id=eq.${matchId}`,
                },
                handleRealtimeChange
            )
            .subscribe();

        return () => {
            if (channelInstance) {
                supabase.removeChannel(channelInstance);
            }
        };
    }, [matchId, kicker, handleRealtimeChange]);

    const isLive = match?.status === MATCH_ACTIVE;

    return { match, isLoading, error, isLive };
}
