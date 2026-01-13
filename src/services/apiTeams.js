import imageCompression from "browser-image-compression";
import supabase, { databaseSchema } from "./supabase";

// Constants
const TEAMS_TABLE = "teams";
const TEAM_INVITATIONS_TABLE = "team_invitations";
const TEAM_LOGOS_BUCKET = "team-logos";

const COMPRESSION_OPTIONS = {
    maxSizeMB: 0.2, // Compress to ~200KB
    maxWidthOrHeight: 512,
    useWebWorker: true,
    fileType: "image/webp",
};

const ALLOWED_MIME_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
];

const MAX_FILE_SIZE_MB = 2;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

// ============================================================================
// TEAM CRUD OPERATIONS
// ============================================================================

/**
 * Create a new team with an invitation to the partner
 * @param {string} name - Team name
 * @param {number} partnerPlayerId - Partner's player ID
 * @param {number} kickerId - Kicker ID
 * @returns {Promise<{ success: boolean, team_id?: number, invitation_id?: number, error?: string }>}
 */
export async function createTeam(name, partnerPlayerId, kickerId) {
    const { data, error } = await supabase
        .schema(databaseSchema)
        .rpc("create_team_with_invitation", {
            p_name: name.trim(),
            p_partner_player_id: partnerPlayerId,
            p_kicker_id: kickerId,
        });

    if (error) {
        console.error("[Teams] Error creating team:", error);
        throw new Error(error.message || "Failed to create team");
    }

    return data;
}

/**
 * Get all teams for a kicker (with player details)
 * @param {number} kickerId - Kicker ID
 * @returns {Promise<Array>}
 */
export async function getTeamsByKicker(kickerId) {
    const { data, error } = await supabase
        .schema(databaseSchema)
        .rpc("get_teams_by_kicker", {
            p_kicker_id: kickerId,
        });

    if (error) {
        console.error("[Teams] Error fetching teams:", error);
        throw new Error(error.message || "Failed to fetch teams");
    }

    return data || [];
}

/**
 * Get active teams for a kicker (for leaderboard)
 * @param {number} kickerId - Kicker ID
 * @returns {Promise<Array>}
 */
export async function getActiveTeamsByKicker(kickerId) {
    const teams = await getTeamsByKicker(kickerId);
    return teams.filter((team) => team.status === "active");
}

/**
 * Get teams for a specific player (where player is member)
 * @param {number} playerId - Player ID
 * @param {number} kickerId - Kicker ID
 * @returns {Promise<Array>}
 */
export async function getTeamsByPlayer(playerId, kickerId) {
    const { data, error } = await supabase
        .schema(databaseSchema)
        .from(TEAMS_TABLE)
        .select(
            `
            *,
            player1:player!teams_player1_id_fkey(id, name, avatar),
            player2:player!teams_player2_id_fkey(id, name, avatar)
        `
        )
        .eq("kicker_id", kickerId)
        .or(`player1_id.eq.${playerId},player2_id.eq.${playerId}`)
        .order("mmr", { ascending: false });

    if (error) {
        console.error("[Teams] Error fetching player teams:", error);
        throw new Error(error.message || "Failed to fetch player teams");
    }

    return data || [];
}

/**
 * Get active teams for a specific player (for team selector in match creation)
 * @param {number} playerId - Player ID
 * @param {number} kickerId - Kicker ID
 * @returns {Promise<Array>}
 */
export async function getActiveTeamsByPlayer(playerId, kickerId) {
    const teams = await getTeamsByPlayer(playerId, kickerId);
    return teams.filter((team) => team.status === "active");
}

/**
 * Convert snake_case status keys to camelCase asset_keys
 * e.g., 'warming_up' -> 'warmingUp', 'hot_streak' -> 'hotStreak'
 */
function snakeToCamelCase(str) {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Get a single team by ID
 * @param {number} teamId - Team ID
 * @returns {Promise<Object>}
 */
export async function getTeamById(teamId) {
    const { data, error } = await supabase
        .schema(databaseSchema)
        .from(TEAMS_TABLE)
        .select(
            `
            *,
            player1:player!teams_player1_id_fkey(id, name, avatar, user_id),
            player2:player!teams_player2_id_fkey(id, name, avatar, user_id),
            team_status(current_streak, current_bounty, active_statuses)
        `
        )
        .eq("id", teamId)
        .single();

    if (error) {
        console.error("[Teams] Error fetching team:", error);
        throw new Error(error.message || "Failed to fetch team");
    }

    // Flatten team_status for easier access
    if (data && data.team_status) {
        // team_status is returned as array (due to 1:1 relation), take first element
        const status = Array.isArray(data.team_status)
            ? data.team_status[0]
            : data.team_status;
        data.current_streak = status?.current_streak || 0;
        data.current_bounty = status?.current_bounty || 0;
        // Convert snake_case status keys to camelCase for StatusBadge component
        const rawStatuses = status?.active_statuses || [];
        data.active_statuses = rawStatuses.map(snakeToCamelCase);
    } else {
        data.current_streak = 0;
        data.current_bounty = 0;
        data.active_statuses = [];
    }

    return data;
}

/**
 * Get team's season ranking data (MMR, wins, losses for a specific season)
 * @param {number} teamId - Team ID
 * @param {number} seasonId - Season ID
 * @returns {Promise<Object|null>} Season ranking data or null if not found
 */
export async function getTeamSeasonRanking(teamId, seasonId) {
    const { data, error } = await supabase
        .schema(databaseSchema)
        .from("team_season_rankings")
        .select("*")
        .eq("team_id", teamId)
        .eq("season_id", seasonId)
        .maybeSingle();

    if (error) {
        console.error("[Teams] Error fetching team season ranking:", error);
        return null;
    }

    return data;
}

/**
 * Update team details (name, logo)
 * @param {number} teamId - Team ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>}
 */
export async function updateTeam(teamId, updates) {
    const { data, error } = await supabase
        .schema(databaseSchema)
        .from(TEAMS_TABLE)
        .update(updates)
        .eq("id", teamId)
        .eq("status", "active") // Only allow updating active teams
        .select()
        .single();

    if (error) {
        console.error("[Teams] Error updating team:", error);
        throw new Error(error.message || "Failed to update team");
    }

    return data;
}

/**
 * Dissolve a team
 * @param {number} teamId - Team ID
 * @returns {Promise<{ success: boolean, team_name?: string, error?: string }>}
 */
export async function dissolveTeam(teamId) {
    const { data, error } = await supabase
        .schema(databaseSchema)
        .rpc("dissolve_team", {
            p_team_id: teamId,
        });

    if (error) {
        console.error("[Teams] Error dissolving team:", error);
        throw new Error(error.message || "Failed to dissolve team");
    }

    return data;
}

// ============================================================================
// TEAM INVITATIONS
// ============================================================================

/**
 * Get pending invitations for a player
 * @param {number} playerId - Player ID
 * @returns {Promise<Array>}
 */
export async function getPendingInvitations(playerId) {
    const { data, error } = await supabase
        .schema(databaseSchema)
        .rpc("get_pending_team_invitations", {
            p_player_id: playerId,
        });

    if (error) {
        console.error("[Teams] Error fetching invitations:", error);
        throw new Error(error.message || "Failed to fetch invitations");
    }

    return data || [];
}

/**
 * Accept a team invitation
 * @param {number} invitationId - Invitation ID
 * @returns {Promise<{ success: boolean, team_id?: number, team_name?: string, error?: string }>}
 */
export async function acceptInvitation(invitationId) {
    const { data, error } = await supabase
        .schema(databaseSchema)
        .rpc("accept_team_invitation", {
            p_invitation_id: invitationId,
        });

    if (error) {
        console.error("[Teams] Error accepting invitation:", error);
        throw new Error(error.message || "Failed to accept invitation");
    }

    return data;
}

/**
 * Decline a team invitation
 * @param {number} invitationId - Invitation ID
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
export async function declineInvitation(invitationId) {
    const { data, error } = await supabase
        .schema(databaseSchema)
        .rpc("decline_team_invitation", {
            p_invitation_id: invitationId,
        });

    if (error) {
        console.error("[Teams] Error declining invitation:", error);
        throw new Error(error.message || "Failed to decline invitation");
    }

    return data;
}

/**
 * Cancel a pending invitation (by the inviting player)
 * @param {number} invitationId - Invitation ID
 * @returns {Promise<void>}
 */
export async function cancelInvitation(invitationId) {
    // First get the team_id from the invitation
    const { data: invitation, error: fetchError } = await supabase
        .schema(databaseSchema)
        .from(TEAM_INVITATIONS_TABLE)
        .select("team_id")
        .eq("id", invitationId)
        .single();

    if (fetchError) {
        console.error("[Teams] Error fetching invitation:", fetchError);
        throw new Error(fetchError.message || "Failed to fetch invitation");
    }

    // Delete the invitation (RLS will verify the user is the inviting player)
    const { error: deleteInvError } = await supabase
        .schema(databaseSchema)
        .from(TEAM_INVITATIONS_TABLE)
        .delete()
        .eq("id", invitationId);

    if (deleteInvError) {
        console.error("[Teams] Error deleting invitation:", deleteInvError);
        throw new Error(
            deleteInvError.message || "Failed to cancel invitation"
        );
    }

    // Delete the pending team
    const { error: deleteTeamError } = await supabase
        .schema(databaseSchema)
        .from(TEAMS_TABLE)
        .delete()
        .eq("id", invitation.team_id)
        .eq("status", "pending");

    if (deleteTeamError) {
        console.error("[Teams] Error deleting pending team:", deleteTeamError);
        // Don't throw here, invitation was already deleted
    }
}

/**
 * Get sent invitations (invitations I created that are still pending)
 * @param {number} playerId - Player ID
 * @returns {Promise<Array>}
 */
export async function getSentInvitations(playerId) {
    const { data, error } = await supabase
        .schema(databaseSchema)
        .from(TEAM_INVITATIONS_TABLE)
        .select(
            `
            *,
            team:teams(id, name),
            invited_player:player!team_invitations_invited_player_id_fkey(id, name, avatar)
        `
        )
        .eq("inviting_player_id", playerId)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("[Teams] Error fetching sent invitations:", error);
        throw new Error(error.message || "Failed to fetch sent invitations");
    }

    return data || [];
}

// ============================================================================
// TEAM LOGO UPLOAD
// ============================================================================

/**
 * Validate team logo file
 * @param {File} file - The file to validate
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateLogoFile(file) {
    if (!file) {
        return { valid: false, error: "No file provided" };
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        return {
            valid: false,
            error: `Invalid file type. Allowed: ${ALLOWED_MIME_TYPES.map(
                (t) => t.split("/")[1]
            ).join(", ")}`,
        };
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
        return {
            valid: false,
            error: `File too large. Maximum size is ${MAX_FILE_SIZE_MB}MB`,
        };
    }

    return { valid: true };
}

/**
 * Compress team logo image
 * @param {File} file - The image file to compress
 * @returns {Promise<File>}
 */
export async function compressLogo(file) {
    // Skip compression for GIFs to preserve animation
    if (file.type === "image/gif") {
        return file;
    }

    try {
        const compressedFile = await imageCompression(
            file,
            COMPRESSION_OPTIONS
        );
        console.log(
            `[Teams] Compressed logo: ${(file.size / 1024).toFixed(1)}KB → ${(
                compressedFile.size / 1024
            ).toFixed(1)}KB`
        );
        return compressedFile;
    } catch (error) {
        console.error("[Teams] Logo compression error:", error);
        throw new Error("Failed to compress logo");
    }
}

/**
 * Upload team logo
 * @param {number} teamId - Team ID
 * @param {File} file - Logo file (already compressed)
 * @returns {Promise<string>} Public URL of the uploaded logo
 */
export async function uploadTeamLogo(teamId, file) {
    const timestamp = Date.now();
    const extension = file.type === "image/gif" ? "gif" : "webp";
    const filePath = `${teamId}/${timestamp}.${extension}`;

    const { data, error } = await supabase.storage
        .from(TEAM_LOGOS_BUCKET)
        .upload(filePath, file, {
            contentType: file.type === "image/gif" ? "image/gif" : "image/webp",
            cacheControl: "31536000", // 1 year cache
            upsert: true, // Allow overwriting
        });

    if (error) {
        console.error("[Teams] Logo upload error:", error);
        throw new Error(error.message || "Failed to upload logo");
    }

    // Get the public URL
    const {
        data: { publicUrl },
    } = supabase.storage.from(TEAM_LOGOS_BUCKET).getPublicUrl(data.path);

    // Update team with new logo URL
    await updateTeam(teamId, { logo_url: publicUrl });

    return publicUrl;
}

/**
 * Delete team logo
 * @param {number} teamId - Team ID
 * @param {string} logoUrl - Current logo URL
 * @returns {Promise<void>}
 */
export async function deleteTeamLogo(teamId, logoUrl) {
    if (!logoUrl) return;

    // Extract path from URL
    const urlParts = logoUrl.split(`${TEAM_LOGOS_BUCKET}/`);
    if (urlParts.length < 2) return;

    const path = urlParts[1];

    const { error } = await supabase.storage
        .from(TEAM_LOGOS_BUCKET)
        .remove([path]);

    if (error) {
        console.error("[Teams] Logo delete error:", error);
        // Don't throw, just log
    }

    // Update team to remove logo URL
    await updateTeam(teamId, { logo_url: null });
}

// ============================================================================
// TEAM MMR
// ============================================================================

/**
 * Update team MMR after a match (all-time stats)
 * @param {number} teamId - Team ID
 * @param {number} mmrChange - MMR change (positive or negative)
 * @param {boolean} won - Whether the team won
 * @returns {Promise<void>}
 */
export async function updateTeamMmr(teamId, mmrChange, won) {
    const { error } = await supabase
        .schema(databaseSchema)
        .rpc("update_team_mmr", {
            p_team_id: teamId,
            p_mmr_change: mmrChange,
            p_won: won,
        });

    if (error) {
        console.error("[Teams] Error updating team MMR:", error);
        throw new Error(error.message || "Failed to update team MMR");
    }
}

/**
 * Update team season ranking after a match
 * @param {number} teamId - Team ID
 * @param {number} seasonId - Season ID
 * @param {number} mmrChange - MMR change (positive or negative)
 * @param {boolean} won - Whether the team won
 * @returns {Promise<void>}
 */
export async function updateTeamSeasonRanking(
    teamId,
    seasonId,
    mmrChange,
    won
) {
    const { error } = await supabase
        .schema(databaseSchema)
        .rpc("update_team_season_ranking", {
            p_team_id: teamId,
            p_season_id: seasonId,
            p_mmr_change: mmrChange,
            p_won: won,
        });

    if (error) {
        console.error("[Teams] Error updating team season ranking:", error);
        throw new Error(
            error.message || "Failed to update team season ranking"
        );
    }
}

/**
 * Get team season rankings for a kicker/season (for leaderboard)
 * @param {number} kickerId - Kicker ID
 * @param {number} seasonId - Season ID
 * @returns {Promise<Array>}
 */
export async function getTeamSeasonRankings(kickerId, seasonId) {
    const { data, error } = await supabase
        .schema(databaseSchema)
        .rpc("get_team_season_rankings", {
            p_kicker_id: kickerId,
            p_season_id: seasonId,
        });

    if (error) {
        console.error("[Teams] Error fetching team season rankings:", error);
        throw new Error(
            error.message || "Failed to fetch team season rankings"
        );
    }

    return data || [];
}

/**
 * Update team season ranking after a match with bounty tracking
 * @param {number} teamId - Team ID
 * @param {number} seasonId - Season ID
 * @param {number} mmrChange - MMR change (positive or negative)
 * @param {boolean} won - Whether the team won
 * @param {number} bountyClaimed - Bounty claimed in this match
 * @returns {Promise<void>}
 */
export async function updateTeamSeasonRankingWithBounty(
    teamId,
    seasonId,
    mmrChange,
    won,
    bountyClaimed = 0
) {
    const { error } = await supabase
        .schema(databaseSchema)
        .rpc("update_team_season_ranking_with_bounty", {
            p_team_id: teamId,
            p_season_id: seasonId,
            p_mmr_change: mmrChange,
            p_won: won,
            p_bounty_claimed: bountyClaimed,
        });

    if (error) {
        console.error(
            "[Teams] Error updating team season ranking with bounty:",
            error
        );
        throw new Error(
            error.message || "Failed to update team season ranking"
        );
    }
}

/**
 * Get aggregated team stats for a player across all their teams
 * @param {number} playerId - Player ID
 * @param {number} seasonId - Season ID (optional, null for all-time)
 * @returns {Promise<{ wins: number, losses: number, bounty_claimed: number }>}
 */
export async function getPlayerTeamStats(playerId, seasonId = null) {
    const { data, error } = await supabase
        .schema(databaseSchema)
        .rpc("get_player_team_stats", {
            p_player_id: playerId,
            p_season_id: seasonId,
        });

    if (error) {
        console.error("[Teams] Error fetching player team stats:", error);
        throw new Error(error.message || "Failed to fetch player team stats");
    }

    return data?.[0] || { wins: 0, losses: 0, bounty_claimed: 0 };
}

// ============================================================================
// TEAM MATCH HISTORY
// ============================================================================

/**
 * Get matches for a specific team
 * @param {number} teamId - Team ID
 * @param {Object} options - Query options
 * @returns {Promise<Array>}
 */
export async function getTeamMatches(teamId, { page = 1, pageSize = 10 } = {}) {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await supabase
        .schema(databaseSchema)
        .from("matches")
        .select(
            `
            *,
            team1:teams!matches_team1_id_fkey(id, name, logo_url, mmr),
            team2:teams!matches_team2_id_fkey(id, name, logo_url, mmr),
            player1:player!matches_player1_fkey(id, name, avatar),
            player2:player!matches_player2_fkey(id, name, avatar),
            player3:player!matches_player3_fkey(id, name, avatar),
            player4:player!matches_player4_fkey(id, name, avatar)
        `,
            { count: "exact" }
        )
        .or(`team1_id.eq.${teamId},team2_id.eq.${teamId}`)
        .eq("status", "ended")
        .order("end_time", { ascending: false })
        .range(from, to);

    if (error) {
        console.error("[Teams] Error fetching team matches:", error);
        throw new Error(error.message || "Failed to fetch team matches");
    }

    return { data: data || [], count };
}

/**
 * Get team vs team head-to-head stats
 * @param {number} teamId - Team ID
 * @param {number} opponentTeamId - Opponent Team ID
 * @returns {Promise<{ wins: number, losses: number, draws: number }>}
 */
export async function getTeamVsTeamStats(teamId, opponentTeamId) {
    const { data, error } = await supabase
        .schema(databaseSchema)
        .from("matches")
        .select("scoreTeam1, scoreTeam2, team1_id, team2_id")
        .or(
            `and(team1_id.eq.${teamId},team2_id.eq.${opponentTeamId}),and(team1_id.eq.${opponentTeamId},team2_id.eq.${teamId})`
        )
        .eq("status", "ended");

    if (error) {
        console.error("[Teams] Error fetching head-to-head stats:", error);
        throw new Error(error.message || "Failed to fetch head-to-head stats");
    }

    let wins = 0;
    let losses = 0;

    (data || []).forEach((match) => {
        const isTeam1 = match.team1_id === teamId;
        const teamScore = isTeam1 ? match.scoreTeam1 : match.scoreTeam2;
        const opponentScore = isTeam1 ? match.scoreTeam2 : match.scoreTeam1;

        if (teamScore > opponentScore) wins++;
        else if (teamScore < opponentScore) losses++;
    });

    return { wins, losses, total: data?.length || 0 };
}

/**
 * Get team MMR history
 * @param {number} teamId - Team ID
 * @param {number} limit - Max number of records
 * @returns {Promise<Array>}
 */
export async function getTeamMmrHistory(teamId, limit = 50) {
    const { data, error } = await supabase
        .schema(databaseSchema)
        .rpc("get_team_mmr_history", {
            p_team_id: teamId,
            p_limit: limit,
        });

    if (error) {
        console.error("[Teams] Error fetching team MMR history:", error);
        throw new Error(error.message || "Failed to fetch team MMR history");
    }

    return data || [];
}

/**
 * Get opponent stats for a team (aggregated wins/losses against each opponent)
 * @param {number} teamId - Team ID
 * @returns {Promise<Array<{ teamId: number, teamName: string, wins: number, losses: number }>>}
 */
export async function getTeamOpponentStats(teamId) {
    // Ensure teamId is a number for comparison
    const numericTeamId = Number(teamId);

    // Fetch all matches for this team
    const { data, error } = await supabase
        .schema(databaseSchema)
        .from("matches")
        .select(
            `
            scoreTeam1,
            scoreTeam2,
            team1_id,
            team2_id,
            team1:teams!matches_team1_id_fkey(id, name),
            team2:teams!matches_team2_id_fkey(id, name)
        `
        )
        .or(`team1_id.eq.${teamId},team2_id.eq.${teamId}`)
        .eq("status", "ended");

    if (error) {
        console.error("[Teams] Error fetching opponent stats:", error);
        throw new Error(error.message || "Failed to fetch opponent stats");
    }

    // Aggregate stats by opponent
    const opponentMap = new Map();

    (data || []).forEach((match) => {
        const isTeam1 = match.team1_id === numericTeamId;
        const opponent = isTeam1 ? match.team2 : match.team1;
        const teamScore = isTeam1 ? match.scoreTeam1 : match.scoreTeam2;
        const opponentScore = isTeam1 ? match.scoreTeam2 : match.scoreTeam1;

        // Skip if opponent is missing or if opponent is the same team (self-match)
        if (!opponent?.id || opponent.id === numericTeamId) return;

        if (!opponentMap.has(opponent.id)) {
            opponentMap.set(opponent.id, {
                teamId: opponent.id,
                teamName: opponent.name,
                wins: 0,
                losses: 0,
            });
        }

        const stats = opponentMap.get(opponent.id);
        if (teamScore > opponentScore) {
            stats.wins++;
        } else if (teamScore < opponentScore) {
            stats.losses++;
        }
    });

    // Sort by total matches played, then by win rate
    return Array.from(opponentMap.values()).sort((a, b) => {
        const totalA = a.wins + a.losses;
        const totalB = b.wins + b.losses;
        if (totalB !== totalA) return totalB - totalA;
        const rateA = totalA > 0 ? a.wins / totalA : 0;
        const rateB = totalB > 0 ? b.wins / totalB : 0;
        return rateB - rateA;
    });
}
