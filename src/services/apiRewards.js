import supabase from "./supabase";

// Table names
const REWARD_DEFINITIONS = "reward_definitions";
const PLAYER_SELECTED_REWARDS = "player_selected_rewards";

// ============== REWARD DEFINITIONS ==============

/**
 * Get all reward definitions
 */
export async function getRewardDefinitions() {
    const { data, error } = await supabase
        .from(REWARD_DEFINITIONS)
        .select("*")
        .order("type", { ascending: true })
        .order("sort_order", { ascending: true });

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

/**
 * Get reward definitions by type
 */
export async function getRewardDefinitionsByType(type) {
    const { data, error } = await supabase
        .from(REWARD_DEFINITIONS)
        .select("*")
        .eq("type", type)
        .order("sort_order", { ascending: true });

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

/**
 * Get reward definition by achievement key
 */
export async function getRewardByAchievementKey(achievementKey) {
    const { data, error } = await supabase
        .from(REWARD_DEFINITIONS)
        .select("*")
        .eq("achievement_key", achievementKey)
        .maybeSingle();

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

// ============== PLAYER REWARDS ==============

/**
 * Get a player's unlocked rewards using the RPC function
 */
export async function getPlayerUnlockedRewards(playerId) {
    const { data, error } = await supabase.rpc("get_player_unlocked_rewards", {
        p_player_id: playerId,
    });

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

/**
 * Get a player with their selected rewards using the RPC function
 */
export async function getPlayerWithRewards(playerId) {
    const { data, error } = await supabase.rpc("get_player_with_rewards", {
        p_player_id: playerId,
    });

    if (error) {
        throw new Error(error.message);
    }

    return data?.[0] || null;
}

/**
 * Update a player's selected reward
 * @param {number} playerId - The player's ID
 * @param {string} rewardType - 'title' or 'frame'
 * @param {number|null} rewardId - The reward ID, or null to clear selection
 */
export async function updatePlayerSelectedReward(
    playerId,
    rewardType,
    rewardId
) {
    const { data, error } = await supabase.rpc(
        "update_player_selected_reward",
        {
            p_player_id: playerId,
            p_reward_type: rewardType,
            p_reward_id: rewardId,
        }
    );

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

/**
 * Get a player's currently selected rewards (directly from table)
 */
export async function getPlayerSelectedRewards(playerId) {
    const { data, error } = await supabase
        .from(PLAYER_SELECTED_REWARDS)
        .select(
            `
            *,
            reward:reward_definitions(*)
        `
        )
        .eq("player_id", playerId);

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

/**
 * Get multiple players with their selected rewards (for batch loading)
 * Returns a map of playerId -> rewards
 */
export async function getPlayersWithRewards(playerIds) {
    if (!playerIds || playerIds.length === 0) {
        return {};
    }

    const { data, error } = await supabase
        .from(PLAYER_SELECTED_REWARDS)
        .select(
            `
            player_id,
            reward_type,
            reward:reward_definitions(
                id,
                key,
                name,
                type,
                display_position,
                display_value,
                icon
            )
        `
        )
        .in("player_id", playerIds);

    if (error) {
        throw new Error(error.message);
    }

    // Transform to a map keyed by player_id
    const rewardsMap = {};
    for (const row of data || []) {
        if (!rewardsMap[row.player_id]) {
            rewardsMap[row.player_id] = {
                title: null,
                frame: null,
            };
        }
        if (row.reward_type === "title" && row.reward) {
            rewardsMap[row.player_id].title = row.reward;
        }
        if (row.reward_type === "frame" && row.reward) {
            rewardsMap[row.player_id].frame = row.reward;
        }
    }

    return rewardsMap;
}

// ============== ADMIN: REWARD CRUD ==============

/**
 * Create a new reward definition
 */
export async function createRewardDefinition(rewardData) {
    const { data, error } = await supabase
        .from(REWARD_DEFINITIONS)
        .insert({
            key: rewardData.key,
            name: rewardData.name,
            description: rewardData.description || null,
            type: rewardData.type,
            display_position: rewardData.displayPosition || null,
            display_value: rewardData.displayValue,
            achievement_key: rewardData.achievementKey || null,
            icon: rewardData.icon || null,
            sort_order: rewardData.sortOrder || 0,
        })
        .select()
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

/**
 * Update an existing reward definition
 */
export async function updateRewardDefinition(id, rewardData) {
    const { data, error } = await supabase
        .from(REWARD_DEFINITIONS)
        .update({
            key: rewardData.key,
            name: rewardData.name,
            description: rewardData.description || null,
            type: rewardData.type,
            display_position: rewardData.displayPosition || null,
            display_value: rewardData.displayValue,
            achievement_key: rewardData.achievementKey || null,
            icon: rewardData.icon || null,
            sort_order: rewardData.sortOrder || 0,
            updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

/**
 * Delete a reward definition
 */
export async function deleteRewardDefinition(id) {
    const { error } = await supabase
        .from(REWARD_DEFINITIONS)
        .delete()
        .eq("id", id);

    if (error) {
        throw new Error(error.message);
    }

    return true;
}
