import { useQuery } from "react-query";
import { getPlayerById } from "../services/apiMatches";
import { PLAYER } from "../utils/constants";

export function usePlayer(playerId) {
    const {
        data: player,
        isLoading,
        error,
    } = useQuery({
        queryKey: [PLAYER, playerId],
        queryFn: () => getPlayerById(playerId),
        enabled: !!playerId,
    });

    return { player, isLoading, error };
}
