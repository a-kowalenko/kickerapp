import { useQuery } from "react-query";
import { getMatches } from "../../services/apiMatches";
import {
    MATCHES,
    SEASON_ALL_TIME,
    SEASON_OFF_SEASON,
} from "../../utils/constants";
import { useKicker } from "../../contexts/KickerContext";
import { useSearchParams } from "react-router-dom";

export function useRecentMatches() {
    const { currentKicker: kicker } = useKicker();
    const [searchParams] = useSearchParams();
    const firstPage = 1;

    // Season filter from URL
    const seasonValue = searchParams.get("season");
    const seasonFilter =
        seasonValue && seasonValue !== SEASON_ALL_TIME
            ? {
                  seasonId:
                      seasonValue === SEASON_OFF_SEASON ? null : seasonValue,
              }
            : null;

    const {
        data: { data: matches } = {},
        isLoading: isLoadingMatches,
        errorMatches,
    } = useQuery({
        queryKey: [MATCHES, "recent", firstPage, kicker, seasonValue],
        queryFn: () =>
            getMatches({
                currentPage: firstPage,
                filter: { kicker, ...seasonFilter },
            }),
    });

    return { matches, isLoadingMatches };
}
