import { useQuery } from "react-query";
import { getMostPlayed } from "../../services/apiPlayer";
import { useKicker } from "../../contexts/KickerContext";

export function useMostPlayed() {
    const { currentKicker: kicker } = useKicker();

    const { data, isLoading } = useQuery({
        queryKey: ["mostPlayed", kicker],
        queryFn: () => getMostPlayed({ filter: { kicker } }),
    });

    return { mostPlayed: data, isLoading };
}
