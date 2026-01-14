import supabase, { databaseSchema } from "./supabase";

// Table names
const SEASON_RANKINGS = "season_rankings";
const TEAM_SEASON_RANKINGS = "team_season_rankings";

// ============== PLAYER SEASON RANKINGS ==============

/**
 * Get all player season rankings for admin management with optional filters
 */
export async function getAdminPlayerRankings({
    kickerId,
    playerId = null,
    seasonId = null,
} = {}) {
    let query = supabase
        .schema(databaseSchema)
        .from(SEASON_RANKINGS)
        .select(
            `
            *,
            player:player!season_rankings_player_id_fkey(id, name, avatar, kicker_id),
            season:seasons!season_rankings_season_id_fkey(id, name, season_number, is_active)
        `
        )
        .order("created_at", { ascending: false });

    if (playerId) {
        query = query.eq("player_id", playerId);
    }

    if (seasonId) {
        query = query.eq("season_id", seasonId);
    }

    const { data, error } = await query;

    if (error) {
        throw new Error(error.message);
    }

    // Filter by kicker_id on the player relation
    return (
        data?.filter((ranking) => ranking.player?.kicker_id === kickerId) || []
    );
}

/**
 * Create a new player season ranking
 */
export async function createAdminPlayerRanking({
    playerId,
    seasonId,
    wins = 0,
    losses = 0,
    mmr = 1000,
    wins2on2 = 0,
    losses2on2 = 0,
    mmr2on2 = 1000,
    bountyClaimed = 0,
    bountyClaimed2on2 = 0,
}) {
    const { data, error } = await supabase
        .schema(databaseSchema)
        .from(SEASON_RANKINGS)
        .insert({
            player_id: playerId,
            season_id: seasonId,
            wins,
            losses,
            mmr,
            wins2on2,
            losses2on2,
            mmr2on2,
            bounty_claimed: bountyClaimed,
            bounty_claimed_2on2: bountyClaimed2on2,
        })
        .select(
            `
            *,
            player:player!season_rankings_player_id_fkey(id, name, avatar),
            season:seasons!season_rankings_season_id_fkey(id, name, season_number, is_active)
        `
        )
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

/**
 * Update an existing player season ranking
 */
export async function updateAdminPlayerRanking({
    id,
    playerId,
    seasonId,
    wins,
    losses,
    mmr,
    wins2on2,
    losses2on2,
    mmr2on2,
    bountyClaimed,
    bountyClaimed2on2,
    seasonAnnouncementSeen,
}) {
    const updates = {};
    if (playerId !== undefined) updates.player_id = playerId;
    if (seasonId !== undefined) updates.season_id = seasonId;
    if (wins !== undefined) updates.wins = wins;
    if (losses !== undefined) updates.losses = losses;
    if (mmr !== undefined) updates.mmr = mmr;
    if (wins2on2 !== undefined) updates.wins2on2 = wins2on2;
    if (losses2on2 !== undefined) updates.losses2on2 = losses2on2;
    if (mmr2on2 !== undefined) updates.mmr2on2 = mmr2on2;
    if (bountyClaimed !== undefined) updates.bounty_claimed = bountyClaimed;
    if (bountyClaimed2on2 !== undefined)
        updates.bounty_claimed_2on2 = bountyClaimed2on2;
    if (seasonAnnouncementSeen !== undefined)
        updates.season_announcement_seen = seasonAnnouncementSeen;

    const { data, error } = await supabase
        .schema(databaseSchema)
        .from(SEASON_RANKINGS)
        .update(updates)
        .eq("id", id)
        .select(
            `
            *,
            player:player!season_rankings_player_id_fkey(id, name, avatar),
            season:seasons!season_rankings_season_id_fkey(id, name, season_number, is_active)
        `
        )
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

/**
 * Delete a player season ranking
 */
export async function deleteAdminPlayerRanking(id) {
    const { error } = await supabase
        .schema(databaseSchema)
        .from(SEASON_RANKINGS)
        .delete()
        .eq("id", id);

    if (error) {
        throw new Error(error.message);
    }

    return true;
}

// ============== TEAM SEASON RANKINGS ==============

/**
 * Get all team season rankings for admin management with optional filters
 */
export async function getAdminTeamRankings({
    kickerId,
    teamId = null,
    seasonId = null,
} = {}) {
    let query = supabase
        .schema(databaseSchema)
        .from(TEAM_SEASON_RANKINGS)
        .select(
            `
            *,
            team:teams!team_season_rankings_team_id_fkey(id, name, player1_id, player2_id, kicker_id),
            season:seasons!team_season_rankings_season_id_fkey(id, name, season_number, is_active)
        `
        )
        .order("created_at", { ascending: false });

    if (teamId) {
        query = query.eq("team_id", teamId);
    }

    if (seasonId) {
        query = query.eq("season_id", seasonId);
    }

    const { data, error } = await query;

    if (error) {
        throw new Error(error.message);
    }

    // Filter by kicker_id on the team relation
    return (
        data?.filter((ranking) => ranking.team?.kicker_id === kickerId) || []
    );
}

/**
 * Create a new team season ranking
 */
export async function createAdminTeamRanking({
    teamId,
    seasonId,
    wins = 0,
    losses = 0,
    mmr = 1000,
    bountyClaimed = 0,
}) {
    const { data, error } = await supabase
        .schema(databaseSchema)
        .from(TEAM_SEASON_RANKINGS)
        .insert({
            team_id: teamId,
            season_id: seasonId,
            wins,
            losses,
            mmr,
            bounty_claimed: bountyClaimed,
        })
        .select(
            `
            *,
            team:teams!team_season_rankings_team_id_fkey(id, name, player1_id, player2_id),
            season:seasons!team_season_rankings_season_id_fkey(id, name, season_number, is_active)
        `
        )
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

/**
 * Update an existing team season ranking
 */
export async function updateAdminTeamRanking({
    id,
    teamId,
    seasonId,
    wins,
    losses,
    mmr,
    bountyClaimed,
}) {
    const updates = {};
    if (teamId !== undefined) updates.team_id = teamId;
    if (seasonId !== undefined) updates.season_id = seasonId;
    if (wins !== undefined) updates.wins = wins;
    if (losses !== undefined) updates.losses = losses;
    if (mmr !== undefined) updates.mmr = mmr;
    if (bountyClaimed !== undefined) updates.bounty_claimed = bountyClaimed;

    const { data, error } = await supabase
        .schema(databaseSchema)
        .from(TEAM_SEASON_RANKINGS)
        .update(updates)
        .eq("id", id)
        .select(
            `
            *,
            team:teams!team_season_rankings_team_id_fkey(id, name, player1_id, player2_id),
            season:seasons!team_season_rankings_season_id_fkey(id, name, season_number, is_active)
        `
        )
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

/**
 * Delete a team season ranking
 */
export async function deleteAdminTeamRanking(id) {
    const { error } = await supabase
        .schema(databaseSchema)
        .from(TEAM_SEASON_RANKINGS)
        .delete()
        .eq("id", id);

    if (error) {
        throw new Error(error.message);
    }

    return true;
}
