import { useMutation, useQueryClient } from "react-query";
import {
    createRewardDefinition,
    updateRewardDefinition,
    deleteRewardDefinition,
} from "../../services/apiRewards";
import toast from "react-hot-toast";

/**
 * Hook to create a new reward definition
 */
export function useCreateReward() {
    const queryClient = useQueryClient();

    const { mutate, isLoading } = useMutation({
        mutationFn: createRewardDefinition,
        onSuccess: () => {
            queryClient.invalidateQueries(["rewardDefinitions"]);
            toast.success("Reward created successfully!");
        },
        onError: (error) => {
            toast.error(error.message || "Failed to create reward");
        },
    });

    return { createReward: mutate, isLoading };
}

/**
 * Hook to update an existing reward definition
 */
export function useUpdateReward() {
    const queryClient = useQueryClient();

    const { mutate, isLoading } = useMutation({
        mutationFn: ({ id, ...data }) => updateRewardDefinition(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries(["rewardDefinitions"]);
            queryClient.invalidateQueries(["achievementReward"]);
            toast.success("Reward updated successfully!");
        },
        onError: (error) => {
            toast.error(error.message || "Failed to update reward");
        },
    });

    return { updateReward: mutate, isLoading };
}

/**
 * Hook to delete a reward definition
 */
export function useDeleteReward() {
    const queryClient = useQueryClient();

    const { mutate, isLoading } = useMutation({
        mutationFn: deleteRewardDefinition,
        onSuccess: () => {
            queryClient.invalidateQueries(["rewardDefinitions"]);
            queryClient.invalidateQueries(["achievementReward"]);
            toast.success("Reward deleted successfully!");
        },
        onError: (error) => {
            toast.error(error.message || "Failed to delete reward");
        },
    });

    return { deleteReward: mutate, isLoading };
}
