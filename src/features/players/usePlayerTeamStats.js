import { useQuery } from "react-query";
import { useKicker } from "../../contexts/KickerContext";
import { usePlayerName } from "./usePlayerName";
import { getPlayerTeamStats } from "../../services/apiTeams";
import { useSelectedSeason } from "../seasons/useSelectedSeason";
import { SEASON_ALL_TIME, SEASON_OFF_SEASON } from "../../utils/constants";

export function usePlayerTeamStats(userId) {
    const { currentKicker: kicker } = useKicker();
    const { seasonValue, isLoading: isLoadingSeason } = useSelectedSeason();
    const { player, isLoading: isLoadingPlayer } = usePlayerName(userId);

    // Determine if we should fetch season-specific stats or all-time
    const isAllTime = seasonValue === SEASON_ALL_TIME;
    const isOffSeason = seasonValue === SEASON_OFF_SEASON;

    // For team stats, null season means all-time
    const effectiveSeasonId = isAllTime || isOffSeason ? null : seasonValue;

    const {
        data: teamStats,
        isLoading: isLoadingTeamStats,
        error,
    } = useQuery({
        queryKey: ["playerTeamStats", player?.id, effectiveSeasonId, kicker],
        queryFn: () => getPlayerTeamStats(player?.id, effectiveSeasonId),
        enabled: !!player?.id && !isLoadingPlayer && !isLoadingSeason,
    });

    const isLoading = isLoadingPlayer || isLoadingSeason || isLoadingTeamStats;

    return {
        teamStats: teamStats || { wins: 0, losses: 0, bounty_claimed: 0 },
        isLoading,
        error,
    };
}
