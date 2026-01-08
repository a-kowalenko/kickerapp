import { useInfiniteQuery, useQueryClient } from "react-query";
import { useCallback, useEffect, useMemo } from "react";
import {
    getKickerAchievementFeed,
    getPlayerAchievementById,
} from "../../services/apiAchievements";
import { useKicker } from "../../contexts/KickerContext";
import { useCurrentSeason } from "../seasons/useCurrentSeason";
import supabase, { databaseSchema } from "../../services/supabase";

const ACHIEVEMENT_FEED = "achievement_feed";
const PLAYER_ACHIEVEMENTS_TABLE = "player_achievements";
const PAGE_SIZE = 30;

/**
 * Groups achievements by match_id, then by player_id within each match
 * Returns array sorted by most recent unlocked_at
 */
function groupAchievementsByMatch(achievements) {
    if (!achievements?.length) return [];

    // First, group by match_id (null for non-match achievements)
    const matchGroups = new Map();

    for (const achievement of achievements) {
        const matchKey = achievement.match_id || `no-match-${achievement.id}`;

        if (!matchGroups.has(matchKey)) {
            matchGroups.set(matchKey, {
                matchId: achievement.match_id,
                match: achievement.match,
                latestUnlockedAt: achievement.unlocked_at,
                players: new Map(),
            });
        }

        const group = matchGroups.get(matchKey);

        // Update latest timestamp for sorting
        if (
            new Date(achievement.unlocked_at) > new Date(group.latestUnlockedAt)
        ) {
            group.latestUnlockedAt = achievement.unlocked_at;
        }

        // Group by player within the match
        const playerId = achievement.player?.id;
        if (!playerId) continue;

        if (!group.players.has(playerId)) {
            group.players.set(playerId, {
                player: achievement.player,
                achievements: [],
                latestUnlockedAt: achievement.unlocked_at,
            });
        }

        const playerGroup = group.players.get(playerId);
        playerGroup.achievements.push({
            id: achievement.id,
            achievement: achievement.achievement,
            unlockedAt: achievement.unlocked_at,
            timesCompleted: achievement.times_completed,
        });

        // Update player's latest timestamp
        if (
            new Date(achievement.unlocked_at) >
            new Date(playerGroup.latestUnlockedAt)
        ) {
            playerGroup.latestUnlockedAt = achievement.unlocked_at;
        }
    }

    // Convert to array and sort by most recent
    const groupedArray = Array.from(matchGroups.values()).map((group) => ({
        ...group,
        // Convert players Map to sorted array
        players: Array.from(group.players.values())
            .map((playerGroup) => ({
                ...playerGroup,
                // Sort achievements within player by unlock time (newest first)
                achievements: playerGroup.achievements.sort(
                    (a, b) => new Date(b.unlockedAt) - new Date(a.unlockedAt)
                ),
            }))
            // Sort players by their latest achievement (newest first)
            .sort(
                (a, b) =>
                    new Date(b.latestUnlockedAt) - new Date(a.latestUnlockedAt)
            ),
    }));

    // Sort match groups by latest achievement (newest first)
    groupedArray.sort(
        (a, b) => new Date(b.latestUnlockedAt) - new Date(a.latestUnlockedAt)
    );

    return groupedArray;
}

export function useAchievementFeed() {
    const { currentKicker: kicker } = useKicker();
    const { currentSeason } = useCurrentSeason();
    const seasonId = currentSeason?.id;
    const queryClient = useQueryClient();

    const {
        data,
        isLoading,
        error,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useInfiniteQuery({
        queryKey: [ACHIEVEMENT_FEED, kicker, seasonId],
        queryFn: ({ pageParam = 0 }) =>
            getKickerAchievementFeed(kicker, seasonId, {
                offset: pageParam,
                limit: PAGE_SIZE,
            }),
        getNextPageParam: (lastPage, allPages) => {
            if (lastPage.length < PAGE_SIZE) return undefined;
            return allPages.flat().length;
        },
        enabled: !!kicker,
    });

    // Flatten all pages
    const rawAchievements = useMemo(
        () => data?.pages?.flat() || [],
        [data?.pages]
    );

    // Group by match and player
    const groupedAchievements = useMemo(
        () => groupAchievementsByMatch(rawAchievements),
        [rawAchievements]
    );

    // Handle realtime INSERT - add new achievement to the feed
    const handleRealtimeInsert = useCallback(
        async (payload) => {
            try {
                // Fetch the full achievement data with relations
                const newAchievement = await getPlayerAchievementById(
                    payload.new.id
                );

                // Check if this player belongs to our kicker
                if (newAchievement?.player?.kicker_id !== kicker) return;

                // Check if this is for the current season
                if (seasonId && newAchievement.season_id !== seasonId) return;

                // Add to cache with isNew flag for animation
                queryClient.setQueryData(
                    [ACHIEVEMENT_FEED, kicker, seasonId],
                    (oldData) => {
                        if (!oldData) return oldData;

                        // Check if already exists
                        const allAchievements = oldData.pages.flat();
                        if (
                            allAchievements.some(
                                (a) => a.id === newAchievement.id
                            )
                        ) {
                            return oldData;
                        }

                        // Add to first page with isNew flag
                        const newPages = [...oldData.pages];
                        newPages[0] = [
                            { ...newAchievement, isNew: true },
                            ...newPages[0],
                        ];
                        return { ...oldData, pages: newPages };
                    }
                );
            } catch (err) {
                console.error("Error handling realtime achievement:", err);
                // Fallback to invalidation
                queryClient.invalidateQueries([
                    ACHIEVEMENT_FEED,
                    kicker,
                    seasonId,
                ]);
            }
        },
        [queryClient, kicker, seasonId]
    );

    // Set up realtime subscription
    useEffect(() => {
        if (!kicker) return;

        const channelInstance = supabase
            .channel(`achievement-feed-${kicker}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: databaseSchema,
                    table: PLAYER_ACHIEVEMENTS_TABLE,
                },
                handleRealtimeInsert
            )
            .subscribe();

        return () => {
            if (channelInstance) {
                supabase.removeChannel(channelInstance);
            }
        };
    }, [kicker, handleRealtimeInsert]);

    return {
        achievements: rawAchievements,
        groupedAchievements,
        isLoading,
        error,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        seasonId,
    };
}
