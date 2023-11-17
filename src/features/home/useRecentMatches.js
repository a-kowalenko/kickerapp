import { useQuery } from "react-query";
import { getMatches } from "../../services/apiMatches";
import { MATCHES } from "../../utils/constants";
import { useKicker } from "../../contexts/KickerContext";

export function useRecentMatches() {
    const { currentKicker: kicker } = useKicker();
    const firstPage = 1;

    const {
        data: { data: matches } = {},
        isLoading: isLoadingMatches,
        errorMatches,
    } = useQuery({
        queryKey: [MATCHES, firstPage, kicker],
        queryFn: () =>
            getMatches({
                currentPage: firstPage,
                filter: { kicker },
            }),
    });

    return { matches, isLoadingMatches };
}
