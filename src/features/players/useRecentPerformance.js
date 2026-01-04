import { useQuery } from "react-query";
import { getMatches } from "../../services/apiMatches";
import { useKicker } from "../../contexts/KickerContext";
import { useSelectedSeason } from "../seasons/useSelectedSeason";
import { MATCH_ACTIVE } from "../../utils/constants";

/**
 * Hook to fetch the last N matches for a player per gamemode.
 * Fetches enough matches to ensure up to `limit` matches per gamemode.
 * Only shows matches from the currently selected season.
 */
export function useRecentPerformance(playerName, limit = 10) {
    const { currentKicker: kicker } = useKicker();
    const {
        seasonFilter,
        seasonValue,
        isLoading: isLoadingSeason,
    } = useSelectedSeason();

    // Fetch more matches to ensure we have enough for both gamemodes
    const fetchLimit = limit * 3;

    const {
        data: { data: matches } = {},
        isLoading: isLoadingMatches,
        error,
    } = useQuery({
        queryKey: [
            "recentPerformance",
            playerName,
            kicker,
            fetchLimit,
            seasonValue,
        ],
        queryFn: () =>
            getMatches({
                filter: { name: playerName, kicker, ...seasonFilter },
                currentPage: 1,
                pageSize: fetchLimit,
            }),
        enabled: !!playerName && !!kicker && !isLoadingSeason,
    });

    const isLoading = isLoadingSeason || isLoadingMatches;

    // Filter out active matches and separate by gamemode
    const completedMatches =
        matches?.filter((m) => m.status !== MATCH_ACTIVE) || [];

    const matches1on1 = completedMatches
        .filter((m) => m.gamemode === "1on1")
        .slice(0, limit);

    const matches2on2 = completedMatches
        .filter((m) => m.gamemode === "2on2" || m.gamemode === "2on1")
        .slice(0, limit);

    return {
        matches1on1,
        matches2on2,
        isLoading,
        error,
    };
}
