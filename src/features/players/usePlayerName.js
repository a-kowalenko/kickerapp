import { useQuery } from "react-query";
import { getPlayerByName } from "../../services/apiPlayer";
import { PLAYER } from "../../utils/constants";

export function usePlayerName(name) {
    const {
        data: player,
        isLoading,
        error,
    } = useQuery({
        queryKey: [PLAYER, name],
        queryFn: () => getPlayerByName(name),
        enabled: !!name,
    });

    return { player, isLoading, error };
}
