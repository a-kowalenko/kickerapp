import { useQuery, useMutation, useQueryClient } from "react-query";
import { useKicker } from "../../contexts/KickerContext";
import { useOwnPlayer } from "../../hooks/useOwnPlayer";
import {
    getTeamsByKicker,
    getActiveTeamsByKicker,
    getTeamsByPlayer,
    getActiveTeamsByPlayer,
    getTeamById,
    createTeam,
    updateTeam,
    dissolveTeam,
    uploadTeamLogo,
    deleteTeamLogo,
    getTeamMatches,
    getTeamVsTeamStats,
} from "../../services/apiTeams";
import toast from "react-hot-toast";

/**
 * Hook to get all teams for the current kicker
 */
export function useTeams() {
    const { currentKicker: kickerId } = useKicker();

    const { data, isLoading, error } = useQuery({
        queryKey: ["teams", kickerId],
        queryFn: () => getTeamsByKicker(kickerId),
        enabled: !!kickerId,
    });

    return { teams: data || [], isLoading, error };
}

/**
 * Hook to get only active teams for the current kicker (for leaderboard)
 */
export function useActiveTeams() {
    const { currentKicker: kickerId } = useKicker();

    const { data, isLoading, error } = useQuery({
        queryKey: ["teams", kickerId, "active"],
        queryFn: () => getActiveTeamsByKicker(kickerId),
        enabled: !!kickerId,
    });

    return { teams: data || [], isLoading, error };
}

/**
 * Hook to get teams for the current player
 */
export function useMyTeams() {
    const { currentKicker: kickerId } = useKicker();
    const { data: player, isLoading: isLoadingPlayer } = useOwnPlayer();

    const {
        data,
        isLoading: isLoadingTeams,
        error,
    } = useQuery({
        queryKey: ["teams", "player", player?.id, kickerId],
        queryFn: () => getTeamsByPlayer(player.id, kickerId),
        enabled: !!player?.id && !!kickerId,
    });

    // Include player loading state in isLoading
    const isLoading = isLoadingPlayer || isLoadingTeams;

    return { teams: data || [], isLoading, error };
}

/**
 * Hook to get active teams for the current player (for team selector)
 */
export function useMyActiveTeams() {
    const { currentKicker: kickerId } = useKicker();
    const { data: player, isLoading: isLoadingPlayer } = useOwnPlayer();

    const {
        data,
        isLoading: isLoadingTeams,
        error,
    } = useQuery({
        queryKey: ["teams", "player", player?.id, kickerId, "active"],
        queryFn: () => getActiveTeamsByPlayer(player.id, kickerId),
        enabled: !!player?.id && !!kickerId,
    });

    // Include player loading state in isLoading
    const isLoading = isLoadingPlayer || isLoadingTeams;

    return { teams: data || [], isLoading, error };
}

/**
 * Hook to get a single team by ID
 */
export function useTeam(teamId) {
    const { data, isLoading, error } = useQuery({
        queryKey: ["team", teamId],
        queryFn: () => getTeamById(teamId),
        enabled: !!teamId,
    });

    return { team: data, isLoading, error };
}

/**
 * Hook to create a new team
 */
export function useCreateTeam() {
    const queryClient = useQueryClient();
    const { currentKicker: kickerId } = useKicker();

    const { mutate, mutateAsync, isLoading, error } = useMutation({
        mutationFn: ({ name, partnerPlayerId }) =>
            createTeam(name, partnerPlayerId, kickerId),
        onSuccess: (data) => {
            if (data.success) {
                queryClient.invalidateQueries(["teams"]);
                queryClient.invalidateQueries(["team-invitations"]);
                toast.success("Team invitation sent!");
            } else {
                toast.error(data.error || "Failed to create team");
            }
        },
        onError: (error) => {
            toast.error(error.message || "Failed to create team");
        },
    });

    return {
        createTeam: mutate,
        createTeamAsync: mutateAsync,
        isLoading,
        error,
    };
}

/**
 * Hook to update a team
 */
export function useUpdateTeam() {
    const queryClient = useQueryClient();

    const { mutate, mutateAsync, isLoading, error } = useMutation({
        mutationFn: ({ teamId, updates }) => updateTeam(teamId, updates),
        onSuccess: (data) => {
            queryClient.invalidateQueries(["teams"]);
            queryClient.invalidateQueries(["team", data.id]);
            toast.success("Team updated!");
        },
        onError: (error) => {
            toast.error(error.message || "Failed to update team");
        },
    });

    return {
        updateTeam: mutate,
        updateTeamAsync: mutateAsync,
        isLoading,
        error,
    };
}

/**
 * Hook to dissolve a team
 */
export function useDissolveTeam() {
    const queryClient = useQueryClient();

    const { mutate, mutateAsync, isLoading, error } = useMutation({
        mutationFn: dissolveTeam,
        onSuccess: (data) => {
            if (data.success) {
                queryClient.invalidateQueries(["teams"]);
                toast.success(`Team "${data.team_name}" has been dissolved`);
            } else {
                toast.error(data.error || "Failed to dissolve team");
            }
        },
        onError: (error) => {
            toast.error(error.message || "Failed to dissolve team");
        },
    });

    return {
        dissolveTeam: mutate,
        dissolveTeamAsync: mutateAsync,
        isLoading,
        error,
    };
}

/**
 * Hook to upload team logo
 */
export function useUploadTeamLogo() {
    const queryClient = useQueryClient();

    const { mutate, mutateAsync, isLoading, error } = useMutation({
        mutationFn: ({ teamId, file }) => uploadTeamLogo(teamId, file),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries(["teams"]);
            queryClient.invalidateQueries(["team", variables.teamId]);
            toast.success("Logo uploaded!");
        },
        onError: (error) => {
            toast.error(error.message || "Failed to upload logo");
        },
    });

    return {
        uploadLogo: mutate,
        uploadLogoAsync: mutateAsync,
        isLoading,
        error,
    };
}

/**
 * Hook to delete team logo
 */
export function useDeleteTeamLogo() {
    const queryClient = useQueryClient();

    const { mutate, mutateAsync, isLoading, error } = useMutation({
        mutationFn: ({ teamId, logoUrl }) => deleteTeamLogo(teamId, logoUrl),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries(["teams"]);
            queryClient.invalidateQueries(["team", variables.teamId]);
            toast.success("Logo removed!");
        },
        onError: (error) => {
            toast.error(error.message || "Failed to remove logo");
        },
    });

    return {
        deleteLogo: mutate,
        deleteLogoAsync: mutateAsync,
        isLoading,
        error,
    };
}

/**
 * Hook to get team match history
 */
export function useTeamMatches(teamId, page = 1, pageSize = 10) {
    const { data, isLoading, error } = useQuery({
        queryKey: ["team-matches", teamId, page, pageSize],
        queryFn: () => getTeamMatches(teamId, { page, pageSize }),
        enabled: !!teamId,
        keepPreviousData: true,
    });

    return {
        matches: data?.data || [],
        totalCount: data?.count || 0,
        isLoading,
        error,
    };
}

/**
 * Hook to get team vs team stats
 */
export function useTeamVsTeamStats(teamId, opponentTeamId) {
    const { data, isLoading, error } = useQuery({
        queryKey: ["team-vs-team", teamId, opponentTeamId],
        queryFn: () => getTeamVsTeamStats(teamId, opponentTeamId),
        enabled: !!teamId && !!opponentTeamId,
    });

    return { stats: data, isLoading, error };
}
