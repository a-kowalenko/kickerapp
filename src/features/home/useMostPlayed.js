import { useQuery } from "react-query";
import { getMostPlayed } from "../../services/apiPlayer";
import { useKicker } from "../../contexts/KickerContext";
import { useSearchParams } from "react-router-dom";
import { SEASON_ALL_TIME, SEASON_OFF_SEASON } from "../../utils/constants";

export function useMostPlayed() {
    const { currentKicker: kicker } = useKicker();
    const [searchParams] = useSearchParams();

    // Season filter from URL
    const seasonValue = searchParams.get("season");
    const seasonId =
        seasonValue &&
        seasonValue !== SEASON_ALL_TIME &&
        seasonValue !== SEASON_OFF_SEASON
            ? parseInt(seasonValue)
            : null;

    const { data, isLoading } = useQuery({
        queryKey: ["mostPlayed", kicker, seasonValue],
        queryFn: () => getMostPlayed({ filter: { kicker, seasonId } }),
    });

    return { mostPlayed: data, isLoading };
}
