import { useMutation, useQuery, useQueryClient } from "react-query";
import { useKicker } from "../../../contexts/KickerContext";
import {
    getAdminPlayerStatus,
    createAdminPlayerStatus,
    updateAdminPlayerStatus,
    deleteAdminPlayerStatus,
    getAdminTeamStatus,
    createAdminTeamStatus,
    updateAdminTeamStatus,
    deleteAdminTeamStatus,
} from "../../../services/apiStatus";
import toast from "react-hot-toast";

// ============== PLAYER STATUS HOOKS ==============

export function useAdminPlayerStatus({ playerId, gamemode } = {}) {
    const { currentKicker } = useKicker();

    const { data, isLoading, error } = useQuery({
        queryKey: ["adminPlayerStatus", currentKicker, playerId, gamemode],
        queryFn: () =>
            getAdminPlayerStatus({
                kickerId: currentKicker,
                playerId,
                gamemode,
            }),
        enabled: !!currentKicker,
    });

    return {
        playerStatus: data,
        isLoading,
        error,
    };
}

export function useCreateAdminPlayerStatus() {
    const queryClient = useQueryClient();
    const { currentKicker } = useKicker();

    const { mutate: createPlayerStatus, isLoading } = useMutation({
        mutationFn: createAdminPlayerStatus,
        onSuccess: () => {
            queryClient.invalidateQueries(["adminPlayerStatus", currentKicker]);
            toast.success("Player status created successfully");
        },
        onError: (error) => {
            toast.error(error.message || "Failed to create player status");
        },
    });

    return { createPlayerStatus, isLoading };
}

export function useUpdateAdminPlayerStatus() {
    const queryClient = useQueryClient();
    const { currentKicker } = useKicker();

    const { mutate: updatePlayerStatus, isLoading } = useMutation({
        mutationFn: updateAdminPlayerStatus,
        onSuccess: () => {
            queryClient.invalidateQueries(["adminPlayerStatus", currentKicker]);
            toast.success("Player status updated successfully");
        },
        onError: (error) => {
            toast.error(error.message || "Failed to update player status");
        },
    });

    return { updatePlayerStatus, isLoading };
}

export function useDeleteAdminPlayerStatus() {
    const queryClient = useQueryClient();
    const { currentKicker } = useKicker();

    const { mutate: deletePlayerStatus, isLoading } = useMutation({
        mutationFn: deleteAdminPlayerStatus,
        onSuccess: () => {
            queryClient.invalidateQueries(["adminPlayerStatus", currentKicker]);
            toast.success("Player status deleted successfully");
        },
        onError: (error) => {
            toast.error(error.message || "Failed to delete player status");
        },
    });

    return { deletePlayerStatus, isLoading };
}

// ============== TEAM STATUS HOOKS ==============

export function useAdminTeamStatus({ teamId } = {}) {
    const { currentKicker } = useKicker();

    const { data, isLoading, error } = useQuery({
        queryKey: ["adminTeamStatus", currentKicker, teamId],
        queryFn: () => getAdminTeamStatus({ kickerId: currentKicker, teamId }),
        enabled: !!currentKicker,
    });

    return {
        teamStatus: data,
        isLoading,
        error,
    };
}

export function useCreateAdminTeamStatus() {
    const queryClient = useQueryClient();
    const { currentKicker } = useKicker();

    const { mutate: createTeamStatus, isLoading } = useMutation({
        mutationFn: createAdminTeamStatus,
        onSuccess: () => {
            queryClient.invalidateQueries(["adminTeamStatus", currentKicker]);
            toast.success("Team status created successfully");
        },
        onError: (error) => {
            toast.error(error.message || "Failed to create team status");
        },
    });

    return { createTeamStatus, isLoading };
}

export function useUpdateAdminTeamStatus() {
    const queryClient = useQueryClient();
    const { currentKicker } = useKicker();

    const { mutate: updateTeamStatus, isLoading } = useMutation({
        mutationFn: updateAdminTeamStatus,
        onSuccess: () => {
            queryClient.invalidateQueries(["adminTeamStatus", currentKicker]);
            toast.success("Team status updated successfully");
        },
        onError: (error) => {
            toast.error(error.message || "Failed to update team status");
        },
    });

    return { updateTeamStatus, isLoading };
}

export function useDeleteAdminTeamStatus() {
    const queryClient = useQueryClient();
    const { currentKicker } = useKicker();

    const { mutate: deleteTeamStatus, isLoading } = useMutation({
        mutationFn: deleteAdminTeamStatus,
        onSuccess: () => {
            queryClient.invalidateQueries(["adminTeamStatus", currentKicker]);
            toast.success("Team status deleted successfully");
        },
        onError: (error) => {
            toast.error(error.message || "Failed to delete team status");
        },
    });

    return { deleteTeamStatus, isLoading };
}
