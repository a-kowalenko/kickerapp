import { useQuery, useMutation, useQueryClient } from "react-query";
import toast from "react-hot-toast";
import {
    getAdminPlayerAchievements,
    createAdminPlayerAchievement,
    updateAdminPlayerAchievement,
    deleteAdminPlayerAchievement,
    getAdminPlayerProgress,
    createAdminPlayerProgress,
    updateAdminPlayerProgress,
    deleteAdminPlayerProgress,
} from "../../../services/apiAchievements";

// ============== PLAYER ACHIEVEMENTS (UNLOCKED) ==============

export function useAdminPlayerAchievements({ seasonId, playerId } = {}) {
    const {
        data: playerAchievements,
        isLoading,
        error,
    } = useQuery({
        queryKey: ["adminPlayerAchievements", seasonId, playerId],
        queryFn: () => getAdminPlayerAchievements({ seasonId, playerId }),
    });

    return { playerAchievements, isLoading, error };
}

export function useCreateAdminPlayerAchievement() {
    const queryClient = useQueryClient();

    const { mutate: createPlayerAchievement, isLoading } = useMutation({
        mutationFn: (data) => createAdminPlayerAchievement(data),
        onSuccess: () => {
            toast.success("Player achievement created successfully");
            queryClient.invalidateQueries(["adminPlayerAchievements"]);
        },
        onError: (error) => toast.error(error.message),
    });

    return { createPlayerAchievement, isLoading };
}

export function useUpdateAdminPlayerAchievement() {
    const queryClient = useQueryClient();

    const { mutate: updatePlayerAchievement, isLoading } = useMutation({
        mutationFn: ({ id, ...updates }) =>
            updateAdminPlayerAchievement(id, updates),
        onSuccess: () => {
            toast.success("Player achievement updated successfully");
            queryClient.invalidateQueries(["adminPlayerAchievements"]);
        },
        onError: (error) => toast.error(error.message),
    });

    return { updatePlayerAchievement, isLoading };
}

export function useDeleteAdminPlayerAchievement() {
    const queryClient = useQueryClient();

    const { mutate: deletePlayerAchievement, isLoading } = useMutation({
        mutationFn: (id) => deleteAdminPlayerAchievement(id),
        onSuccess: () => {
            toast.success("Player achievement deleted successfully");
            queryClient.invalidateQueries(["adminPlayerAchievements"]);
        },
        onError: (error) => toast.error(error.message),
    });

    return { deletePlayerAchievement, isLoading };
}

// ============== PLAYER ACHIEVEMENT PROGRESS ==============

export function useAdminPlayerProgress({ seasonId, playerId } = {}) {
    const {
        data: playerProgress,
        isLoading,
        error,
    } = useQuery({
        queryKey: ["adminPlayerProgress", seasonId, playerId],
        queryFn: () => getAdminPlayerProgress({ seasonId, playerId }),
    });

    return { playerProgress, isLoading, error };
}

export function useCreateAdminPlayerProgress() {
    const queryClient = useQueryClient();

    const { mutate: createPlayerProgress, isLoading } = useMutation({
        mutationFn: (data) => createAdminPlayerProgress(data),
        onSuccess: () => {
            toast.success("Player progress created successfully");
            queryClient.invalidateQueries(["adminPlayerProgress"]);
        },
        onError: (error) => toast.error(error.message),
    });

    return { createPlayerProgress, isLoading };
}

export function useUpdateAdminPlayerProgress() {
    const queryClient = useQueryClient();

    const { mutate: updatePlayerProgress, isLoading } = useMutation({
        mutationFn: ({ id, ...updates }) =>
            updateAdminPlayerProgress(id, updates),
        onSuccess: () => {
            toast.success("Player progress updated successfully");
            queryClient.invalidateQueries(["adminPlayerProgress"]);
        },
        onError: (error) => toast.error(error.message),
    });

    return { updatePlayerProgress, isLoading };
}

export function useDeleteAdminPlayerProgress() {
    const queryClient = useQueryClient();

    const { mutate: deletePlayerProgress, isLoading } = useMutation({
        mutationFn: (id) => deleteAdminPlayerProgress(id),
        onSuccess: () => {
            toast.success("Player progress deleted successfully");
            queryClient.invalidateQueries(["adminPlayerProgress"]);
        },
        onError: (error) => toast.error(error.message),
    });

    return { deletePlayerProgress, isLoading };
}
