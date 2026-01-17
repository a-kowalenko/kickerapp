import { useMemo, useCallback } from "react";
import { useQuery } from "react-query";
import { useKicker } from "../../contexts/KickerContext";
import { useMatchContext } from "../../contexts/MatchContext";
import { useOnlinePresenceContext } from "./OnlinePresenceContext";
import { getPlayersActivity } from "./apiPresence";
import {
    usePlayersStatuses,
    useStatusDefinitions,
} from "../players/usePlayerStatus";

// ============================================================================
// CONSTANTS
// ============================================================================

// Idle threshold: If lastActivityAt is older than this, player is considered idle
// This is RECEIVER-CALCULATED - each client determines idle status from the timestamp
const IDLE_THRESHOLD = 5 * 60 * 1000; // 5 minutes

// Inactive threshold: Players not seen for 60+ days are considered inactive
const SIXTY_DAYS_MS = 60 * 24 * 60 * 60 * 1000;

/**
 * Activity status enum
 */
export const ACTIVITY_STATUS = {
    ACTIVE: "active",
    IDLE: "idle",
    IN_MATCH: "in_match",
    OFFLINE: "offline",
    INACTIVE: "inactive",
};

/**
 * Hook to get all players grouped by their activity status.
 *
 * Key design principle: RECEIVER-CALCULATED IDLE STATUS
 * - The presence system only sends timestamps (onlineAt, lastActivityAt)
 * - This hook calculates whether a player is "idle" based on:
 *   Date.now() - lastActivityAt > IDLE_THRESHOLD (5 minutes)
 * - This eliminates synchronization bugs between sender/receiver status calculations
 *
 * @returns {Object} - { inMatch, online, offline, inactive, isLoading, isConnected, currentPlayerId }
 */
export function usePlayersActivity() {
    const { currentKicker: kicker } = useKicker();
    const { activeMatch } = useMatchContext();

    // Get presence data from context
    const presenceContext = useOnlinePresenceContext();
    const onlinePlayers = useMemo(
        () => presenceContext?.onlinePlayers || new Map(),
        [presenceContext?.onlinePlayers],
    );
    const isConnected = presenceContext?.isConnected || false;
    const currentPlayerId = presenceContext?.currentPlayerId;

    // BRIDGING CACHE: Recently-offline players with accurate timestamps
    // This provides accurate "last seen" before DB cache refreshes
    const recentOfflineActivity = useMemo(
        () => presenceContext?.recentOfflineActivity || new Map(),
        [presenceContext?.recentOfflineActivity],
    );

    // Fetch all players with their last_seen from database
    const { data: playersFromDb, isLoading: isLoadingDb } = useQuery({
        queryKey: ["playersActivity", kicker],
        queryFn: () => getPlayersActivity(kicker),
        enabled: !!kicker,
        staleTime: 1000 * 60, // 1 minute
        refetchInterval: 1000 * 60 * 5, // Refetch every 5 minutes
    });

    // Get all player IDs for status fetching
    const allPlayerIds = useMemo(() => {
        return (playersFromDb || []).map((p) => p.player_id);
    }, [playersFromDb]);

    // Fetch statuses for all players (for bounty/streak display)
    const { statusMap, isLoading: isLoadingStatuses } = usePlayersStatuses(
        allPlayerIds.length > 0 ? allPlayerIds : null,
    );

    // Fetch status definitions to compute primary_status from active_statuses
    const { statusMap: statusDefsMap, isLoading: isLoadingDefs } =
        useStatusDefinitions();

    /**
     * Helper to compute primary_status from active_statuses array
     * Returns the asset_key of the status with highest priority
     */
    const getPrimaryStatus = useCallback(
        (activeStatuses) => {
            if (!activeStatuses || activeStatuses.length === 0) return null;
            if (!statusDefsMap || Object.keys(statusDefsMap).length === 0)
                return null;

            let highestPriority = -Infinity;
            let primaryStatus = null;

            for (const statusKey of activeStatuses) {
                const statusDef = statusDefsMap[statusKey];
                if (statusDef && statusDef.priority > highestPriority) {
                    highestPriority = statusDef.priority;
                    primaryStatus = statusDef.asset_key;
                }
            }

            return primaryStatus;
        },
        [statusDefsMap],
    );

    // Get players in current active match (receiver-calculated from MatchContext)
    const playersInMatch = useMemo(() => {
        if (!activeMatch) return new Set();

        const matchPlayers = new Set();
        if (activeMatch.player1?.id) matchPlayers.add(activeMatch.player1.id);
        if (activeMatch.player2?.id) matchPlayers.add(activeMatch.player2.id);
        if (activeMatch.player3?.id) matchPlayers.add(activeMatch.player3.id);
        if (activeMatch.player4?.id) matchPlayers.add(activeMatch.player4.id);

        return matchPlayers;
    }, [activeMatch]);

    /**
     * Determine if a player is idle based on their lastActivityAt timestamp.
     * This is the core of receiver-calculated idle status.
     */
    const isPlayerIdle = useCallback((lastActivityAt) => {
        if (!lastActivityAt) return false;
        const timeSinceActivity = Date.now() - lastActivityAt;
        return timeSinceActivity > IDLE_THRESHOLD;
    }, []);

    // Categorize players into inMatch, online, offline, and inactive
    const { inMatch, online, offline, inactive } = useMemo(() => {
        if (!playersFromDb) {
            return { inMatch: [], online: [], offline: [], inactive: [] };
        }

        const now = Date.now();
        const sixtyDaysAgo = now - SIXTY_DAYS_MS;

        const inMatchList = [];
        const onlineList = [];
        const offlineList = [];
        const inactiveList = [];

        for (const player of playersFromDb) {
            const playerId = player.player_id;
            const presenceData = onlinePlayers.get(playerId);
            const isInMatch = playersInMatch.has(playerId);
            const isCurrentPlayer = playerId === currentPlayerId;

            // PRIORITY LOGIC FOR LAST_SEEN:
            // 1. Bridging cache (high priority - immediate accuracy)
            // 2. DB last_seen (low priority - eventually consistent)
            const recentOffline = recentOfflineActivity.get(playerId);
            const lastSeenFromBridgingCache = recentOffline?.lastActivityAt;
            const lastSeenFromDb = player.last_seen
                ? new Date(player.last_seen).getTime()
                : null;

            // Use bridging cache if available and more recent than DB
            const lastSeenTimestamp =
                lastSeenFromBridgingCache &&
                (!lastSeenFromDb || lastSeenFromBridgingCache > lastSeenFromDb)
                    ? lastSeenFromBridgingCache
                    : lastSeenFromDb;

            // Get player status data (bounty/streak)
            const playerStatuses = statusMap[playerId] || {};
            const status1on1 = playerStatuses["1on1"] || {};
            const status2on2 = playerStatuses["2on2"] || {};

            // Calculate combined bounty and best streak
            const bounty1on1 = status1on1.current_bounty || 0;
            const bounty2on2 = status2on2.current_bounty || 0;
            const totalBounty = bounty1on1 + bounty2on2;

            const streak1on1 = status1on1.current_streak || 0;
            const streak2on2 = status2on2.current_streak || 0;

            // Get best streak (highest absolute value, prefer positive)
            let bestStreak = 0;
            let bestStreakGamemode = null;
            if (Math.abs(streak1on1) >= Math.abs(streak2on2)) {
                bestStreak = streak1on1;
                bestStreakGamemode = "1on1";
            } else {
                bestStreak = streak2on2;
                bestStreakGamemode = "2on2";
            }

            // Get active statuses
            const statuses1on1 = status1on1.active_statuses || [];
            const statuses2on2 = status2on2.active_statuses || [];
            const primaryStatus =
                getPrimaryStatus(statuses1on1) ||
                getPrimaryStatus(statuses2on2);

            // Build enriched player object
            const enrichedPlayer = {
                player_id: playerId,
                player_name: player.player_name,
                player_avatar: player.player_avatar,
                last_seen: player.last_seen,
                // Use bridging cache for accurate last_seen_timestamp
                last_seen_timestamp: lastSeenTimestamp,
                // Status data
                bounty1on1,
                bounty2on2,
                totalBounty,
                streak: bestStreak,
                streak1on1,
                streak2on2,
                streakGamemode: bestStreakGamemode,
                statuses1on1,
                statuses2on2,
                primaryStatus,
                // Match info
                isInMatch,
                matchGamemode: isInMatch ? activeMatch?.gamemode : null,
            };

            // ================================================================
            // RECEIVER-CALCULATED ACTIVITY STATUS
            // Priority: IN_MATCH > IDLE > ACTIVE > OFFLINE > INACTIVE
            //
            // Special handling:
            // 1. Current player is ALWAYS online if isConnected (optimistic)
            // 2. Match participants are ALWAYS shown as IN_MATCH/ACTIVE
            // ================================================================

            // CASE 1: Player has presence data - they are connected
            if (presenceData) {
                const lastActivityAt = presenceData.last_activity_at;
                const idle = isPlayerIdle(lastActivityAt);

                if (isInMatch) {
                    enrichedPlayer.activityStatus = ACTIVITY_STATUS.IN_MATCH;
                    inMatchList.push(enrichedPlayer);
                } else if (idle) {
                    enrichedPlayer.activityStatus = ACTIVITY_STATUS.IDLE;
                    onlineList.push(enrichedPlayer);
                } else {
                    enrichedPlayer.activityStatus = ACTIVITY_STATUS.ACTIVE;
                    onlineList.push(enrichedPlayer);
                }
            }
            // CASE 2: Current player without presence data but connected (optimistic self)
            else if (isCurrentPlayer && isConnected) {
                if (isInMatch) {
                    enrichedPlayer.activityStatus = ACTIVITY_STATUS.IN_MATCH;
                    inMatchList.push(enrichedPlayer);
                } else {
                    enrichedPlayer.activityStatus = ACTIVITY_STATUS.ACTIVE;
                    onlineList.push(enrichedPlayer);
                }
            }
            // CASE 3: Player is in match but no presence data (force online for match participants)
            else if (isInMatch) {
                enrichedPlayer.activityStatus = ACTIVITY_STATUS.IN_MATCH;
                inMatchList.push(enrichedPlayer);
            }
            // CASE 4: Player is offline - check last_seen for inactive classification
            else {
                if (!lastSeenTimestamp || lastSeenTimestamp < sixtyDaysAgo) {
                    enrichedPlayer.activityStatus = ACTIVITY_STATUS.INACTIVE;
                    inactiveList.push(enrichedPlayer);
                } else {
                    enrichedPlayer.activityStatus = ACTIVITY_STATUS.OFFLINE;
                    offlineList.push(enrichedPlayer);
                }
            }
        }

        // Sort lists
        // In Match: Sort by name
        inMatchList.sort((a, b) => a.player_name.localeCompare(b.player_name));

        // Online: Active first, then idle, then by name
        onlineList.sort((a, b) => {
            if (
                a.activityStatus === ACTIVITY_STATUS.ACTIVE &&
                b.activityStatus === ACTIVITY_STATUS.IDLE
            )
                return -1;
            if (
                b.activityStatus === ACTIVITY_STATUS.ACTIVE &&
                a.activityStatus === ACTIVITY_STATUS.IDLE
            )
                return 1;
            return a.player_name.localeCompare(b.player_name);
        });

        // Offline: Sort by last_seen (most recent first) - use bridging cache timestamp
        offlineList.sort((a, b) => {
            const aTime = a.last_seen_timestamp || 0;
            const bTime = b.last_seen_timestamp || 0;
            return bTime - aTime;
        });

        // Inactive: Sort by name
        inactiveList.sort((a, b) => a.player_name.localeCompare(b.player_name));

        return {
            inMatch: inMatchList,
            online: onlineList,
            offline: offlineList,
            inactive: inactiveList,
        };
    }, [
        playersFromDb,
        onlinePlayers,
        recentOfflineActivity,
        playersInMatch,
        activeMatch,
        statusMap,
        getPrimaryStatus,
        isPlayerIdle,
        isConnected,
        currentPlayerId,
    ]);

    return {
        inMatch,
        online,
        offline,
        inactive,
        isLoading: isLoadingDb || isLoadingStatuses || isLoadingDefs,
        isConnected,
        currentPlayerId,
    };
}

export default usePlayersActivity;
