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
        queryKey: ["match", kicker],
        queryFn: () => getActiveMatch({ kicker }),
    });

    return { activeMatch, isLoading, error };
}
