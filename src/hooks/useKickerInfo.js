import { useQuery } from "react-query";
import { useKicker } from "../contexts/KickerContext";
import { getKickerInfo } from "../services/apiKicker";

export function useKickerInfo() {
    const { currentKicker: kicker } = useKicker();

    const { data, isLoading } = useQuery({
        queryKey: ["kicker-info", kicker],
        queryFn: () => getKickerInfo(kicker),
    });

    return { data, isLoading };
}
