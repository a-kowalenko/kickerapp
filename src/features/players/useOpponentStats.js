import { useQuery } from "react-query";
import { useParams, useSearchParams } from "react-router-dom";
import { getOpponentStats } from "../../services/apiMatches";
import { useKicker } from "../../contexts/KickerContext";

export function useOpponentStats() {
    const { userId: username } = useParams();
    const [searchParams] = useSearchParams();
    const { currentKicker: kicker } = useKicker();

    const filterValue = !searchParams.get("gamemode")
        ? "1on1"
        : searchParams.get("gamemode");

    const filter = { field: "gamemode", value: filterValue };

    const { data, isLoading } = useQuery({
        queryKey: ["opponentStats", username, filter, kicker],
        queryFn: () =>
            getOpponentStats({ username, filter: { ...filter, kicker } }),
    });

    return { data, isLoading };
}
