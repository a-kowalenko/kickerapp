import { useQuery } from "react-query";
import { getPlayerByName } from "../../services/apiPlayer";

export function usePlayerName(name) {
    const {
        data: player,
        isLoading,
        error,
    } = useQuery({
        queryKey: ["player", name],
        queryFn: () => getPlayerByName(name),
        enabled: !!name,
    });

    return { player, isLoading, error };
}
