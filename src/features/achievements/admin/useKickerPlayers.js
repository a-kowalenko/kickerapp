import { useQuery } from "react-query";
import { useKicker } from "../../../contexts/KickerContext";
import { getPlayersByKicker } from "../../../services/apiPlayer";

/**
 * Hook to get all players of the current kicker for admin purposes
 * (without season filtering)
 */
export function useKickerPlayers() {
    const { currentKicker: kicker } = useKicker();

    const {
        data: players,
        isLoading,
        error,
    } = useQuery({
        queryKey: ["kickerPlayers", kicker],
        queryFn: () => getPlayersByKicker(kicker, null),
        enabled: !!kicker,
    });

    return { players, isLoading, error };
}
