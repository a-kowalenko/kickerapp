import supabase from "../../services/supabase";

/**
 * Upsert player presence - called periodically and on disconnect
 * Updates the last_seen timestamp for the player
 */
export async function upsertPlayerPresence(playerId, kickerId) {
    const { error } = await supabase.rpc("upsert_player_presence", {
        p_player_id: playerId,
        p_kicker_id: kickerId,
    });

    if (error) {
        console.error("Error upserting player presence:", error);
        throw error;
    }
}

/**
 * Get all players with their activity data for a kicker
 * Returns player info along with last_seen timestamp
 */
export async function getPlayersActivity(kickerId) {
    const { data, error } = await supabase.rpc("get_players_activity", {
        p_kicker_id: kickerId,
    });

    if (error) {
        console.error("Error fetching players activity:", error);
        throw error;
    }

    return data || [];
}
