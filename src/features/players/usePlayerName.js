import { useQuery } from "react-query";
import { getPlayerByName } from "../../services/apiPlayer";
import { PLAYER } from "../../utils/constants";
import { useKicker } from "../../contexts/KickerContext";

export function usePlayerName(name) {
    const { currentKicker: kicker } = useKicker();

    const {
        data: player,
        isLoading,
        error,
    } = useQuery({
        queryKey: [PLAYER, name, kicker],
        queryFn: () => getPlayerByName({ name, kicker }),
        enabled: !!name,
    });

    return { player, isLoading, error };
}
