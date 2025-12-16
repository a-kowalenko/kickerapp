import { useQuery } from "react-query";
import { useKicker } from "../contexts/KickerContext";
import { getPlayersByKicker } from "../services/apiPlayer";
import { useUser } from "../features/authentication/useUser";
import { useSelectedSeason } from "../features/seasons/useSelectedSeason";
import { SEASON_ALL_TIME, SEASON_OFF_SEASON } from "../utils/constants";

export function usePlayers() {
    const { currentKicker: kicker } = useKicker();
    const { user, isAuthenticated } = useUser();
    const { seasonValue, isLoading: isLoadingSeason } = useSelectedSeason();

    // Determine the seasonId to pass to the API
    // - For a specific season: pass the season ID
    // - For all-time or off-season: pass null (use base player MMR)
    const seasonId =
        seasonValue &&
        seasonValue !== SEASON_ALL_TIME &&
        seasonValue !== SEASON_OFF_SEASON
            ? parseInt(seasonValue, 10)
            : null;

    const {
        data: players,
        isLoading: isLoadingPlayers,
        error,
    } = useQuery({
        queryKey: ["players", kicker, seasonId],
        queryFn: () => getPlayersByKicker(kicker, seasonId),
        enabled: !isLoadingSeason,
    });

    if (user && isAuthenticated) {
        // Put own player at the top of the list
        players?.sort((a) => (a.user_id === user.id ? -1 : 1));
    }
    return { players, isLoading: isLoadingPlayers || isLoadingSeason, error };
}
