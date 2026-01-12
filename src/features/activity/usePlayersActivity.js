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

// Constants
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

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
 * Hook to get all players grouped by their activity status
 * Combines real-time presence data with database fallback for offline players
 *
 * @returns {Object} - { online, offline, inactive, isLoading }
 * - online: Players currently online (active, idle, or in match)
 * - offline: Players offline for less than 30 days
 * - inactive: Players offline for more than 30 days
 * - isLoading: Loading state
 */
export function usePlayersActivity() {
    const { currentKicker: kicker } = useKicker();
    const { activeMatch } = useMatchContext();
    // Use context instead of hook directly - presence is tracked in OnlinePresenceProvider
    const presenceContext = useOnlinePresenceContext();
    const onlinePlayers = useMemo(
        () => presenceContext?.onlinePlayers || new Map(),
        [presenceContext?.onlinePlayers]
    );
    const isConnected = presenceContext?.isConnected || false;
    const currentPlayerId = presenceContext?.currentPlayerId;

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
        allPlayerIds.length > 0 ? allPlayerIds : null
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
        [statusDefsMap]
    );

    // Get players in current active match
    const playersInMatch = useMemo(() => {
        if (!activeMatch) return new Set();

        const matchPlayers = new Set();
        if (activeMatch.player1) matchPlayers.add(activeMatch.player1);
        if (activeMatch.player2) matchPlayers.add(activeMatch.player2);
        if (activeMatch.player3) matchPlayers.add(activeMatch.player3);
        if (activeMatch.player4) matchPlayers.add(activeMatch.player4);

        return matchPlayers;
    }, [activeMatch]);

    // Categorize players into online, offline, and inactive
    const { online, offline, inactive } = useMemo(() => {
        if (!playersFromDb) {
            return { online: [], offline: [], inactive: [] };
        }

        const now = Date.now();
        const thirtyDaysAgo = now - THIRTY_DAYS_MS;

        const onlineList = [];
        const offlineList = [];
        const inactiveList = [];

        for (const player of playersFromDb) {
            const playerId = player.player_id;
            const presenceData = onlinePlayers.get(playerId);
            const isInMatch = playersInMatch.has(playerId);
            const lastSeenDb = player.last_seen
                ? new Date(player.last_seen).getTime()
                : null;

            // Get player status data
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
            // Compute primary status from active_statuses array
            const primaryStatus =
                getPrimaryStatus(statuses1on1) ||
                getPrimaryStatus(statuses2on2);

            // Build enriched player object
            const enrichedPlayer = {
                player_id: playerId,
                player_name: player.player_name,
                player_avatar: player.player_avatar,
                last_seen: player.last_seen,
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

            // Determine activity status
            if (presenceData) {
                // Player has presence data - they are online
                const presenceStatus = presenceData.status;

                if (isInMatch) {
                    enrichedPlayer.activityStatus = ACTIVITY_STATUS.IN_MATCH;
                } else if (presenceStatus === "idle") {
                    enrichedPlayer.activityStatus = ACTIVITY_STATUS.IDLE;
                } else {
                    enrichedPlayer.activityStatus = ACTIVITY_STATUS.ACTIVE;
                }

                enrichedPlayer.presenceStatus = presenceStatus;
                onlineList.push(enrichedPlayer);
            } else if (isInMatch) {
                // Player is in match but no presence data (counts as online)
                enrichedPlayer.activityStatus = ACTIVITY_STATUS.IN_MATCH;
                onlineList.push(enrichedPlayer);
            } else {
                // Player is offline - check last_seen for inactive
                if (lastSeenDb && lastSeenDb < thirtyDaysAgo) {
                    enrichedPlayer.activityStatus = ACTIVITY_STATUS.INACTIVE;
                    inactiveList.push(enrichedPlayer);
                } else {
                    enrichedPlayer.activityStatus = ACTIVITY_STATUS.OFFLINE;
                    offlineList.push(enrichedPlayer);
                }
            }
        }

        // Sort lists
        // Online: Active first, then idle, then by name
        onlineList.sort((a, b) => {
            // In-match first
            if (
                a.activityStatus === ACTIVITY_STATUS.IN_MATCH &&
                b.activityStatus !== ACTIVITY_STATUS.IN_MATCH
            )
                return -1;
            if (
                b.activityStatus === ACTIVITY_STATUS.IN_MATCH &&
                a.activityStatus !== ACTIVITY_STATUS.IN_MATCH
            )
                return 1;
            // Active before idle
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
            // Then by name
            return a.player_name.localeCompare(b.player_name);
        });

        // Offline: Sort by last_seen (most recent first)
        offlineList.sort((a, b) => {
            const aTime = a.last_seen ? new Date(a.last_seen).getTime() : 0;
            const bTime = b.last_seen ? new Date(b.last_seen).getTime() : 0;
            return bTime - aTime;
        });

        // Inactive: Sort by name
        inactiveList.sort((a, b) => a.player_name.localeCompare(b.player_name));

        return {
            online: onlineList,
            offline: offlineList,
            inactive: inactiveList,
        };
    }, [
        playersFromDb,
        onlinePlayers,
        playersInMatch,
        activeMatch,
        statusMap,
        getPrimaryStatus,
    ]);

    return {
        online,
        offline,
        inactive,
        isLoading: isLoadingDb || isLoadingStatuses || isLoadingDefs,
        isConnected,
        currentPlayerId,
    };
}

export default usePlayersActivity;
