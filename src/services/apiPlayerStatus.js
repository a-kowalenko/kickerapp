import supabase from "./supabase";

// Table names
const STATUS_DEFINITIONS = "status_definitions";
const PLAYER_STATUS = "player_status";
const PLAYER_MONTHLY_STATUS = "player_monthly_status";
const BOUNTY_HISTORY = "bounty_history";

// ============== STATUS DEFINITIONS ==============

/**
 * Get all status definitions
 */
export async function getStatusDefinitions() {
    const { data, error } = await supabase
        .from(STATUS_DEFINITIONS)
        .select("*")
        .order("priority", { ascending: false });

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

/**
 * Get status definitions by type (streak, event, monthly, special)
 */
export async function getStatusDefinitionsByType(type) {
    const { data, error } = await supabase
        .from(STATUS_DEFINITIONS)
        .select("*")
        .eq("type", type)
        .order("priority", { ascending: false });

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

// ============== PLAYER STATUS ==============

/**
 * Get a player's current status for all gamemodes using RPC
 */
export async function getPlayerStatus(playerId) {
    const { data, error } = await supabase.rpc("get_player_status", {
        p_player_id: playerId,
    });

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

/**
 * Get a player's status for a specific gamemode
 */
export async function getPlayerStatusByGamemode(playerId, gamemode) {
    const { data, error } = await supabase
        .from(PLAYER_STATUS)
        .select("*")
        .eq("player_id", playerId)
        .eq("gamemode", gamemode)
        .maybeSingle();

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

/**
 * Get multiple players' statuses at once (for match display)
 */
export async function getPlayersStatuses(playerIds, gamemode = null) {
    let query = supabase
        .from(PLAYER_STATUS)
        .select("*")
        .in("player_id", playerIds);

    if (gamemode) {
        query = query.eq("gamemode", gamemode);
    }

    const { data, error } = await query;

    if (error) {
        throw new Error(error.message);
    }

    // Return as a map for easy lookup
    const statusMap = {};
    data.forEach((status) => {
        if (!statusMap[status.player_id]) {
            statusMap[status.player_id] = {};
        }
        statusMap[status.player_id][status.gamemode] = status;
    });

    return statusMap;
}

// ============== BOUNTY SYSTEM ==============

/**
 * Get players with active bounties (hunt targets)
 */
export async function getPlayersWithBounties(gamemode = null, minBounty = 1) {
    const { data, error } = await supabase.rpc("get_players_with_bounties", {
        p_gamemode: gamemode,
        p_min_bounty: minBounty,
    });

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

/**
 * Get bounty leaderboard (top bounty hunters)
 */
export async function getBountyLeaderboard(limit = 10, month = null) {
    const { data, error } = await supabase.rpc("get_bounty_leaderboard", {
        p_limit: limit,
        p_month: month,
    });

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

/**
 * Get a player's bounty history (bounties they've claimed)
 */
export async function getPlayerBountyHistory(playerId, limit = 20) {
    const { data, error } = await supabase
        .from(BOUNTY_HISTORY)
        .select(
            `
            *,
            victim:victim_id (id, name, avatar)
        `
        )
        .eq("claimer_id", playerId)
        .order("created_at", { ascending: false })
        .limit(limit);

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

/**
 * Get bounties claimed against a player (their bounty losses)
 */
export async function getPlayerBountyLosses(playerId, limit = 20) {
    const { data, error } = await supabase
        .from(BOUNTY_HISTORY)
        .select(
            `
            *,
            claimer:claimer_id (id, name, avatar)
        `
        )
        .eq("victim_id", playerId)
        .order("created_at", { ascending: false })
        .limit(limit);

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

// ============== MONTHLY STATUS ==============

/**
 * Get a player's monthly status events
 */
export async function getPlayerMonthlyStatus(playerId, month = null) {
    let query = supabase
        .from(PLAYER_MONTHLY_STATUS)
        .select("*")
        .eq("player_id", playerId);

    if (month) {
        query = query.eq("month", month);
    }

    query = query.order("month", { ascending: false });

    const { data, error } = await query;

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

/**
 * Get current month's monthly status for a player
 */
export async function getPlayerCurrentMonthStatus(playerId, gamemode = null) {
    const currentMonth = new Date().toISOString().slice(0, 7); // 'YYYY-MM' format

    let query = supabase
        .from(PLAYER_MONTHLY_STATUS)
        .select("*")
        .eq("player_id", playerId)
        .eq("month", currentMonth);

    if (gamemode) {
        query = query.eq("gamemode", gamemode);
    }

    const { data, error } = await query;

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

// ============== STREAK STATISTICS ==============

/**
 * Get highest active streaks across all players (for titan status tracking)
 */
export async function getHighestActiveStreaks(gamemode = null, limit = 5) {
    let query = supabase
        .from(PLAYER_STATUS)
        .select(
            `
            *,
            player:player_id (id, name, avatar)
        `
        )
        .gt("current_streak", 0)
        .order("current_streak", { ascending: false })
        .limit(limit);

    if (gamemode) {
        query = query.eq("gamemode", gamemode);
    }

    const { data, error } = await query;

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

/**
 * Get lowest active streaks (coldest players)
 */
export async function getLowestActiveStreaks(gamemode = null, limit = 5) {
    let query = supabase
        .from(PLAYER_STATUS)
        .select(
            `
            *,
            player:player_id (id, name, avatar)
        `
        )
        .lt("current_streak", 0)
        .order("current_streak", { ascending: true })
        .limit(limit);

    if (gamemode) {
        query = query.eq("gamemode", gamemode);
    }

    const { data, error } = await query;

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

// ============== STATUS DISPLAY CONFIG ==============

/**
 * Get status display configuration for the current kicker
 * @param {number} kickerId - The kicker ID
 * @returns {Promise<Array>} Array of status display config objects
 */
export async function getStatusDisplayConfig(kickerId) {
    const { data, error } = await supabase.rpc("get_status_display_config", {
        p_kicker_id: kickerId,
    });

    if (error) {
        throw new Error(error.message);
    }

    return data || [];
}
