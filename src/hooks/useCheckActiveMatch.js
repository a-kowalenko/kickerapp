import { useQuery } from "react-query";
import { useKicker } from "../contexts/KickerContext";
import { getActiveMatch } from "../services/apiMatches";
import { CHECK_FOR_ACTIVE_MATCH_INTERVAL } from "../utils/constants";

export function useContinuouslyCheckForActiveMatch() {
    const { currentKicker: kicker } = useKicker();

    const { data: { data: activeMatch } = {}, isLoading } = useQuery({
        queryKey: ["checkActiveMatch", `kicker_${kicker}`],
        queryFn: () => getActiveMatch({ kicker }),
        refetchInterval: CHECK_FOR_ACTIVE_MATCH_INTERVAL,
        refetchIntervalInBackground: true,
    });

    return { activeMatch, isLoading };
}
