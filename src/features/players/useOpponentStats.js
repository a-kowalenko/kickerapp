import { useQuery } from "react-query";
import { useParams, useSearchParams } from "react-router-dom";
import { getOpponentStats } from "../../services/apiMatches";
import { useKicker } from "../../contexts/KickerContext";
import { useCurrentSeason } from "../seasons/useCurrentSeason";
import { SEASON_ALL_TIME, SEASON_OFF_SEASON } from "../../utils/constants";

export function useOpponentStats() {
    const { userId: username } = useParams();
    const [searchParams] = useSearchParams();
    const { currentKicker: kicker } = useKicker();
    const { currentSeason, isLoading: isLoadingCurrentSeason } =
        useCurrentSeason();

    const filterValue = !searchParams.get("gamemode")
        ? "1on1"
        : searchParams.get("gamemode");

    // Season filter - default to current season
    const seasonParam = searchParams.get("season");
    const seasonValue =
        seasonParam || (currentSeason ? String(currentSeason.id) : null);

    const seasonFilter =
        seasonValue && seasonValue !== SEASON_ALL_TIME
            ? {
                  seasonId:
                      seasonValue === SEASON_OFF_SEASON ? null : seasonValue,
              }
            : null;

    const filter = { field: "gamemode", value: filterValue, ...seasonFilter };

    const { data, isLoading } = useQuery({
        queryKey: ["opponentStats", username, filter, kicker, seasonValue],
        queryFn: () =>
            getOpponentStats({ username, filter: { ...filter, kicker } }),
        enabled: !isLoadingCurrentSeason,
    });

    return { data, isLoading };
}
