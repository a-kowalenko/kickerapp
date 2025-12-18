import { useMutation, useQueryClient } from "react-query";
import { useKicker } from "../../contexts/KickerContext";
import toast from "react-hot-toast";
import {
    createAchievementDefinition,
    updateAchievementDefinition,
    deleteAchievementDefinition,
} from "../../services/apiAchievements";

export function useCreateAchievement() {
    const { currentKicker: kickerId } = useKicker();
    const queryClient = useQueryClient();

    const { mutate: createAchievement, isLoading } = useMutation({
        mutationFn: (data) =>
            createAchievementDefinition({ ...data, kickerId }),
        onSuccess: () => {
            toast.success("Achievement created successfully");
            queryClient.invalidateQueries(["achievementDefinitions", kickerId]);
        },
        onError: (error) => toast.error(error.message),
    });

    return { createAchievement, isLoading };
}

export function useUpdateAchievement() {
    const { currentKicker: kickerId } = useKicker();
    const queryClient = useQueryClient();

    const { mutate: updateAchievement, isLoading } = useMutation({
        mutationFn: ({ id, ...updates }) =>
            updateAchievementDefinition(id, updates),
        onSuccess: () => {
            toast.success("Achievement updated successfully");
            queryClient.invalidateQueries(["achievementDefinitions", kickerId]);
        },
        onError: (error) => toast.error(error.message),
    });

    return { updateAchievement, isLoading };
}

export function useDeleteAchievement() {
    const { currentKicker: kickerId } = useKicker();
    const queryClient = useQueryClient();

    const { mutate: deleteAchievement, isLoading } = useMutation({
        mutationFn: (id) => deleteAchievementDefinition(id),
        onSuccess: () => {
            toast.success("Achievement deleted successfully");
            queryClient.invalidateQueries(["achievementDefinitions", kickerId]);
        },
        onError: (error) => toast.error(error.message),
    });

    return { deleteAchievement, isLoading };
}
