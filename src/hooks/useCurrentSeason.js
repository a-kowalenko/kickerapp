import { useQuery } from "react-query";
import { useKicker } from "../contexts/KickerContext";
import { getCurrentSeason } from "../services/apiSeason";

export function useCurrentSeason() {
    const { currentKicker: kicker } = useKicker();

    const { data: currentSeason, isLoading: isLoadingCurrentKicker } = useQuery(
        {
            queryKey: ["current_season", kicker],
            queryFn: () => getCurrentSeason(kicker),
        }
    );

    return { currentSeason, isLoadingCurrentKicker };
}
