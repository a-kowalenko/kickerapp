import supabase, { databaseSchema } from "./supabase";

// Table names
const PLAYER_STATUS = "player_status";
const TEAM_STATUS = "team_status";

// ============== PLAYER STATUS ==============

/**
 * Get all player status records for admin management with optional filters
 */
export async function getAdminPlayerStatus({
    kickerId,
    playerId = null,
    gamemode = null,
} = {}) {
    let query = supabase
        .schema(databaseSchema)
        .from(PLAYER_STATUS)
        .select(
            `
            *,
            player:player!player_status_player_id_fkey(id, name, avatar, kicker_id)
        `
        )
        .order("updated_at", { ascending: false });

    if (playerId) {
        query = query.eq("player_id", playerId);
    }

    if (gamemode) {
        query = query.eq("gamemode", gamemode);
    }

    const { data, error } = await query;

    if (error) {
        throw new Error(error.message);
    }

    // Filter by kicker_id on the player relation
    return (
        data?.filter((status) => status.player?.kicker_id === kickerId) || []
    );
}

/**
 * Create a new player status record
 */
export async function createAdminPlayerStatus({
    playerId,
    gamemode,
    currentStreak = 0,
    currentBounty = 0,
    activeStatuses = [],
    lastMatchId = null,
}) {
    const { data, error } = await supabase
        .schema(databaseSchema)
        .from(PLAYER_STATUS)
        .insert({
            player_id: playerId,
            gamemode,
            current_streak: currentStreak,
            current_bounty: currentBounty,
            active_statuses: activeStatuses,
            last_match_id: lastMatchId || null,
            updated_at: new Date().toISOString(),
        })
        .select(
            `
            *,
            player:player!player_status_player_id_fkey(id, name, avatar),
            last_match:matches!player_status_last_match_id_fkey(id, nr)
        `
        )
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

/**
 * Update an existing player status record
 */
export async function updateAdminPlayerStatus({
    id,
    playerId,
    gamemode,
    currentStreak,
    currentBounty,
    activeStatuses,
    lastMatchId,
}) {
    const updates = {};
    if (playerId !== undefined) updates.player_id = playerId;
    if (gamemode !== undefined) updates.gamemode = gamemode;
    if (currentStreak !== undefined) updates.current_streak = currentStreak;
    if (currentBounty !== undefined) updates.current_bounty = currentBounty;
    if (activeStatuses !== undefined) updates.active_statuses = activeStatuses;
    if (lastMatchId !== undefined) updates.last_match_id = lastMatchId || null;
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
        .schema(databaseSchema)
        .from(PLAYER_STATUS)
        .update(updates)
        .eq("id", id)
        .select(
            `
            *,
            player:player!player_status_player_id_fkey(id, name, avatar),
            last_match:matches!player_status_last_match_id_fkey(id, nr)
        `
        )
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

/**
 * Delete a player status record
 */
export async function deleteAdminPlayerStatus(id) {
    const { error } = await supabase
        .schema(databaseSchema)
        .from(PLAYER_STATUS)
        .delete()
        .eq("id", id);

    if (error) {
        throw new Error(error.message);
    }
}

// ============== TEAM STATUS ==============

/**
 * Get all team status records for admin management with optional filters
 */
export async function getAdminTeamStatus({ kickerId, teamId = null } = {}) {
    let query = supabase
        .schema(databaseSchema)
        .from(TEAM_STATUS)
        .select(
            `
            *,
            team:teams!team_status_team_id_fkey(
                id, 
                name,
                kicker_id,
                player1:player!teams_player1_id_fkey(id, name, avatar),
                player2:player!teams_player2_id_fkey(id, name, avatar)
            )
        `
        )
        .order("updated_at", { ascending: false });

    if (teamId) {
        query = query.eq("team_id", teamId);
    }

    const { data, error } = await query;

    if (error) {
        throw new Error(error.message);
    }

    // Filter by kicker_id on the team relation
    return data?.filter((status) => status.team?.kicker_id === kickerId) || [];
}

/**
 * Create a new team status record
 */
export async function createAdminTeamStatus({
    teamId,
    currentStreak = 0,
    currentBounty = 0,
    activeStatuses = [],
    lastMatchId = null,
}) {
    const { data, error } = await supabase
        .schema(databaseSchema)
        .from(TEAM_STATUS)
        .insert({
            team_id: teamId,
            current_streak: currentStreak,
            current_bounty: currentBounty,
            active_statuses: activeStatuses,
            last_match_id: lastMatchId || null,
            updated_at: new Date().toISOString(),
        })
        .select(
            `
            *,
            team:teams!team_status_team_id_fkey(
                id, 
                name,
                player1:player!teams_player1_id_fkey(id, name, avatar),
                player2:player!teams_player2_id_fkey(id, name, avatar)
            ),
            last_match:matches!team_status_last_match_id_fkey(id, nr)
        `
        )
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

/**
 * Update an existing team status record
 */
export async function updateAdminTeamStatus({
    id,
    teamId,
    currentStreak,
    currentBounty,
    activeStatuses,
    lastMatchId,
}) {
    const updates = {};
    if (teamId !== undefined) updates.team_id = teamId;
    if (currentStreak !== undefined) updates.current_streak = currentStreak;
    if (currentBounty !== undefined) updates.current_bounty = currentBounty;
    if (activeStatuses !== undefined) updates.active_statuses = activeStatuses;
    if (lastMatchId !== undefined) updates.last_match_id = lastMatchId || null;
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
        .schema(databaseSchema)
        .from(TEAM_STATUS)
        .update(updates)
        .eq("id", id)
        .select(
            `
            *,
            team:teams!team_status_team_id_fkey(
                id, 
                name,
                player1:player!teams_player1_id_fkey(id, name, avatar),
                player2:player!teams_player2_id_fkey(id, name, avatar)
            ),
            last_match:matches!team_status_last_match_id_fkey(id, nr)
        `
        )
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

/**
 * Delete a team status record
 */
export async function deleteAdminTeamStatus(id) {
    const { error } = await supabase
        .schema(databaseSchema)
        .from(TEAM_STATUS)
        .delete()
        .eq("id", id);

    if (error) {
        throw new Error(error.message);
    }
}
