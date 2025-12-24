import { useEffect, useState, useCallback } from "react";
import { useQueryClient } from "react-query";
import supabase, { databaseSchema } from "../../services/supabase";
import { useOwnPlayer } from "../../hooks/useOwnPlayer";
import { useKicker } from "../../contexts/KickerContext";
import { getAchievementDefinition } from "../../services/apiAchievements";
import { getPlayerById } from "../../services/apiMatches";

const TOAST_DURATION = 6000; // 6 seconds

function useAchievementNotifications() {
    const { data: player } = useOwnPlayer();
    const { currentKicker: kickerId } = useKicker(); // Still needed for channel subscription
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

    // Subscribe to ALL player_achievements inserts in this kicker (not just own player)
    useEffect(() => {
        if (!player?.id || !kickerId) return;

        const handleNewAchievement = async (payload) => {
            const { new: newAchievement } = payload;

            try {
                // Fetch the achievement definition to get name, icon, points
                const definition = await getAchievementDefinition(
                    newAchievement.achievement_id
                );

                console.log("definition:", definition);

                // Achievements are now global - no kicker_id check needed
                if (definition) {
                    // Get the player name for the toast
                    const playerData = await getPlayerById(
                        newAchievement.player_id
                    );
                    const playerName =
                        playerData?.[0]?.name || "Unknown Player";
                    const isOwnAchievement =
                        newAchievement.player_id === player.id;

                    setToastQueue((prev) => [
                        ...prev,
                        {
                            id: newAchievement.id,
                            name: definition.name,
                            icon: definition.icon,
                            points: definition.points,
                            description: definition.description,
                            playerName: playerName,
                            isOwnAchievement: isOwnAchievement,
                        },
                    ]);

                    // Invalidate achievement queries to refresh UI (for own player)
                    if (isOwnAchievement) {
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
                }
            } catch (error) {
                console.error("Error fetching achievement definition:", error);
            }
        };

        // Subscribe to ALL achievements in the kicker (no player_id filter)
        const channel = supabase
            .channel(`achievements-kicker-${kickerId}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: databaseSchema,
                    table: "player_achievements",
                },
                handleNewAchievement
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [player?.id, kickerId, queryClient]);

    return {
        currentToast,
        handleDismiss,
    };
}

export default useAchievementNotifications;
