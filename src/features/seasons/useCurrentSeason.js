import { useQuery } from "react-query";
import { getCurrentSeason } from "../../services/apiSeasons";
import { useKicker } from "../../contexts/KickerContext";

export function useCurrentSeason() {
    const { currentKicker: kicker } = useKicker();

    const {
        data: currentSeason,
        isLoading,
        error,
    } = useQuery({
        queryKey: ["currentSeason", kicker],
        queryFn: () => getCurrentSeason(kicker),
        enabled: !!kicker,
    });

    return { currentSeason, isLoading, error };
}
