import { useQuery } from "react-query";
import { getFatalities } from "../../services/apiMatches";
import { useKicker } from "../../contexts/KickerContext";
import { useSelectedSeason } from "../seasons/useSelectedSeason";

export function useMonthlyFatalities() {
    const { currentKicker: kicker } = useKicker();
    const {
        seasonValue,
        seasonFilter,
        isLoading: isLoadingSeason,
    } = useSelectedSeason();

    const { data: { data: fatalities } = {}, isLoading } = useQuery({
        queryKey: ["monthlyFatalities", kicker, seasonValue],
        queryFn: () =>
            getFatalities({
                filter: {
                    month: new Date().getMonth(),
                    kicker,
                    ...seasonFilter,
                },
            }),
        enabled: !isLoadingSeason,
    });

    return { fatalities, isLoading: isLoading || isLoadingSeason };
}
