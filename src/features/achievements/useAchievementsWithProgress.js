import { useQuery, useQueryClient } from "react-query";
import { useEffect, useCallback } from "react";
import { useKicker } from "../../contexts/KickerContext";
import { getAchievementsWithProgress } from "../../services/apiAchievements";
import supabase, { databaseSchema } from "../../services/supabase";

export function useAchievementsWithProgress(playerId, seasonId = null) {
    const { currentKicker: kickerId } = useKicker();
    const queryClient = useQueryClient();

    const {
        data: achievements,
        isLoading,
        error,
        refetch,
    } = useQuery({
        queryKey: ["achievementsWithProgress", playerId, kickerId, seasonId],
        queryFn: () =>
            getAchievementsWithProgress(playerId, kickerId, seasonId),
        enabled: !!playerId && !!kickerId,
    });

    // Memoized callback to avoid recreating on every render
    const handleProgressUpdate = useCallback(
        (payload) => {
            console.log("Achievement progress update received:", payload);
            // Invalidate queries to refresh data
            queryClient.invalidateQueries({
                queryKey: ["achievementsWithProgress"],
                exact: false,
            });
        },
        [queryClient]
    );

    // Subscribe to realtime progress updates
    useEffect(() => {
        if (!playerId || !kickerId) return;

        // Create unique channel name
        const channelName = `achievement-progress-${playerId}-${Date.now()}`;

        const channel = supabase
            .channel(channelName)
            .on(
                "postgres_changes",
                {
                    event: "*", // Listen to all events (INSERT, UPDATE, DELETE)
                    schema: databaseSchema,
                    table: "player_achievement_progress",
                },
                (payload) => {
                    // Only process if it's for this player
                    if (
                        payload.new?.player_id === playerId ||
                        payload.old?.player_id === playerId
                    ) {
                        handleProgressUpdate(payload);
                    }
                }
            )
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: databaseSchema,
                    table: "player_achievements",
                },
                (payload) => {
                    // Only process if it's for this player
                    if (
                        payload.new?.player_id === playerId ||
                        payload.old?.player_id === playerId
                    ) {
                        handleProgressUpdate(payload);
                    }
                }
            )
            .subscribe((status, err) => {
                if (status === "SUBSCRIBED") {
                    console.log(
                        `Subscribed to achievement updates for player ${playerId}`
                    );
                }
                if (err) {
                    console.error("Realtime subscription error:", err);
                }
            });

        return () => {
            console.log(
                `Unsubscribing from achievement updates for player ${playerId}`
            );
            supabase.removeChannel(channel);
        };
    }, [playerId, kickerId, handleProgressUpdate]);

    return { achievements, isLoading, error, refetch };
}
