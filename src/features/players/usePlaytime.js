import { useQuery } from "react-query";
import { useParams, useSearchParams } from "react-router-dom";
import { getPlaytime } from "../../services/apiMatches";
import { useKicker } from "../../contexts/KickerContext";
import { useCurrentSeason } from "../seasons/useCurrentSeason";
import { SEASON_ALL_TIME, SEASON_OFF_SEASON } from "../../utils/constants";

export function usePlaytime() {
    const { userId: name } = useParams();
    const [searchParams] = useSearchParams();
    const { currentKicker: kicker } = useKicker();
    const { currentSeason, isLoading: isLoadingCurrentSeason } =
        useCurrentSeason();

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

    const { data, isLoading } = useQuery({
        queryKey: ["playTime", name, kicker, seasonValue],
        queryFn: () => getPlaytime({ name, kicker, ...seasonFilter }),
        enabled: !isLoadingCurrentSeason,
    });

    return { data, isLoading };
}
