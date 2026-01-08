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
