import { useQuery } from "react-query";
import { getPlayers } from "../services/apiMatches";

export function usePlayers() {
    const {
        data: players,
        isLoading,
        error,
    } = useQuery({
        queryKey: ["players"],
        queryFn: getPlayers,
    });

    return { players, isLoading, error };
}
