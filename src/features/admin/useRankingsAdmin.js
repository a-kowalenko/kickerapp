import { useMutation, useQuery, useQueryClient } from "react-query";
import { useKicker } from "../../contexts/KickerContext";
import {
    getAdminPlayerRankings,
    createAdminPlayerRanking,
    updateAdminPlayerRanking,
    deleteAdminPlayerRanking,
    getAdminTeamRankings,
    createAdminTeamRanking,
    updateAdminTeamRanking,
    deleteAdminTeamRanking,
} from "../../services/apiAdminRankings";
import toast from "react-hot-toast";

// ============== PLAYER RANKINGS HOOKS ==============

export function useAdminPlayerRankings({ playerId, seasonId } = {}) {
    const { currentKicker } = useKicker();

    const { data, isLoading, error } = useQuery({
        queryKey: ["adminPlayerRankings", currentKicker, playerId, seasonId],
        queryFn: () =>
            getAdminPlayerRankings({
                kickerId: currentKicker,
                playerId,
                seasonId,
            }),
        enabled: !!currentKicker,
    });

    return {
        playerRankings: data,
        isLoading,
        error,
    };
}

export function useCreateAdminPlayerRanking() {
    const queryClient = useQueryClient();
    const { currentKicker } = useKicker();

    const { mutate: createPlayerRanking, isLoading } = useMutation({
        mutationFn: createAdminPlayerRanking,
        onSuccess: () => {
            queryClient.invalidateQueries([
                "adminPlayerRankings",
                currentKicker,
            ]);
            toast.success("Player ranking created successfully");
        },
        onError: (error) => {
            toast.error(error.message || "Failed to create player ranking");
        },
    });

    return { createPlayerRanking, isLoading };
}

export function useUpdateAdminPlayerRanking() {
    const queryClient = useQueryClient();
    const { currentKicker } = useKicker();

    const { mutate: updatePlayerRanking, isLoading } = useMutation({
        mutationFn: updateAdminPlayerRanking,
        onSuccess: () => {
            queryClient.invalidateQueries([
                "adminPlayerRankings",
                currentKicker,
            ]);
            toast.success("Player ranking updated successfully");
        },
        onError: (error) => {
            toast.error(error.message || "Failed to update player ranking");
        },
    });

    return { updatePlayerRanking, isLoading };
}

export function useDeleteAdminPlayerRanking() {
    const queryClient = useQueryClient();
    const { currentKicker } = useKicker();

    const { mutate: deletePlayerRanking, isLoading } = useMutation({
        mutationFn: deleteAdminPlayerRanking,
        onSuccess: () => {
            queryClient.invalidateQueries([
                "adminPlayerRankings",
                currentKicker,
            ]);
            toast.success("Player ranking deleted successfully");
        },
        onError: (error) => {
            toast.error(error.message || "Failed to delete player ranking");
        },
    });

    return { deletePlayerRanking, isLoading };
}

// ============== TEAM RANKINGS HOOKS ==============

export function useAdminTeamRankings({ teamId, seasonId } = {}) {
    const { currentKicker } = useKicker();

    const { data, isLoading, error } = useQuery({
        queryKey: ["adminTeamRankings", currentKicker, teamId, seasonId],
        queryFn: () =>
            getAdminTeamRankings({ kickerId: currentKicker, teamId, seasonId }),
        enabled: !!currentKicker,
    });

    return {
        teamRankings: data,
        isLoading,
        error,
    };
}

export function useCreateAdminTeamRanking() {
    const queryClient = useQueryClient();
    const { currentKicker } = useKicker();

    const { mutate: createTeamRanking, isLoading } = useMutation({
        mutationFn: createAdminTeamRanking,
        onSuccess: () => {
            queryClient.invalidateQueries(["adminTeamRankings", currentKicker]);
            toast.success("Team ranking created successfully");
        },
        onError: (error) => {
            toast.error(error.message || "Failed to create team ranking");
        },
    });

    return { createTeamRanking, isLoading };
}

export function useUpdateAdminTeamRanking() {
    const queryClient = useQueryClient();
    const { currentKicker } = useKicker();

    const { mutate: updateTeamRanking, isLoading } = useMutation({
        mutationFn: updateAdminTeamRanking,
        onSuccess: () => {
            queryClient.invalidateQueries(["adminTeamRankings", currentKicker]);
            toast.success("Team ranking updated successfully");
        },
        onError: (error) => {
            toast.error(error.message || "Failed to update team ranking");
        },
    });

    return { updateTeamRanking, isLoading };
}

export function useDeleteAdminTeamRanking() {
    const queryClient = useQueryClient();
    const { currentKicker } = useKicker();

    const { mutate: deleteTeamRanking, isLoading } = useMutation({
        mutationFn: deleteAdminTeamRanking,
        onSuccess: () => {
            queryClient.invalidateQueries(["adminTeamRankings", currentKicker]);
            toast.success("Team ranking deleted successfully");
        },
        onError: (error) => {
            toast.error(error.message || "Failed to delete team ranking");
        },
    });

    return { deleteTeamRanking, isLoading };
}
