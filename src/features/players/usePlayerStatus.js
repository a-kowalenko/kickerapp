import { useQuery } from "react-query";
import {
    getPlayerStatus,
    getPlayerStatusByGamemode,
    getPlayersStatuses,
    getPlayersWithBounties,
    getBountyLeaderboard,
    getPlayerBountyHistory,
    getHighestActiveStreaks,
    getLowestActiveStreaks,
    getStatusDefinitions,
    getStatusDisplayConfig,
} from "../../services/apiPlayerStatus";
import { useKickerInfo } from "../../hooks/useKickerInfo";

// ============== STATUS CHAINS & CATEGORIES ==============

/**
 * Status chain definitions - ordered from lowest to highest tier
 * Used to determine which status to show when multiple from same chain exist
 */
const STATUS_CHAINS = {
    winStreak: ["warmingUp", "hotStreak", "onFire", "legendary"],
    lossStreak: ["cold", "iceCold", "frozen"],
};

/**
 * Special statuses that can coexist with streak statuses
 * These take priority over streak statuses for display
 */
const SPECIAL_STATUSES = ["dominator", "giantSlayer", "comeback", "underdog"];

/**
 * Monthly/Event statuses (separate from streak chains)
 */
const MONTHLY_STATUSES = ["humiliated"];

/**
 * Get the highest status from a chain within a list of statuses
 * @param {string[]} statuses - List of asset keys
 * @param {string} chainName - 'winStreak' or 'lossStreak'
 * @returns {string|null} - Highest status in chain or null
 */
function getHighestInChain(statuses, chainName) {
    const chain = STATUS_CHAINS[chainName];
    if (!chain) return null;

    // Find highest status in this chain (chain is ordered low to high)
    for (let i = chain.length - 1; i >= 0; i--) {
        if (statuses.includes(chain[i])) {
            return chain[i];
        }
    }
    return null;
}

/**
 * Filter statuses to show only unique ones:
 * - Only highest from each chain (winStreak, lossStreak)
 * - All special statuses
 * - All monthly statuses
 * @param {string[]} statuses - List of asset keys
 * @returns {string[]} - Filtered unique statuses
 */
function getUniqueStatuses(statuses) {
    if (!statuses || statuses.length === 0) return [];

    const result = [];

    // Get highest win streak status
    const highestWin = getHighestInChain(statuses, "winStreak");
    if (highestWin) result.push(highestWin);

    // Get highest loss streak status
    const highestLoss = getHighestInChain(statuses, "lossStreak");
    if (highestLoss) result.push(highestLoss);

    // Add all special statuses
    for (const status of statuses) {
        if (
            SPECIAL_STATUSES.includes(status) ||
            MONTHLY_STATUSES.includes(status)
        ) {
            result.push(status);
        }
    }

    return result;
}

// ============== STATUS DEFINITIONS ==============

/**
 * Hook to get all status definitions
 */
export function useStatusDefinitions() {
    const { data, isLoading, error } = useQuery({
        queryKey: ["statusDefinitions"],
        queryFn: getStatusDefinitions,
        staleTime: 1000 * 60 * 60, // 1 hour - definitions rarely change
    });

    // Create a lookup map by key
    const statusMap = {};
    (data || []).forEach((status) => {
        statusMap[status.key] = status;
    });

    return { statusDefinitions: data, statusMap, isLoading, error };
}

// ============== PLAYER STATUS ==============

/**
 * Hook to get a single player's status across all gamemodes
 */
export function usePlayerStatus(playerId) {
    const { data, isLoading, error } = useQuery({
        queryKey: ["playerStatus", playerId],
        queryFn: () => getPlayerStatus(playerId),
        enabled: !!playerId,
        staleTime: 1000 * 30, // 30 seconds - status can change frequently
    });

    // Extract status by gamemode for easy access
    const status1on1 = data?.find((s) => s.gamemode === "1on1");
    const status2on2 = data?.find((s) => s.gamemode === "2on2");

    // Get the primary status effect (highest priority) across all gamemodes
    const primaryStatus = data?.reduce((highest, current) => {
        if (!highest) return current.primary_status;
        // If current has a status and highest doesn't, use current
        if (current.primary_status && !highest) return current.primary_status;
        return highest;
    }, null);

    return {
        statuses: data,
        status1on1,
        status2on2,
        primaryStatus,
        isLoading,
        error,
    };
}

/**
 * Hook to get a player's status for a specific gamemode
 */
export function usePlayerGamemodeStatus(playerId, gamemode) {
    const { data, isLoading, error } = useQuery({
        queryKey: ["playerStatus", playerId, gamemode],
        queryFn: () => getPlayerStatusByGamemode(playerId, gamemode),
        enabled: !!playerId && !!gamemode,
        staleTime: 1000 * 30,
    });

    return {
        status: data,
        currentStreak: data?.current_streak || 0,
        currentBounty: data?.current_bounty || 0,
        activeStatuses: data?.active_statuses || [],
        isLoading,
        error,
    };
}

/**
 * Hook to get multiple players' statuses at once (for match display)
 * Returns a map of playerId -> { gamemode -> status }
 */
export function usePlayersStatuses(playerIds, gamemode = null) {
    const { data, isLoading, error } = useQuery({
        queryKey: ["playersStatuses", playerIds?.sort()?.join(","), gamemode],
        queryFn: () => getPlayersStatuses(playerIds, gamemode),
        enabled: !!playerIds && playerIds.length > 0,
        staleTime: 1000 * 30,
    });

    return { statusMap: data || {}, isLoading, error };
}

// ============== BOUNTY SYSTEM ==============

/**
 * Hook to get players with active bounties (hunt targets)
 */
export function usePlayersWithBounties(gamemode = null, minBounty = 1) {
    const { data, isLoading, error } = useQuery({
        queryKey: ["playersWithBounties", gamemode, minBounty],
        queryFn: () => getPlayersWithBounties(gamemode, minBounty),
        staleTime: 1000 * 30,
    });

    return { players: data || [], isLoading, error };
}

/**
 * Hook to get bounty leaderboard (top bounty hunters)
 */
export function useBountyLeaderboard(limit = 10, month = null) {
    const { data, isLoading, error } = useQuery({
        queryKey: ["bountyLeaderboard", limit, month],
        queryFn: () => getBountyLeaderboard(limit, month),
        staleTime: 1000 * 60, // 1 minute
    });

    return { leaderboard: data || [], isLoading, error };
}

/**
 * Hook to get a player's bounty claim history
 */
export function usePlayerBountyHistory(playerId, limit = 20) {
    const { data, isLoading, error } = useQuery({
        queryKey: ["playerBountyHistory", playerId, limit],
        queryFn: () => getPlayerBountyHistory(playerId, limit),
        enabled: !!playerId,
    });

    return { bounties: data || [], isLoading, error };
}

// ============== STREAK STATISTICS ==============

/**
 * Hook to get highest active streaks (for titan status display)
 */
export function useHighestStreaks(gamemode = null, limit = 5) {
    const { data, isLoading, error } = useQuery({
        queryKey: ["highestStreaks", gamemode, limit],
        queryFn: () => getHighestActiveStreaks(gamemode, limit),
        staleTime: 1000 * 30,
    });

    return { streaks: data || [], isLoading, error };
}

/**
 * Hook to get lowest active streaks (coldest players)
 */
export function useLowestStreaks(gamemode = null, limit = 5) {
    const { data, isLoading, error } = useQuery({
        queryKey: ["lowestStreaks", gamemode, limit],
        queryFn: () => getLowestActiveStreaks(gamemode, limit),
        staleTime: 1000 * 30,
    });

    return { streaks: data || [], isLoading, error };
}

// ============== COMBINED STATUS HOOK ==============

/**
 * Default Status Display Configuration (fallback if DB config not loaded)
 *
 * Defines how statuses interact with each other:
 * - layer: Which visual layer the status occupies ('background', 'effect', 'overlay')
 *   - Only one status per layer will be shown
 *   - Multiple layers can be shown together
 * - priority: Higher = more important, wins within same layer
 * - exclusive: If true, no other statuses in same layer shown
 */
const DEFAULT_STATUS_DISPLAY_CONFIG = {
    // ============== STREAK STATUSES (effect layer) ==============
    legendary: { layer: "effect", priority: 100, exclusive: true },
    onFire: { layer: "effect", priority: 90, exclusive: true },
    hotStreak: { layer: "effect", priority: 80, exclusive: true },
    warmingUp: { layer: "effect", priority: 70, exclusive: true },

    // Loss streaks (also effect layer, mutually exclusive with win streaks)
    frozen: { layer: "effect", priority: 65, exclusive: true },
    iceCold: { layer: "effect", priority: 55, exclusive: true },
    cold: { layer: "effect", priority: 45, exclusive: true },

    // ============== EVENT STATUSES (overlay layer) ==============
    dominator: { layer: "overlay", priority: 85, exclusive: false },
    giantSlayer: { layer: "overlay", priority: 80, exclusive: false },
    comeback: { layer: "overlay", priority: 75, exclusive: false },
    underdog: { layer: "overlay", priority: 70, exclusive: false },

    // ============== MONTHLY STATUSES (background layer) ==============
    humiliated: { layer: "background", priority: 30, exclusive: false },
};

/**
 * Hook to get status display configuration from database
 * Falls back to default config if not available
 */
export function useStatusDisplayConfig() {
    const { data: kickerData } = useKickerInfo();
    const kickerId = kickerData?.id;

    const { data, isLoading, error } = useQuery({
        queryKey: ["statusDisplayConfig", kickerId],
        queryFn: () => getStatusDisplayConfig(kickerId),
        enabled: !!kickerId,
        staleTime: 1000 * 60 * 5, // 5 minutes - config rarely changes
    });

    // Transform DB config to the format used by filterDisplayableStatuses
    const configMap = {};

    if (data && data.length > 0) {
        data.forEach((item) => {
            if (item.is_enabled) {
                configMap[item.status_key] = {
                    layer: item.layer,
                    priority: item.priority,
                    exclusive: item.is_exclusive,
                };
            }
        });
    }

    // Use default config as fallback
    const finalConfig =
        Object.keys(configMap).length > 0
            ? configMap
            : DEFAULT_STATUS_DISPLAY_CONFIG;

    return {
        displayConfig: finalConfig,
        rawConfig: data,
        isLoading,
        error,
    };
}

/**
 * Determines which statuses should be displayed based on configuration
 * @param {string[]} allStatuses - All active status keys from both gamemodes
 * @param {Object} displayConfig - Configuration map (status_key -> {layer, priority, exclusive})
 * @returns {string[]} - Filtered array of status keys to display
 */
function filterDisplayableStatuses(allStatuses, displayConfig) {
    if (!allStatuses || allStatuses.length === 0) return [];

    // console.log("displayConfig", displayConfig);

    // Group statuses by layer
    const statusesWithConfig = allStatuses
        .map((key) => ({
            key,
            config: displayConfig[key] || {
                layer: "default",
                priority: 0,
                exclusive: false,
            },
        }))
        // Filter out disabled statuses (not in config)
        .filter((item) => displayConfig[item.key])
        .sort((a, b) => b.config.priority - a.config.priority);

    // Select statuses to display
    const selectedStatuses = [];
    const usedLayers = new Set();

    for (const { key, config } of statusesWithConfig) {
        // If layer already used by exclusive status, skip
        if (usedLayers.has(config.layer)) {
            continue;
        }

        // Add this status
        selectedStatuses.push(key);

        // If exclusive, mark layer as used
        if (config.exclusive) {
            usedLayers.add(config.layer);
        }
    }

    return selectedStatuses;
}

/**
 * Combined hook that provides everything needed for Avatar status display
 * Combines statuses from ALL gamemodes and filters based on display rules
 *
 * This is the main hook to use in components
 */
export function usePlayerStatusForAvatar(playerId) {
    const { statuses, isLoading: statusLoading } = usePlayerStatus(playerId);
    const { statusMap, isLoading: defsLoading } = useStatusDefinitions();
    const { displayConfig, isLoading: configLoading } =
        useStatusDisplayConfig();

    // Combine active statuses from ALL gamemodes (1on1 and 2on2)
    // Note: active_statuses from DB use snake_case keys (e.g., 'hot_streak')
    // but displayConfig uses camelCase asset_keys (e.g., 'hotStreak')
    const allActiveStatusKeys = []; // snake_case keys from DB
    const allActiveAssetKeys = []; // camelCase asset_keys for filtering
    const seenStatuses = new Set();

    for (const gamemodeStatus of statuses || []) {
        for (const statusKey of gamemodeStatus.active_statuses || []) {
            // Avoid duplicates (same status in both gamemodes)
            if (!seenStatuses.has(statusKey)) {
                seenStatuses.add(statusKey);
                allActiveStatusKeys.push(statusKey);
                // Convert to asset_key for filtering (displayConfig uses asset_keys)
                const assetKey = statusMap[statusKey]?.asset_key;
                if (assetKey) {
                    allActiveAssetKeys.push(assetKey);
                }
            }
        }
    }

    // Filter statuses based on display rules from DB config
    // Uses asset_keys (camelCase) to match displayConfig
    const displayableStatuses = filterDisplayableStatuses(
        allActiveAssetKeys,
        displayConfig
    );

    // displayableStatuses are already asset_keys, so use directly
    const statusAssets = displayableStatuses;

    // Calculate combined bounty from all gamemodes
    const totalBounty = (statuses || []).reduce(
        (sum, s) => sum + (s.current_bounty || 0),
        0
    );

    // Extract bounty per gamemode
    const bounty1on1 =
        statuses?.find((s) => s.gamemode === "1on1")?.current_bounty || 0;
    const bounty2on2 =
        statuses?.find((s) => s.gamemode === "2on2")?.current_bounty || 0;

    // Extract streak per gamemode
    const streak1on1 =
        statuses?.find((s) => s.gamemode === "1on1")?.current_streak || 0;
    const streak2on2 =
        statuses?.find((s) => s.gamemode === "2on2")?.current_streak || 0;

    // Get best streak (highest absolute value, win streak wins on tie)
    const bestStreakData = (statuses || []).reduce(
        (best, s) => {
            const streak = s.current_streak || 0;
            const absStreak = Math.abs(streak);
            const absBest = Math.abs(best.streak);

            // Higher absolute value wins
            if (absStreak > absBest) {
                return {
                    streak,
                    gamemode: s.gamemode,
                    statuses: s.active_statuses || [],
                };
            }
            // On tie, prefer win streak (positive)
            if (absStreak === absBest && streak > 0 && best.streak <= 0) {
                return {
                    streak,
                    gamemode: s.gamemode,
                    statuses: s.active_statuses || [],
                };
            }
            return best;
        },
        { streak: 0, gamemode: null, statuses: [] }
    );

    const bestStreak = bestStreakData.streak;

    // Extract statuses per gamemode (as asset_keys) for tooltip
    const statuses1on1 = (
        statuses?.find((s) => s.gamemode === "1on1")?.active_statuses || []
    )
        .map((key) => statusMap[key]?.asset_key)
        .filter(Boolean);
    const statuses2on2 = (
        statuses?.find((s) => s.gamemode === "2on2")?.active_statuses || []
    )
        .map((key) => statusMap[key]?.asset_key)
        .filter(Boolean);

    // Get unique statuses per gamemode (for tooltip display)
    const uniqueStatuses1on1 = getUniqueStatuses(statuses1on1);
    const uniqueStatuses2on2 = getUniqueStatuses(statuses2on2);

    // Determine primary status:
    // 1. First check for special statuses (dominator, giantSlayer, etc.) - they take priority
    // 2. Otherwise use the streak status from the gamemode with bestStreak
    let primaryStatusAsset = null;

    // Check for special statuses across all gamemodes
    const specialStatus = displayableStatuses.find((s) =>
        SPECIAL_STATUSES.includes(s)
    );

    if (specialStatus) {
        // Special status takes priority
        primaryStatusAsset = specialStatus;
    } else if (bestStreakData.gamemode) {
        // Use the streak status from the gamemode with the best streak
        const bestGamemodeAssetKeys = bestStreakData.statuses
            .map((key) => statusMap[key]?.asset_key)
            .filter(Boolean);

        // Get the appropriate chain based on streak direction
        if (bestStreak > 0) {
            primaryStatusAsset = getHighestInChain(
                bestGamemodeAssetKeys,
                "winStreak"
            );
        } else if (bestStreak < 0) {
            primaryStatusAsset = getHighestInChain(
                bestGamemodeAssetKeys,
                "lossStreak"
            );
        }
    }

    // Fallback to first displayable status if nothing found
    if (!primaryStatusAsset && displayableStatuses.length > 0) {
        primaryStatusAsset = displayableStatuses[0];
    }

    // Get the full status definition for the primary status
    const primaryStatusDef = primaryStatusAsset
        ? Object.values(statusMap).find(
              (def) => def.asset_key === primaryStatusAsset
          )
        : null;

    return {
        // All raw statuses by gamemode
        statuses,

        // Combined data
        allActiveStatuses: allActiveStatusKeys, // snake_case keys from DB
        displayableStatuses, // camelCase asset_keys after filtering
        totalBounty,
        bounty1on1,
        bounty2on2,
        bestStreak,
        streak1on1,
        streak2on2,

        // Status per gamemode (for tooltip)
        statuses1on1: uniqueStatuses1on1,
        statuses2on2: uniqueStatuses2on2,

        // For Avatar component - array of asset keys to display
        statusAssets,

        // Primary status (highest priority, linked to bestStreak)
        primaryStatusAsset,
        primaryStatusInfo: primaryStatusDef,

        isLoading: statusLoading || defsLoading || configLoading,
    };
}
