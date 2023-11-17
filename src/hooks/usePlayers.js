import { useQuery } from "react-query";
import { getPlayers } from "../services/apiMatches";
import { useKicker } from "../contexts/KickerContext";

export function usePlayers() {
    const { currentKicker: kicker } = useKicker();

    const {
        data: players,
        isLoading,
        error,
    } = useQuery({
        queryKey: ["players", kicker],
        queryFn: () => getPlayers({ filter: { kicker } }),
    });

    return { players, isLoading, error };
}
