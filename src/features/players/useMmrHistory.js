import { useQuery } from "react-query";
import { useParams, useSearchParams } from "react-router-dom";
import { getMmrHistory } from "../../services/apiMatches";
import { useKicker } from "../../contexts/KickerContext";
import { useCurrentSeason } from "../seasons/useCurrentSeason";
import { SEASON_ALL_TIME, SEASON_OFF_SEASON } from "../../utils/constants";

export function useMmrHistory() {
    const { userId } = useParams();
    const [searchParams] = useSearchParams();
    const { currentKicker: kicker } = useKicker();
    const { currentSeason, isLoading: isLoadingCurrentSeason } =
        useCurrentSeason();

    // GAMEMODE FILTERING
    const filterValue = searchParams.get("gamemode") || "1on1";

    // SEASON FILTERING - default to current season
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

    const { data: { data, count } = {}, isLoading } = useQuery({
        queryKey: ["mmrHistory", userId, filter, kicker, seasonValue],
        queryFn: () =>
            getMmrHistory({ filter: { name: userId, ...filter, kicker } }),
        enabled: !isLoadingCurrentSeason,
    });

    return { data, isLoading, count };
}
