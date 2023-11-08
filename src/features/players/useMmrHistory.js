import { useQuery } from "react-query";
import { useParams, useSearchParams } from "react-router-dom";
import { getMmrHistory } from "../../services/apiMatches";

export function useMmrHistory() {
    const { userId } = useParams();
    const [searchParams] = useSearchParams();

    // FILTERING
    const filterValue = searchParams.get("gamemode") || "1on1";
    const filter = { field: "gamemode", value: filterValue };

    const { data: { data, count } = {}, isLoading } = useQuery({
        queryKey: ["mmrHistory", userId, filter],
        queryFn: () => getMmrHistory({ filter: { name: userId, ...filter } }),
    });

    return { data, isLoading, count };
}
