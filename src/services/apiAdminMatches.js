import supabase, { databaseSchema } from "./supabase";

// Table name
const MATCHES = "matches";

/**
 * Get all matches for admin management with optional filters
 */
export async function getAdminMatches({
    kickerId,
    playerId = null,
    status = null,
    gamemode = null,
    seasonId = null,
    limit = 100,
} = {}) {
    let query = supabase
        .schema(databaseSchema)
        .from(MATCHES)
        .select(
            `
            *,
            player1_data:player!matches_player1_fkey(id, name, avatar),
            player2_data:player!matches_player2_fkey(id, name, avatar),
            player3_data:player!matches_player3_fkey(id, name, avatar),
            player4_data:player!matches_player4_fkey(id, name, avatar),
            team1_data:teams!matches_team1_id_fkey(id, name),
            team2_data:teams!matches_team2_id_fkey(id, name)
        `
        )
        .eq("kicker_id", kickerId)
        .order("created_at", { ascending: false })
        .limit(limit);

    if (playerId) {
        query = query.or(
            `player1.eq.${playerId},player2.eq.${playerId},player3.eq.${playerId},player4.eq.${playerId}`
        );
    }

    if (status) {
        query = query.eq("status", status);
    }

    if (gamemode) {
        query = query.eq("gamemode", gamemode);
    }

    if (seasonId) {
        query = query.eq("season_id", seasonId);
    }

    const { data, error } = await query;

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

/**
 * Get a single match by ID
 */
export async function getAdminMatch(id) {
    const { data, error } = await supabase
        .schema(databaseSchema)
        .from(MATCHES)
        .select(
            `
            *,
            player1_data:player!matches_player1_fkey(id, name, avatar),
            player2_data:player!matches_player2_fkey(id, name, avatar),
            player3_data:player!matches_player3_fkey(id, name, avatar),
            player4_data:player!matches_player4_fkey(id, name, avatar),
            team1_data:teams!matches_team1_id_fkey(id, name),
            team2_data:teams!matches_team2_id_fkey(id, name)
        `
        )
        .eq("id", id)
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

/**
 * Update an existing match
 */
export async function updateAdminMatch({
    id,
    player1,
    player2,
    player3,
    player4,
    scoreTeam1,
    scoreTeam2,
    status,
    gamemode,
    seasonId,
    mmrChangeTeam1,
    mmrChangeTeam2,
    mmrPlayer1,
    mmrPlayer2,
    mmrPlayer3,
    mmrPlayer4,
    bountyTeam1,
    bountyTeam2,
    team1Id,
    team2Id,
    bountyTeam1Team,
    bountyTeam2Team,
    startTime,
    endTime,
}) {
    const updates = {};
    if (player1 !== undefined) updates.player1 = player1;
    if (player2 !== undefined) updates.player2 = player2;
    if (player3 !== undefined) updates.player3 = player3 || null;
    if (player4 !== undefined) updates.player4 = player4 || null;
    if (scoreTeam1 !== undefined) updates.scoreTeam1 = scoreTeam1;
    if (scoreTeam2 !== undefined) updates.scoreTeam2 = scoreTeam2;
    if (status !== undefined) updates.status = status;
    if (gamemode !== undefined) updates.gamemode = gamemode;
    if (seasonId !== undefined) updates.season_id = seasonId || null;
    if (mmrChangeTeam1 !== undefined) updates.mmrChangeTeam1 = mmrChangeTeam1;
    if (mmrChangeTeam2 !== undefined) updates.mmrChangeTeam2 = mmrChangeTeam2;
    if (mmrPlayer1 !== undefined) updates.mmrPlayer1 = mmrPlayer1;
    if (mmrPlayer2 !== undefined) updates.mmrPlayer2 = mmrPlayer2;
    if (mmrPlayer3 !== undefined) updates.mmrPlayer3 = mmrPlayer3;
    if (mmrPlayer4 !== undefined) updates.mmrPlayer4 = mmrPlayer4;
    if (bountyTeam1 !== undefined) updates.bounty_team1 = bountyTeam1;
    if (bountyTeam2 !== undefined) updates.bounty_team2 = bountyTeam2;
    if (team1Id !== undefined) updates.team1_id = team1Id || null;
    if (team2Id !== undefined) updates.team2_id = team2Id || null;
    if (bountyTeam1Team !== undefined)
        updates.bounty_team1_team = bountyTeam1Team;
    if (bountyTeam2Team !== undefined)
        updates.bounty_team2_team = bountyTeam2Team;
    if (startTime !== undefined) updates.start_time = startTime || null;
    if (endTime !== undefined) updates.end_time = endTime || null;

    const { data, error } = await supabase
        .schema(databaseSchema)
        .from(MATCHES)
        .update(updates)
        .eq("id", id)
        .select(
            `
            *,
            player1_data:player!matches_player1_fkey(id, name, avatar),
            player2_data:player!matches_player2_fkey(id, name, avatar),
            player3_data:player!matches_player3_fkey(id, name, avatar),
            player4_data:player!matches_player4_fkey(id, name, avatar)
        `
        )
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

/**
 * Delete a match
 */
export async function deleteAdminMatch(id) {
    const { error } = await supabase
        .schema(databaseSchema)
        .from(MATCHES)
        .delete()
        .eq("id", id);

    if (error) {
        throw new Error(error.message);
    }

    return true;
}
