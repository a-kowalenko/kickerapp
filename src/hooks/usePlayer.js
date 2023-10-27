import { useQuery } from "react-query";
import { getPlayerById } from "../services/apiMatches";

export function usePlayer(playerId) {
    const {
        data: player,
        isLoading,
        error,
    } = useQuery({
        queryKey: ["player", playerId],
        queryFn: () => getPlayerById(playerId),
        enabled: !!playerId,
    });

    return { player, isLoading, error };
}
