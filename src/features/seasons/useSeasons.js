import { useQuery } from "react-query";
import { getSeasons } from "../../services/apiSeasons";
import { useKicker } from "../../contexts/KickerContext";

export function useSeasons() {
    const { currentKicker: kicker } = useKicker();

    const {
        data: seasons,
        isLoading,
        error,
    } = useQuery({
        queryKey: ["seasons", kicker],
        queryFn: () => getSeasons(kicker),
        enabled: !!kicker,
    });

    return { seasons, isLoading, error };
}
