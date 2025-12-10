import { useQuery } from "react-query";
import { useKicker } from "../../contexts/KickerContext";
import { usePlayerName } from "./usePlayerName";
import {
    SEASON_ALL_TIME,
    SEASON_OFF_SEASON,
    SEASON_RANKINGS,
} from "../../utils/constants";
import supabase from "../../services/supabase";
import { useSelectedSeason } from "../seasons/useSelectedSeason";

async function getPlayerSeasonStats({ playerId, seasonId }) {
    if (!playerId || !seasonId) return null;

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

export function usePlayerSeasonStats(userId) {
    const { currentKicker: kicker } = useKicker();
    const { seasonValue, isLoading: isLoadingSeason } = useSelectedSeason();
    const { player, isLoading: isLoadingPlayer } = usePlayerName(userId);

    // Determine if we should fetch season-specific stats or use all-time from player
    const isAllTime = seasonValue === SEASON_ALL_TIME;
    const isOffSeason = seasonValue === SEASON_OFF_SEASON;
    const shouldFetchSeasonStats =
        !isAllTime && !isOffSeason && seasonValue && player?.id;

    const {
        data: seasonStats,
        isLoading: isLoadingSeasonStats,
        error,
    } = useQuery({
        queryKey: ["playerSeasonStats", player?.id, seasonValue, kicker],
        queryFn: () =>
            getPlayerSeasonStats({
                playerId: player?.id,
                seasonId: seasonValue,
            }),
        enabled: shouldFetchSeasonStats && !isLoadingPlayer && !isLoadingSeason,
    });

    // Return appropriate stats based on filter
    const isLoading =
        isLoadingPlayer ||
        isLoadingSeason ||
        (shouldFetchSeasonStats && isLoadingSeasonStats);

    // If all-time or off-season, use player stats
    // If specific season, use season stats
    let stats = null;

    if (!isLoading && player) {
        if (isAllTime || isOffSeason) {
            // Use all-time stats from player table
            stats = {
                wins: player.wins,
                losses: player.losses,
                mmr: player.mmr,
                wins2on2: player.wins2on2,
                losses2on2: player.losses2on2,
                mmr2on2: player.mmr2on2,
                isAllTime: true,
            };
        } else if (seasonStats) {
            // Use season-specific stats
            stats = {
                wins: seasonStats.wins,
                losses: seasonStats.losses,
                mmr: seasonStats.mmr,
                wins2on2: seasonStats.wins2on2,
                losses2on2: seasonStats.losses2on2,
                mmr2on2: seasonStats.mmr2on2,
                isAllTime: false,
            };
        } else {
            // Season stats not found, show zeros
            stats = {
                wins: 0,
                losses: 0,
                mmr: 1000,
                wins2on2: 0,
                losses2on2: 0,
                mmr2on2: 1000,
                isAllTime: false,
            };
        }
    }

    return { stats, isLoading, error, seasonValue };
}
