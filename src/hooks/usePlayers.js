import { useQuery } from "react-query";
import { useKicker } from "../contexts/KickerContext";
import { getPlayersByKicker } from "../services/apiPlayer";
import { useUser } from "../features/authentication/useUser";

export function usePlayers() {
    const { currentKicker: kicker } = useKicker();
    const { user, isAuthenticated } = useUser();

    const {
        data: players,
        isLoading,
        error,
    } = useQuery({
        queryKey: ["players", kicker],
        queryFn: () => getPlayersByKicker(kicker),
    });

    if (user && isAuthenticated) {
        // Put own player at the top of the list
        players?.sort((a) => (a.user_id === user.id ? -1 : 1));
    }
    return { players, isLoading, error };
}
