import { useQuery, useMutation, useQueryClient } from "react-query";
import {
    getPlayerUnlockedRewards,
    getPlayerWithRewards,
    updatePlayerSelectedReward,
    getRewardDefinitions,
    getRewardByAchievementKey,
    getPlayersWithRewards,
} from "../../services/apiRewards";
import toast from "react-hot-toast";

/**
 * Hook to get all reward definitions
 */
export function useRewardDefinitions() {
    const { data, isLoading, error } = useQuery({
        queryKey: ["rewardDefinitions"],
        queryFn: getRewardDefinitions,
    });

    return { rewards: data, isLoading, error };
}

/**
 * Hook to get a player's unlocked rewards
 */
export function usePlayerUnlockedRewards(playerId) {
    const { data, isLoading, error } = useQuery({
        queryKey: ["playerUnlockedRewards", playerId],
        queryFn: () => getPlayerUnlockedRewards(playerId),
        enabled: !!playerId,
    });

    // Group by type for easier consumption
    const grouped = {
        titles: (data || []).filter((r) => r.reward_type === "title"),
        frames: (data || []).filter((r) => r.reward_type === "frame"),
        rights: (data || []).filter((r) => r.reward_type === "right"),
    };

    return {
        rewards: data,
        titles: grouped.titles,
        frames: grouped.frames,
        rights: grouped.rights,
        isLoading,
        error,
    };
}

/**
 * Hook to get a player with their active rewards
 */
export function usePlayerWithRewards(playerId) {
    const { data, isLoading, error } = useQuery({
        queryKey: ["playerWithRewards", playerId],
        queryFn: () => getPlayerWithRewards(playerId),
        enabled: !!playerId,
    });

    return {
        player: data,
        title: data
            ? {
                  id: data.title_id,
                  name: data.title_name,
                  displayPosition: data.title_display_position,
                  displayValue: data.title_display_value,
              }
            : null,
        frame: data
            ? {
                  id: data.frame_id,
                  name: data.frame_name,
                  displayValue: data.frame_display_value,
              }
            : null,
        isLoading,
        error,
    };
}

/**
 * Hook to get rewards for multiple players at once
 */
export function usePlayersRewards(playerIds) {
    const { data, isLoading, error } = useQuery({
        queryKey: ["playersRewards", playerIds?.join(",")],
        queryFn: () => getPlayersWithRewards(playerIds),
        enabled: !!playerIds && playerIds.length > 0,
    });

    return {
        rewardsMap: data || {},
        isLoading,
        error,
    };
}

/**
 * Hook to get the reward linked to a specific achievement
 */
export function useAchievementReward(achievementKey) {
    const { data, isLoading, error } = useQuery({
        queryKey: ["achievementReward", achievementKey],
        queryFn: () => getRewardByAchievementKey(achievementKey),
        enabled: !!achievementKey,
    });

    return { reward: data, isLoading, error };
}

/**
 * Hook to update a player's selected reward
 */
export function useUpdateSelectedReward() {
    const queryClient = useQueryClient();

    const { mutate, isLoading } = useMutation({
        mutationFn: ({ playerId, rewardType, rewardId }) =>
            updatePlayerSelectedReward(playerId, rewardType, rewardId),
        onSuccess: (_, { playerId, rewardType }) => {
            // Invalidate related queries
            queryClient.invalidateQueries(["playerUnlockedRewards", playerId]);
            queryClient.invalidateQueries(["playerWithRewards", playerId]);
            queryClient.invalidateQueries(["playersRewards"]);

            const typeLabel = rewardType === "title" ? "Title" : "Frame";
            toast.success(`${typeLabel} updated!`);
        },
        onError: (error) => {
            toast.error(error.message || "Failed to update reward");
        },
    });

    return { updateReward: mutate, isUpdating: isLoading };
}
