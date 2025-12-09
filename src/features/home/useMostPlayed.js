import { useQuery } from "react-query";
import { getMostPlayed } from "../../services/apiPlayer";
import { useKicker } from "../../contexts/KickerContext";
import { useSelectedSeason } from "../seasons/useSelectedSeason";
import { SEASON_ALL_TIME, SEASON_OFF_SEASON } from "../../utils/constants";

export function useMostPlayed() {
    const { currentKicker: kicker } = useKicker();
    const { seasonValue, isLoading: isLoadingSeason } = useSelectedSeason();

    const seasonId =
        seasonValue &&
        seasonValue !== SEASON_ALL_TIME &&
        seasonValue !== SEASON_OFF_SEASON
            ? parseInt(seasonValue)
            : null;

    const { data, isLoading } = useQuery({
        queryKey: ["mostPlayed", kicker, seasonValue],
        queryFn: () => getMostPlayed({ filter: { kicker, seasonId } }),
        enabled: !isLoadingSeason,
    });

    return { mostPlayed: data, isLoading: isLoading || isLoadingSeason };
}
