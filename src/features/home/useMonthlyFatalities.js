import { useQuery } from "react-query";
import { getFatalities } from "../../services/apiMatches";
import { useKicker } from "../../contexts/KickerContext";

export function useMonthlyFatalities() {
    const { currentKicker: kicker } = useKicker();

    const { data: { data: fatalities } = {}, isLoading } = useQuery({
        queryKey: ["monthlyFatalities", kicker],
        queryFn: () =>
            getFatalities({
                filter: { month: new Date().getMonth(), kicker },
            }),
    });

    return { fatalities, isLoading };
}
