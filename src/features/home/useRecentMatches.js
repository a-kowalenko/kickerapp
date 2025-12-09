import { useQuery } from "react-query";
import { getMatches } from "../../services/apiMatches";
import { MATCHES } from "../../utils/constants";
import { useKicker } from "../../contexts/KickerContext";
import { useSelectedSeason } from "../seasons/useSelectedSeason";

export function useRecentMatches() {
    const { currentKicker: kicker } = useKicker();
    const {
        seasonValue,
        seasonFilter,
        isLoading: isLoadingSeason,
    } = useSelectedSeason();
    const firstPage = 1;

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
        enabled: !isLoadingSeason,
    });

    return {
        matches,
        isLoadingMatches: isLoadingMatches || isLoadingSeason,
    };
}
