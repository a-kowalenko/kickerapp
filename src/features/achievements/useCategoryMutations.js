import { useMutation, useQueryClient } from "react-query";
import { useKicker } from "../../contexts/KickerContext";
import toast from "react-hot-toast";
import {
    createAchievementCategory,
    updateAchievementCategory,
    deleteAchievementCategory,
} from "../../services/apiAchievements";

export function useCreateCategory() {
    const { currentKicker: kickerId } = useKicker();
    const queryClient = useQueryClient();

    const { mutate: createCategory, isLoading } = useMutation({
        mutationFn: (data) => createAchievementCategory({ ...data, kickerId }),
        onSuccess: () => {
            toast.success("Category created successfully");
            queryClient.invalidateQueries(["achievementCategories", kickerId]);
        },
        onError: (error) => toast.error(error.message),
    });

    return { createCategory, isLoading };
}

export function useUpdateCategory() {
    const { currentKicker: kickerId } = useKicker();
    const queryClient = useQueryClient();

    const { mutate: updateCategory, isLoading } = useMutation({
        mutationFn: ({ id, ...updates }) =>
            updateAchievementCategory(id, updates),
        onSuccess: () => {
            toast.success("Category updated successfully");
            queryClient.invalidateQueries(["achievementCategories", kickerId]);
        },
        onError: (error) => toast.error(error.message),
    });

    return { updateCategory, isLoading };
}

export function useDeleteCategory() {
    const { currentKicker: kickerId } = useKicker();
    const queryClient = useQueryClient();

    const { mutate: deleteCategory, isLoading } = useMutation({
        mutationFn: (id) => deleteAchievementCategory(id),
        onSuccess: () => {
            toast.success("Category deleted successfully");
            queryClient.invalidateQueries(["achievementCategories", kickerId]);
        },
        onError: (error) => toast.error(error.message),
    });

    return { deleteCategory, isLoading };
}
