import { useQuery, useMutation, useQueryClient } from "react-query";
import { useKicker } from "../../contexts/KickerContext";
import { useOwnPlayer } from "../../hooks/useOwnPlayer";
import { useSelectedSeason } from "../seasons/useSelectedSeason";
import { SEASON_ALL_TIME, SEASON_OFF_SEASON } from "../../utils/constants";
import supabase, { databaseSchema } from "../../services/supabase";
import {
    getTeamsByKicker,
    getActiveTeamsByKicker,
    getTeamsByPlayer,
    getActiveTeamsByPlayer,
    getTeamById,
    getTeamSeasonRanking,
    getTeamSeasonRankings,
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
 * Uses season-specific rankings when a season is active,
 * otherwise falls back to all-time data from teams table
 */
export function useActiveTeams() {
    const { currentKicker: kickerId } = useKicker();
    const { seasonValue, isLoading: isLoadingSeason } = useSelectedSeason();

    // Determine if we should fetch season rankings
    const shouldFetchSeasonRankings =
        seasonValue &&
        seasonValue !== SEASON_ALL_TIME &&
        seasonValue !== SEASON_OFF_SEASON;

    // Fetch all-time rankings (from teams table)
    const {
        data: allTimeTeams,
        isLoading: isLoadingAllTime,
        error: allTimeError,
    } = useQuery({
        queryKey: ["teams", kickerId, "active"],
        queryFn: () => getActiveTeamsByKicker(kickerId),
        enabled: !!kickerId && !shouldFetchSeasonRankings,
    });

    // Fetch season-specific rankings (from team_season_rankings)
    const {
        data: seasonTeamsRaw,
        isLoading: isLoadingSeasonData,
        error: seasonError,
    } = useQuery({
        queryKey: ["teams", kickerId, "active", "season", seasonValue],
        queryFn: () => getTeamSeasonRankings(kickerId, parseInt(seasonValue)),
        enabled: !!kickerId && shouldFetchSeasonRankings && !isLoadingSeason,
    });

    // Normalize season data to match all-time data structure
    // IMPORTANT: Include both flat (player1_id, player2_id) and nested (player1, player2) formats
    // The flat format is required for createTeamMatch to insert player IDs into the matches table
    const seasonTeams = (seasonTeamsRaw || []).map((team) => ({
        id: team.team_id,
        name: team.team_name,
        logo_url: team.logo_url,
        // Flat player ID fields - required for team match creation
        player1_id: team.player1_id,
        player2_id: team.player2_id,
        // Nested player objects - for UI display
        player1: {
            id: team.player1_id,
            name: team.player1_name,
            avatar: team.player1_avatar,
        },
        player2: {
            id: team.player2_id,
            name: team.player2_name,
            avatar: team.player2_avatar,
        },
        wins: team.wins,
        losses: team.losses,
        mmr: team.mmr,
        total_matches: team.total_matches,
        win_rate: team.win_rate,
        status: "active", // Season rankings only include active teams
    }));

    // Use season data if available, otherwise use all-time
    const teams = shouldFetchSeasonRankings ? seasonTeams : allTimeTeams || [];

    const isLoading =
        isLoadingSeason ||
        (shouldFetchSeasonRankings ? isLoadingSeasonData : isLoadingAllTime);

    return {
        teams,
        isLoading,
        error: shouldFetchSeasonRankings ? seasonError : allTimeError,
    };
}

/**
 * Hook to get teams for the current player
 * Merges season-specific stats when a season is active
 */
export function useMyTeams() {
    const { currentKicker: kickerId } = useKicker();
    const { data: player, isLoading: isLoadingPlayer } = useOwnPlayer();
    const { seasonValue, isLoading: isLoadingSeason } = useSelectedSeason();

    // Determine if we should fetch season rankings
    const shouldFetchSeasonRankings =
        seasonValue &&
        seasonValue !== SEASON_ALL_TIME &&
        seasonValue !== SEASON_OFF_SEASON;

    const {
        data: allTimeTeams,
        isLoading: isLoadingTeams,
        error,
    } = useQuery({
        queryKey: ["teams", "player", player?.id, kickerId],
        queryFn: () => getTeamsByPlayer(player.id, kickerId),
        enabled: !!player?.id && !!kickerId,
    });

    // Fetch season rankings for player's teams
    const teamIds = allTimeTeams?.map((t) => t.id) || [];
    const { data: seasonRankings, isLoading: isLoadingSeasonRankings } =
        useQuery({
            queryKey: ["team-season-rankings", teamIds, seasonValue],
            queryFn: async () => {
                if (teamIds.length === 0) return [];
                const { data, error } = await supabase
                    .schema(databaseSchema)
                    .from("team_season_rankings")
                    .select("*")
                    .eq("season_id", parseInt(seasonValue))
                    .in("team_id", teamIds);
                if (error) throw error;
                return data || [];
            },
            enabled:
                !!teamIds.length &&
                shouldFetchSeasonRankings &&
                !isLoadingSeason &&
                !isLoadingTeams,
        });

    // Merge season data into teams
    const teams = (allTimeTeams || []).map((team) => {
        if (!shouldFetchSeasonRankings) return team;
        const seasonData = seasonRankings?.find((r) => r.team_id === team.id);
        return {
            ...team,
            mmr: seasonData?.mmr ?? 1000,
            wins: seasonData?.wins ?? 0,
            losses: seasonData?.losses ?? 0,
            bounty_claimed: seasonData?.bounty_claimed ?? 0,
            isSeasonData: !!seasonData,
        };
    });

    // Include player loading state in isLoading
    const isLoading =
        isLoadingPlayer ||
        isLoadingTeams ||
        isLoadingSeason ||
        (shouldFetchSeasonRankings && isLoadingSeasonRankings);

    return { teams, isLoading, error };
}

/**
 * Hook to get active teams for the current player (for team selector)
 * Merges season-specific stats when a season is active
 */
export function useMyActiveTeams() {
    const { teams, isLoading, error } = useMyTeams();

    // Filter only active teams
    const activeTeams = teams.filter((t) => t.status === "active");

    return { teams: activeTeams, isLoading, error };
}

/**
 * Hook to get a single team by ID
 * Merges season-specific stats (from team_season_rankings) when a season is active,
 * otherwise falls back to all-time stats (from teams table)
 */
export function useTeam(teamId) {
    const { seasonValue, isLoading: isLoadingSeason } = useSelectedSeason();

    // Get base team data
    const {
        data: team,
        isLoading: isLoadingTeam,
        error: teamError,
    } = useQuery({
        queryKey: ["team", teamId],
        queryFn: () => getTeamById(teamId),
        enabled: !!teamId,
    });

    // Determine if we should fetch season ranking
    const shouldFetchSeasonRanking =
        seasonValue &&
        seasonValue !== SEASON_ALL_TIME &&
        seasonValue !== SEASON_OFF_SEASON;

    // Get season-specific ranking data
    const {
        data: seasonRanking,
        isLoading: isLoadingSeasonRanking,
        error: seasonError,
    } = useQuery({
        queryKey: ["team-season-ranking", teamId, seasonValue],
        queryFn: () => getTeamSeasonRanking(teamId, parseInt(seasonValue)),
        enabled: !!teamId && shouldFetchSeasonRanking && !isLoadingSeason,
    });

    // Merge team data with season ranking (if available)
    const mergedTeam = team
        ? {
              ...team,
              // Override with season data if available, otherwise keep all-time data
              mmr: shouldFetchSeasonRanking
                  ? (seasonRanking?.mmr ?? 1000)
                  : team.mmr,
              wins: shouldFetchSeasonRanking
                  ? (seasonRanking?.wins ?? 0)
                  : team.wins,
              losses: shouldFetchSeasonRanking
                  ? (seasonRanking?.losses ?? 0)
                  : team.losses,
              bounty_claimed: shouldFetchSeasonRanking
                  ? (seasonRanking?.bounty_claimed ?? 0)
                  : 0,
              // Keep track of which source we're using
              isSeasonData: shouldFetchSeasonRanking && !!seasonRanking,
          }
        : null;

    const isLoading =
        isLoadingTeam ||
        isLoadingSeason ||
        (shouldFetchSeasonRanking && isLoadingSeasonRanking);

    return {
        team: mergedTeam,
        isLoading,
        error: teamError || seasonError,
    };
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

/**
 * Hook to get a team's rank within the kicker
 * Rank is based on position in MMR-sorted active teams list
 * Considers season data when a season is active
 */
export function useTeamRank(teamId) {
    const { teams, isLoading, error } = useActiveTeams();

    // Find the team's position (1-indexed rank)
    // Data is now normalized, so we can just use id
    const rank = teams.findIndex((team) => team.id === Number(teamId)) + 1;

    // rank will be 0 if not found (team is dissolved or not in active list)
    return {
        rank: rank > 0 ? rank : null,
        totalTeams: teams.length,
        isLoading,
        error,
    };
}
