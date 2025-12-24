import { useMutation, useQueryClient } from "react-query";
import toast from "react-hot-toast";
import {
    createAchievementCategory,
    updateAchievementCategory,
    deleteAchievementCategory,
} from "../../services/apiAchievements";

export function useCreateCategory() {
    const queryClient = useQueryClient();

    const { mutate: createCategory, isLoading } = useMutation({
        mutationFn: (data) => createAchievementCategory(data),
        onSuccess: () => {
            toast.success("Category created successfully");
            queryClient.invalidateQueries(["achievementCategories"]);
        },
        onError: (error) => toast.error(error.message),
    });

    return { createCategory, isLoading };
}

export function useUpdateCategory() {
    const queryClient = useQueryClient();

    const { mutate: updateCategory, isLoading } = useMutation({
        mutationFn: ({ id, ...updates }) =>
            updateAchievementCategory(id, updates),
        onSuccess: () => {
            toast.success("Category updated successfully");
            queryClient.invalidateQueries(["achievementCategories"]);
        },
        onError: (error) => toast.error(error.message),
    });

    return { updateCategory, isLoading };
}

export function useDeleteCategory() {
    const queryClient = useQueryClient();

    const { mutate: deleteCategory, isLoading } = useMutation({
        mutationFn: (id) => deleteAchievementCategory(id),
        onSuccess: () => {
            toast.success("Category deleted successfully");
            queryClient.invalidateQueries(["achievementCategories"]);
        },
        onError: (error) => toast.error(error.message),
    });

    return { deleteCategory, isLoading };
}
