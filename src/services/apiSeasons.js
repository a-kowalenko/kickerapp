import { SEASONS, SEASON_RANKINGS } from "../utils/constants";
import supabase from "./supabase";

/**
 * Get all seasons for a kicker
 */
export async function getSeasons(kickerId) {
    const { data, error } = await supabase
        .from(SEASONS)
        .select("*")
        .eq("kicker_id", kickerId)
        .order("season_number", { ascending: false });

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

/**
 * Get a specific season by ID
 */
export async function getSeasonById(seasonId) {
    const { data, error } = await supabase
        .from(SEASONS)
        .select("*")
        .eq("id", seasonId)
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

/**
 * Get the current active season for a kicker
 */
export async function getCurrentSeason(kickerId) {
    const { data, error } = await supabase
        .from(SEASONS)
        .select("*")
        .eq("kicker_id", kickerId)
        .eq("is_active", true)
        .single();

    if (error && error.code !== "PGRST116") {
        // PGRST116 = no rows returned
        throw new Error(error.message);
    }

    return data || null;
}

/**
 * Create a new season for a kicker
 * Requires that no active season exists
 */
export async function createSeason({ kickerId, name }) {
    // Check if there's an active season
    const activeSeason = await getCurrentSeason(kickerId);
    if (activeSeason) {
        throw new Error(
            "Cannot create a new season while another season is active. Please end the current season first."
        );
    }

    // Get next season number
    const { data: nextNumData, error: nextNumError } = await supabase.rpc(
        "get_next_season_number",
        { p_kicker_id: kickerId }
    );

    if (nextNumError) {
        throw new Error(nextNumError.message);
    }

    const seasonNumber = nextNumData;
    const seasonName = name || `Season ${seasonNumber}`;

    // Create the new season
    const { data: newSeason, error: createError } = await supabase
        .from(SEASONS)
        .insert({
            kicker_id: kickerId,
            season_number: seasonNumber,
            name: seasonName,
            start_date: new Date().toISOString(),
            is_active: true,
        })
        .select()
        .single();

    if (createError) {
        throw new Error(createError.message);
    }

    // Update kicker's current_season_id
    const { error: updateKickerError } = await supabase
        .from("kicker")
        .update({ current_season_id: newSeason.id })
        .eq("id", kickerId);

    if (updateKickerError) {
        throw new Error(updateKickerError.message);
    }

    // Create season_rankings entries for all players in this kicker
    const { data: players, error: playersError } = await supabase
        .from("player")
        .select("id")
        .eq("kicker_id", kickerId);

    if (playersError) {
        throw new Error(playersError.message);
    }

    if (players && players.length > 0) {
        const rankingsEntries = players.map((player) => ({
            player_id: player.id,
            season_id: newSeason.id,
            wins: 0,
            losses: 0,
            mmr: 1000,
            wins2on2: 0,
            losses2on2: 0,
            mmr2on2: 1000,
        }));

        const { error: rankingsError } = await supabase
            .from(SEASON_RANKINGS)
            .insert(rankingsEntries);

        if (rankingsError) {
            throw new Error(rankingsError.message);
        }
    }

    return newSeason;
}

/**
 * End a season (set is_active to false and end_date to now)
 */
export async function endSeason(seasonId) {
    // Update the season
    const { data, error } = await supabase
        .from(SEASONS)
        .update({
            is_active: false,
            end_date: new Date().toISOString(),
        })
        .eq("id", seasonId)
        .select()
        .single();

    if (error) {
        throw new Error(error.message);
    }

    // Set kicker's current_season_id to null
    const { error: updateKickerError } = await supabase
        .from("kicker")
        .update({ current_season_id: null })
        .eq("id", data.kicker_id);

    if (updateKickerError) {
        throw new Error(updateKickerError.message);
    }

    return data;
}

/**
 * Get season rankings for a specific season
 */
export async function getSeasonRankings({ seasonId, kickerId }) {
    const { data, error } = await supabase.rpc("get_season_rankings", {
        p_kicker_id: kickerId,
        p_season_id: seasonId,
    });

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

/**
 * Create a season ranking entry for a player
 */
export async function createSeasonRanking({ playerId, seasonId }) {
    const { data, error } = await supabase
        .from(SEASON_RANKINGS)
        .insert({
            player_id: playerId,
            season_id: seasonId,
            wins: 0,
            losses: 0,
            mmr: 1000,
            wins2on2: 0,
            losses2on2: 0,
            mmr2on2: 1000,
        })
        .select()
        .single();

    if (error) {
        // Ignore duplicate entry errors
        if (error.code === "23505") {
            return null;
        }
        throw new Error(error.message);
    }

    return data;
}

/**
 * Update season ranking stats for a player
 */
export async function updateSeasonRanking({
    playerId,
    seasonId,
    wins,
    losses,
    mmr,
    wins2on2,
    losses2on2,
    mmr2on2,
}) {
    const updateData = {};
    if (wins !== undefined) updateData.wins = wins;
    if (losses !== undefined) updateData.losses = losses;
    if (mmr !== undefined) updateData.mmr = mmr;
    if (wins2on2 !== undefined) updateData.wins2on2 = wins2on2;
    if (losses2on2 !== undefined) updateData.losses2on2 = losses2on2;
    if (mmr2on2 !== undefined) updateData.mmr2on2 = mmr2on2;

    const { data, error } = await supabase
        .from(SEASON_RANKINGS)
        .update(updateData)
        .eq("player_id", playerId)
        .eq("season_id", seasonId)
        .select()
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

/**
 * Get a player's season ranking
 */
export async function getPlayerSeasonRanking({ playerId, seasonId }) {
    const { data, error } = await supabase
        .from(SEASON_RANKINGS)
        .select("*")
        .eq("player_id", playerId)
        .eq("season_id", seasonId)
        .single();

    if (error && error.code !== "PGRST116") {
        throw new Error(error.message);
    }

    return data || null;
}
