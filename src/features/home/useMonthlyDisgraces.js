import { useQuery } from "react-query";
import { getDisgraces } from "../../services/apiMatches";

export function useMonthlyDisgraces() {
    const { data: { data: disgraces } = {}, isLoading } = useQuery({
        queryKey: ["monthlyDisgraces"],
        queryFn: () =>
            getDisgraces({ filter: { month: new Date().getMonth() } }),
    });

    return { disgraces, isLoading };
}
