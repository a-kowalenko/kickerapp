import { useQuery } from "react-query";
import { getDisgraces } from "../../services/apiMatches";
import { useKicker } from "../../contexts/KickerContext";

export function useMonthlyDisgraces() {
    const { currentKicker: kicker } = useKicker();

    const { data: { data: disgraces } = {}, isLoading } = useQuery({
        queryKey: ["monthlyDisgraces", kicker],
        queryFn: () =>
            getDisgraces({
                filter: { month: new Date().getMonth(), kicker },
            }),
    });

    return { disgraces, isLoading };
}
