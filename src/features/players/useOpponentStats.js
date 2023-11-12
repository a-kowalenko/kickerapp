import { useQuery } from "react-query";
import { useParams, useSearchParams } from "react-router-dom";
import { getOpponentStats } from "../../services/apiMatches";

export function useOpponentStats() {
    const { userId: username } = useParams();
    const [searchParams] = useSearchParams();

    const filterValue = !searchParams.get("gamemode")
        ? "1on1"
        : searchParams.get("gamemode");

    const filter = { field: "gamemode", value: filterValue };

    const { data, isLoading } = useQuery({
        queryKey: ["opponentStats", username, filter],
        queryFn: () => getOpponentStats({ username, filter }),
    });

    return { data, isLoading };
}
