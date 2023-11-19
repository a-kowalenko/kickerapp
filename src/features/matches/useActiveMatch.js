import { useQuery } from "react-query";
import { getActiveMatch } from "../../services/apiMatches";
import { useKicker } from "../../contexts/KickerContext";

export function useActiveMatch() {
    const { currentKicker: kicker } = useKicker();

    const {
        data: { data: activeMatch } = {},
        isLoading,
        error,
    } = useQuery({
        queryKey: ["activeMatch", kicker],
        queryFn: () => getActiveMatch({ kicker }),
        cacheTime: 0,
    });

    return { activeMatch, isLoading, error };
}
