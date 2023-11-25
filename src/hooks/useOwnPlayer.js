import { useQuery } from "react-query";
import { useKicker } from "../contexts/KickerContext";
import { getOwnPlayer } from "../services/apiPlayer";

export function useOwnPlayer() {
    const { currentKicker: kicker } = useKicker();

    const { data, isLoading } = useQuery({
        queryKey: ["ownPlayer", kicker],
        queryFn: () => getOwnPlayer(kicker),
    });

    return { data, isLoading };
}
