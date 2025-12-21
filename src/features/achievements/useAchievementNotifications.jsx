import { useEffect, useState, useCallback } from "react";
import { useQueryClient } from "react-query";
import supabase, { databaseSchema } from "../../services/supabase";
import { useOwnPlayer } from "../../hooks/useOwnPlayer";
import { getAchievementDefinition } from "../../services/apiAchievements";

const TOAST_DURATION = 6000; // 6 seconds

function useAchievementNotifications() {
    const { data: player } = useOwnPlayer();
    const queryClient = useQueryClient();
    const [toastQueue, setToastQueue] = useState([]);
    const [currentToast, setCurrentToast] = useState(null);

    // Process toast queue
    useEffect(() => {
        if (currentToast === null && toastQueue.length > 0) {
            const [next, ...rest] = toastQueue;
            setCurrentToast(next);
            setToastQueue(rest);

            // Auto-dismiss after duration
            const timer = setTimeout(() => {
                setCurrentToast(null);
            }, TOAST_DURATION);

            return () => clearTimeout(timer);
        }
    }, [currentToast, toastQueue]);

    const handleDismiss = useCallback(() => {
        setCurrentToast(null);
    }, []);

    // Subscribe to player_achievements inserts
    useEffect(() => {
        if (!player?.id) return;

        const handleNewAchievement = async (payload) => {
            const { new: newAchievement } = payload;

            // Only show toast for this player
            if (newAchievement.player_id !== player.id) return;

            try {
                // Fetch the achievement definition to get name, icon, points
                const definition = await getAchievementDefinition(
                    newAchievement.achievement_id
                );

                if (definition) {
                    setToastQueue((prev) => [
                        ...prev,
                        {
                            id: newAchievement.id,
                            name: definition.name,
                            icon: definition.icon,
                            points: definition.points,
                        },
                    ]);

                    // Invalidate achievement queries to refresh UI
                    queryClient.invalidateQueries([
                        "achievementsWithProgress",
                        player.id,
                    ]);
                    queryClient.invalidateQueries([
                        "playerAchievements",
                        player.id,
                    ]);
                    queryClient.invalidateQueries([
                        "playerAchievementsSummary",
                        player.id,
                    ]);
                }
            } catch (error) {
                console.error("Error fetching achievement definition:", error);
            }
        };

        const channel = supabase
            .channel(`achievements-${player.id}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: databaseSchema,
                    table: "player_achievements",
                    filter: `player_id=eq.${player.id}`,
                },
                handleNewAchievement
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [player?.id, queryClient]);

    return {
        currentToast,
        handleDismiss,
    };
}

export default useAchievementNotifications;
