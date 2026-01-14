import supabase, { databaseSchema } from "./supabase";

// Table names
const ACHIEVEMENT_CATEGORIES = "achievement_categories";
const ACHIEVEMENT_DEFINITIONS = "achievement_definitions";
const PLAYER_ACHIEVEMENT_PROGRESS = "player_achievement_progress";
const PLAYER_ACHIEVEMENTS = "player_achievements";

// ============== CATEGORIES ==============

export async function getAchievementCategories() {
    const { data, error } = await supabase
        .schema(databaseSchema)
        .from(ACHIEVEMENT_CATEGORIES)
        .select("*")
        .order("sort_order", { ascending: true });

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

export async function createAchievementCategory({
    key,
    name,
    description,
    icon,
    sortOrder,
}) {
    const { data, error } = await supabase
        .schema(databaseSchema)
        .from(ACHIEVEMENT_CATEGORIES)
        .insert({
            key,
            name,
            description,
            icon,
            sort_order: sortOrder,
        })
        .select()
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

export async function updateAchievementCategory(id, updates) {
    const { data, error } = await supabase
        .schema(databaseSchema)
        .from(ACHIEVEMENT_CATEGORIES)
        .update({
            ...(updates.key && { key: updates.key }),
            ...(updates.name && { name: updates.name }),
            ...(updates.description !== undefined && {
                description: updates.description,
            }),
            ...(updates.icon !== undefined && { icon: updates.icon }),
            ...(updates.sortOrder !== undefined && {
                sort_order: updates.sortOrder,
            }),
        })
        .eq("id", id)
        .select()
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

export async function deleteAchievementCategory(id) {
    const { error } = await supabase
        .schema(databaseSchema)
        .from(ACHIEVEMENT_CATEGORIES)
        .delete()
        .eq("id", id);

    if (error) {
        throw new Error(error.message);
    }
}

// ============== DEFINITIONS ==============

export async function getAchievementDefinitions(seasonId = null) {
    let query = supabase
        .schema(databaseSchema)
        .from(ACHIEVEMENT_DEFINITIONS)
        .select(
            `
            *,
            category:${ACHIEVEMENT_CATEGORIES}(*)
        `
        )
        .order("sort_order", { ascending: true });

    if (seasonId) {
        query = query.or(`season_id.eq.${seasonId},season_id.is.null`);
    }

    const { data, error } = await query;

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

export async function getAchievementDefinition(id) {
    const { data, error } = await supabase
        .schema(databaseSchema)
        .from(ACHIEVEMENT_DEFINITIONS)
        .select(
            `
            *,
            category:${ACHIEVEMENT_CATEGORIES}(*)
        `
        )
        .eq("id", id)
        .maybeSingle();

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

export async function createAchievementDefinition({
    key,
    name,
    description,
    categoryId,
    triggerEvent,
    condition,
    points,
    icon,
    isHidden,
    isRepeatable,
    maxProgress,
    seasonId,
    parentId,
    sortOrder,
}) {
    const { data, error } = await supabase
        .schema(databaseSchema)
        .from(ACHIEVEMENT_DEFINITIONS)
        .insert({
            key,
            name,
            description,
            category_id: categoryId,
            trigger_event: triggerEvent,
            condition: condition || {},
            points: points || 10,
            icon,
            is_hidden: isHidden || false,
            is_repeatable: isRepeatable || false,
            max_progress: maxProgress || 1,
            season_id: seasonId || null,
            parent_id: parentId || null,
            sort_order: sortOrder || 0,
        })
        .select(
            `
            *,
            category:${ACHIEVEMENT_CATEGORIES}(*)
        `
        )
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

export async function updateAchievementDefinition(id, updates) {
    const updateData = {};

    if (updates.key !== undefined) updateData.key = updates.key;
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined)
        updateData.description = updates.description;
    if (updates.categoryId !== undefined)
        updateData.category_id = updates.categoryId;
    if (updates.triggerEvent !== undefined)
        updateData.trigger_event = updates.triggerEvent;
    if (updates.condition !== undefined)
        updateData.condition = updates.condition;
    if (updates.points !== undefined) updateData.points = updates.points;
    if (updates.icon !== undefined) updateData.icon = updates.icon;
    if (updates.isHidden !== undefined) updateData.is_hidden = updates.isHidden;
    if (updates.isRepeatable !== undefined)
        updateData.is_repeatable = updates.isRepeatable;
    if (updates.maxProgress !== undefined)
        updateData.max_progress = updates.maxProgress;
    if (updates.seasonId !== undefined) updateData.season_id = updates.seasonId;
    if (updates.parentId !== undefined) updateData.parent_id = updates.parentId;
    if (updates.sortOrder !== undefined)
        updateData.sort_order = updates.sortOrder;

    const { data, error } = await supabase
        .schema(databaseSchema)
        .from(ACHIEVEMENT_DEFINITIONS)
        .update(updateData)
        .eq("id", id)
        .select(
            `
            *,
            category:${ACHIEVEMENT_CATEGORIES}(*)
        `
        )
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

export async function deleteAchievementDefinition(id) {
    const { error } = await supabase
        .schema(databaseSchema)
        .from(ACHIEVEMENT_DEFINITIONS)
        .delete()
        .eq("id", id);

    if (error) {
        throw new Error(error.message);
    }
}

// ============== PLAYER PROGRESS ==============

export async function getPlayerProgress(playerId, seasonId = null) {
    // Get progress for both season-specific (with season_id) and global (null season_id)
    let query = supabase
        .schema(databaseSchema)
        .from(PLAYER_ACHIEVEMENT_PROGRESS)
        .select("*")
        .eq("player_id", playerId);

    // For season-specific progress, get records matching the season OR null (global)
    if (seasonId) {
        query = query.or(`season_id.eq.${seasonId},season_id.is.null`);
    }

    const { data, error } = await query;

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

// ============== PLAYER ACHIEVEMENTS ==============

export async function getPlayerAchievements(playerId, seasonId = null) {
    let query = supabase
        .schema(databaseSchema)
        .from(PLAYER_ACHIEVEMENTS)
        .select(
            `
            *,
            achievement:${ACHIEVEMENT_DEFINITIONS}(
                *,
                category:${ACHIEVEMENT_CATEGORIES}(*)
            )
        `
        )
        .eq("player_id", playerId)
        .order("unlocked_at", { ascending: false });

    if (seasonId) {
        query = query.or(`season_id.eq.${seasonId},season_id.is.null`);
    }

    const { data, error } = await query;

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

export async function getPlayerAchievementsSummary(playerId) {
    const { data, error } = await supabase
        .schema(databaseSchema)
        .from(PLAYER_ACHIEVEMENTS)
        .select(
            `
            id,
            achievement:${ACHIEVEMENT_DEFINITIONS}(points)
        `
        )
        .eq("player_id", playerId);

    if (error) {
        throw new Error(error.message);
    }

    const totalPoints = data.reduce(
        (sum, pa) => sum + (pa.achievement?.points || 0),
        0
    );
    const totalUnlocked = data.length;

    return { totalPoints, totalUnlocked };
}

// ============== COMBINED QUERIES ==============

export async function getAchievementsWithProgress(playerId, seasonId = null) {
    // Get all definitions (global - no kicker_id filter)
    const definitions = await getAchievementDefinitions(seasonId);

    // Get player's progress (season-specific and global)
    const progress = await getPlayerProgress(playerId, seasonId);

    // Get player's unlocked achievements
    const unlocked = await getPlayerAchievements(playerId, seasonId);

    // Create lookup maps
    // For progress, prefer season-specific progress over global for the same achievement
    const progressMap = new Map();
    for (const p of progress) {
        const key = p.achievement_id;
        const existing = progressMap.get(key);
        // If no existing entry, or this entry is for the current season (more specific), use it
        if (
            !existing ||
            (p.season_id === seasonId && existing.season_id !== seasonId)
        ) {
            progressMap.set(key, p.current_progress);
        } else if (!existing) {
            progressMap.set(key, p.current_progress);
        }
    }

    const unlockedMap = new Map(unlocked.map((u) => [u.achievement_id, u]));

    // Build chain information - find which achievements have children
    const hasChildrenSet = new Set(
        definitions.filter((d) => d.parent_id).map((d) => d.parent_id)
    );

    // Combine data
    const achievementsWithProgress = definitions.map((def) => {
        const isUnlocked = unlockedMap.has(def.id);
        const unlockedData = unlockedMap.get(def.id);
        const currentProgress = progressMap.get(def.id) || 0;

        // Check if parent is unlocked (for chain logic)
        const parentUnlocked = def.parent_id
            ? unlockedMap.has(def.parent_id)
            : true;

        // Achievement is available if no parent OR parent is unlocked
        const isAvailable = parentUnlocked;

        // Has children (is part of a chain)
        const hasChildren = hasChildrenSet.has(def.id);

        return {
            ...def,
            currentProgress,
            isUnlocked,
            unlockedAt: unlockedData?.unlocked_at || null,
            timesCompleted: unlockedData?.times_completed || 0,
            isAvailable,
            hasChildren,
            progressPercent:
                def.max_progress > 0
                    ? Math.min(100, (currentProgress / def.max_progress) * 100)
                    : 0,
        };
    });

    return achievementsWithProgress;
}

// Get the next achievement in a chain (for WoW-style display)
export async function getNextInChain(achievementId) {
    const { data, error } = await supabase
        .schema(databaseSchema)
        .from(ACHIEVEMENT_DEFINITIONS)
        .select(
            `
            *,
            category:${ACHIEVEMENT_CATEGORIES}(*)
        `
        )
        .eq("parent_id", achievementId)
        .single();

    if (error && error.code !== "PGRST116") {
        // PGRST116 = no rows returned
        throw new Error(error.message);
    }

    return data || null;
}

// ============== ACHIEVEMENT FEED ==============

const ACHIEVEMENT_FEED_PAGE_SIZE = 30;

/**
 * Get achievement feed for a kicker (all unlocked achievements by kicker players)
 * Grouped by match_id for display, filtered by current season
 */
export async function getKickerAchievementFeed(
    kickerId,
    seasonId,
    { offset = 0, limit = ACHIEVEMENT_FEED_PAGE_SIZE } = {}
) {
    // First, get the player IDs for this kicker
    const { data: kickerPlayers, error: playersError } = await supabase
        .schema(databaseSchema)
        .from("player")
        .select("id")
        .eq("kicker_id", kickerId);

    if (playersError) {
        throw new Error(playersError.message);
    }

    const playerIds = kickerPlayers?.map((p) => p.id) || [];

    if (playerIds.length === 0) {
        return [];
    }

    // Query player_achievements for these players
    let query = supabase
        .schema(databaseSchema)
        .from(PLAYER_ACHIEVEMENTS)
        .select(
            `
            id,
            unlocked_at,
            times_completed,
            season_id,
            match_id,
            player_id,
            achievement_id,
            player!player_achievements_player_id_fkey(
                id,
                name,
                avatar,
                kicker_id
            ),
            achievement:${ACHIEVEMENT_DEFINITIONS}!player_achievements_achievement_id_fkey(
                id,
                key,
                name,
                description,
                points,
                icon,
                category:${ACHIEVEMENT_CATEGORIES}(
                    id,
                    name,
                    icon
                )
            ),
            match:matches!player_achievements_match_id_fkey(
                id,
                nr,
                "scoreTeam1",
                "scoreTeam2",
                created_at
            )
        `
        )
        .in("player_id", playerIds)
        .order("unlocked_at", { ascending: false })
        .range(offset, offset + limit - 1);

    // Filter by season if provided
    if (seasonId) {
        query = query.eq("season_id", seasonId);
    }

    const { data, error } = await query;

    if (error) {
        throw new Error(error.message);
    }

    // If we have matches, fetch the match player names separately
    const matchIds = [
        ...new Set(data?.filter((d) => d.match_id).map((d) => d.match_id)),
    ];

    let matchPlayersMap = {};
    if (matchIds.length > 0) {
        const { data: matchesWithPlayers, error: matchError } = await supabase
            .schema(databaseSchema)
            .from("matches")
            .select(
                `
                id,
                player1:player(id, name),
                player2:player!matches_player2_fkey(id, name),
                player3:player!matches_player3_fkey(id, name),
                player4:player!matches_player4_fkey(id, name)
            `
            )
            .in("id", matchIds);

        if (!matchError && matchesWithPlayers) {
            matchPlayersMap = matchesWithPlayers.reduce((acc, m) => {
                acc[m.id] = {
                    player1: m.player1,
                    player2: m.player2,
                    player3: m.player3,
                    player4: m.player4,
                };
                return acc;
            }, {});
        }
    }

    // Merge match player data
    const enrichedData = data?.map((item) => ({
        ...item,
        match: item.match
            ? {
                  ...item.match,
                  ...matchPlayersMap[item.match_id],
              }
            : null,
    }));

    return enrichedData || [];
}

/**
 * Get a single achievement by ID (for realtime updates)
 */
export async function getPlayerAchievementById(achievementRecordId) {
    const { data, error } = await supabase
        .schema(databaseSchema)
        .from(PLAYER_ACHIEVEMENTS)
        .select(
            `
            id,
            unlocked_at,
            times_completed,
            season_id,
            match_id,
            player_id,
            achievement_id,
            player!player_achievements_player_id_fkey(
                id,
                name,
                avatar,
                kicker_id
            ),
            achievement:${ACHIEVEMENT_DEFINITIONS}!player_achievements_achievement_id_fkey(
                id,
                key,
                name,
                description,
                points,
                icon,
                category:${ACHIEVEMENT_CATEGORIES}(
                    id,
                    name,
                    icon
                )
            ),
            match:matches!player_achievements_match_id_fkey(
                id,
                nr,
                "scoreTeam1",
                "scoreTeam2",
                created_at
            )
        `
        )
        .eq("id", achievementRecordId)
        .single();

    if (error) {
        throw new Error(error.message);
    }

    // Fetch match player names if match exists
    if (data?.match_id) {
        const { data: matchWithPlayers } = await supabase
            .schema(databaseSchema)
            .from("matches")
            .select(
                `
                player1:player(id, name),
                player2:player!matches_player2_fkey(id, name),
                player3:player!matches_player3_fkey(id, name),
                player4:player!matches_player4_fkey(id, name)
            `
            )
            .eq("id", data.match_id)
            .single();

        if (matchWithPlayers) {
            data.match = {
                ...data.match,
                ...matchWithPlayers,
            };
        }
    }

    return data;
}

// ============== FEED STATISTICS ==============

/**
 * Get achievement feed statistics (counts for today, week, month, total)
 * This is a client-side implementation - for better performance,
 * use the RPC function get_achievement_feed_stats if available
 */
export async function getAchievementFeedStats(kickerId, seasonId = null) {
    const now = new Date();
    const startOfDay = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
    );
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);
    const startOfMonth = new Date(now);
    startOfMonth.setDate(now.getDate() - 30);

    // Build base query for kicker's players
    let baseQuery = supabase
        .schema(databaseSchema)
        .from(PLAYER_ACHIEVEMENTS)
        .select(
            `
            id,
            unlocked_at,
            player!player_achievements_player_id_fkey(kicker_id)
        `
        )
        .eq("player.kicker_id", kickerId);

    if (seasonId) {
        baseQuery = baseQuery.eq("season_id", seasonId);
    }

    const { data, error } = await baseQuery;

    if (error) {
        console.error("Error fetching achievement feed stats:", error);
        return {
            todayCount: 0,
            weekCount: 0,
            monthCount: 0,
            totalCount: 0,
        };
    }

    // Filter out achievements where player is null (not matching kicker)
    const achievements = (data || []).filter((a) => a.player !== null);

    // Calculate counts
    const todayCount = achievements.filter(
        (a) => new Date(a.unlocked_at) >= startOfDay
    ).length;

    const weekCount = achievements.filter(
        (a) => new Date(a.unlocked_at) >= startOfWeek
    ).length;

    const monthCount = achievements.filter(
        (a) => new Date(a.unlocked_at) >= startOfMonth
    ).length;

    const totalCount = achievements.length;

    return {
        todayCount,
        weekCount,
        monthCount,
        totalCount,
    };
}

/**
 * Get achievement leaderboard (top players by total achievement points)
 * This is a client-side implementation - for better performance,
 * use the RPC function get_achievement_leaderboard if available
 */
export async function getAchievementLeaderboard(
    kickerId,
    seasonId = null,
    limit = 5
) {
    let query = supabase
        .schema(databaseSchema)
        .from(PLAYER_ACHIEVEMENTS)
        .select(
            `
            player_id,
            achievement:${ACHIEVEMENT_DEFINITIONS}!player_achievements_achievement_id_fkey(
                points
            ),
            player!player_achievements_player_id_fkey(
                id,
                name,
                avatar,
                kicker_id
            )
        `
        )
        .eq("player.kicker_id", kickerId);

    if (seasonId) {
        query = query.eq("season_id", seasonId);
    }

    const { data, error } = await query;

    if (error) {
        console.error("Error fetching achievement leaderboard:", error);
        return [];
    }

    // Filter out achievements where player is null (not matching kicker)
    const achievements = (data || []).filter((a) => a.player !== null);

    // Sum points by player
    const playerPoints = achievements.reduce((acc, a) => {
        const playerId = a.player_id;
        if (!acc[playerId]) {
            acc[playerId] = {
                playerId,
                playerName: a.player?.name,
                avatar: a.player?.avatar,
                totalPoints: 0,
                count: 0,
            };
        }
        acc[playerId].totalPoints += a.achievement?.points || 0;
        acc[playerId].count++;
        return acc;
    }, {});

    // Sort by total points and return top N
    return Object.values(playerPoints)
        .sort((a, b) => b.totalPoints - a.totalPoints)
        .slice(0, limit);
}

// ============== ADMIN: PLAYER ACHIEVEMENTS ==============

/**
 * Get all player achievements for admin management with optional filters
 */
export async function getAdminPlayerAchievements({
    seasonId = null,
    playerId = null,
} = {}) {
    let query = supabase
        .schema(databaseSchema)
        .from(PLAYER_ACHIEVEMENTS)
        .select(
            `
            *,
            player:player!player_achievements_player_id_fkey(id, name, avatar),
            achievement:${ACHIEVEMENT_DEFINITIONS}!player_achievements_achievement_id_fkey(
                id,
                key,
                name,
                description,
                icon,
                points,
                category:${ACHIEVEMENT_CATEGORIES}(id, name, icon)
            ),
            season:seasons!player_achievements_season_id_fkey(id, name),
            match:matches!player_achievements_match_id_fkey(
                id, 
                nr, 
                scoreTeam1, 
                scoreTeam2,
                player1:player!matches_player1_fkey(id, name),
                player2:player!matches_player2_fkey(id, name),
                player3:player!matches_player3_fkey(id, name),
                player4:player!matches_player4_fkey(id, name)
            )
        `
        )
        .order("unlocked_at", { ascending: false });

    if (seasonId) {
        query = query.eq("season_id", seasonId);
    }

    if (playerId) {
        query = query.eq("player_id", playerId);
    }

    const { data, error } = await query;

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

/**
 * Create a new player achievement record
 */
export async function createAdminPlayerAchievement({
    playerId,
    achievementId,
    seasonId = null,
    matchId = null,
    timesCompleted = 1,
    unlockedAt = null,
}) {
    const { data, error } = await supabase
        .schema(databaseSchema)
        .from(PLAYER_ACHIEVEMENTS)
        .insert({
            player_id: playerId,
            achievement_id: achievementId,
            season_id: seasonId || null,
            match_id: matchId || null,
            times_completed: timesCompleted,
            unlocked_at: unlockedAt || new Date().toISOString(),
        })
        .select(
            `
            *,
            player:player!player_achievements_player_id_fkey(id, name, avatar),
            achievement:${ACHIEVEMENT_DEFINITIONS}!player_achievements_achievement_id_fkey(
                id,
                key,
                name,
                icon,
                points,
                category:${ACHIEVEMENT_CATEGORIES}(id, name, icon)
            ),
            season:seasons!player_achievements_season_id_fkey(id, name),
            match:matches!player_achievements_match_id_fkey(id, nr)
        `
        )
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

/**
 * Update a player achievement record
 */
export async function updateAdminPlayerAchievement(id, updates) {
    const updateData = {};

    if (updates.playerId !== undefined) updateData.player_id = updates.playerId;
    if (updates.achievementId !== undefined)
        updateData.achievement_id = updates.achievementId;
    if (updates.seasonId !== undefined)
        updateData.season_id = updates.seasonId || null;
    if (updates.matchId !== undefined)
        updateData.match_id = updates.matchId || null;
    if (updates.timesCompleted !== undefined)
        updateData.times_completed = updates.timesCompleted;
    if (updates.unlockedAt !== undefined)
        updateData.unlocked_at = updates.unlockedAt;

    const { data, error } = await supabase
        .schema(databaseSchema)
        .from(PLAYER_ACHIEVEMENTS)
        .update(updateData)
        .eq("id", id)
        .select(
            `
            *,
            player:player!player_achievements_player_id_fkey(id, name, avatar),
            achievement:${ACHIEVEMENT_DEFINITIONS}!player_achievements_achievement_id_fkey(
                id,
                key,
                name,
                icon,
                points,
                category:${ACHIEVEMENT_CATEGORIES}(id, name, icon)
            ),
            season:seasons!player_achievements_season_id_fkey(id, name),
            match:matches!player_achievements_match_id_fkey(id, nr)
        `
        )
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

/**
 * Delete a player achievement record
 */
export async function deleteAdminPlayerAchievement(id) {
    const { error } = await supabase
        .schema(databaseSchema)
        .from(PLAYER_ACHIEVEMENTS)
        .delete()
        .eq("id", id);

    if (error) {
        throw new Error(error.message);
    }
}

// ============== ADMIN: PLAYER ACHIEVEMENT PROGRESS ==============

/**
 * Get all player achievement progress for admin management with optional filters
 */
export async function getAdminPlayerProgress({
    seasonId = null,
    playerId = null,
} = {}) {
    let query = supabase
        .schema(databaseSchema)
        .from(PLAYER_ACHIEVEMENT_PROGRESS)
        .select(
            `
            *,
            player:player!player_achievement_progress_player_id_fkey(id, name, avatar),
            achievement:${ACHIEVEMENT_DEFINITIONS}!player_achievement_progress_achievement_id_fkey(
                id,
                key,
                name,
                description,
                icon,
                max_progress,
                category:${ACHIEVEMENT_CATEGORIES}(id, name, icon)
            ),
            season:seasons!player_achievement_progress_season_id_fkey(id, name)
        `
        )
        .order("updated_at", { ascending: false });

    if (seasonId) {
        query = query.eq("season_id", seasonId);
    }

    if (playerId) {
        query = query.eq("player_id", playerId);
    }

    const { data, error } = await query;

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

/**
 * Create a new player achievement progress record
 */
export async function createAdminPlayerProgress({
    playerId,
    achievementId,
    currentProgress = 0,
    seasonId = null,
}) {
    const { data, error } = await supabase
        .schema(databaseSchema)
        .from(PLAYER_ACHIEVEMENT_PROGRESS)
        .insert({
            player_id: playerId,
            achievement_id: achievementId,
            current_progress: currentProgress,
            season_id: seasonId || null,
            updated_at: new Date().toISOString(),
        })
        .select(
            `
            *,
            player:player!player_achievement_progress_player_id_fkey(id, name, avatar),
            achievement:${ACHIEVEMENT_DEFINITIONS}!player_achievement_progress_achievement_id_fkey(
                id,
                key,
                name,
                icon,
                max_progress,
                category:${ACHIEVEMENT_CATEGORIES}(id, name, icon)
            ),
            season:seasons!player_achievement_progress_season_id_fkey(id, name)
        `
        )
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

/**
 * Update a player achievement progress record
 */
export async function updateAdminPlayerProgress(id, updates) {
    const updateData = {
        updated_at: new Date().toISOString(),
    };

    if (updates.playerId !== undefined) updateData.player_id = updates.playerId;
    if (updates.achievementId !== undefined)
        updateData.achievement_id = updates.achievementId;
    if (updates.currentProgress !== undefined)
        updateData.current_progress = updates.currentProgress;
    if (updates.seasonId !== undefined)
        updateData.season_id = updates.seasonId || null;

    const { data, error } = await supabase
        .schema(databaseSchema)
        .from(PLAYER_ACHIEVEMENT_PROGRESS)
        .update(updateData)
        .eq("id", id)
        .select(
            `
            *,
            player:player!player_achievement_progress_player_id_fkey(id, name, avatar),
            achievement:${ACHIEVEMENT_DEFINITIONS}!player_achievement_progress_achievement_id_fkey(
                id,
                key,
                name,
                icon,
                max_progress,
                category:${ACHIEVEMENT_CATEGORIES}(id, name, icon)
            ),
            season:seasons!player_achievement_progress_season_id_fkey(id, name)
        `
        )
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

/**
 * Delete a player achievement progress record
 */
export async function deleteAdminPlayerProgress(id) {
    const { error } = await supabase
        .schema(databaseSchema)
        .from(PLAYER_ACHIEVEMENT_PROGRESS)
        .delete()
        .eq("id", id);

    if (error) {
        throw new Error(error.message);
    }
}
