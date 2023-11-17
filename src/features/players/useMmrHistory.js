import { useQuery } from "react-query";
import { useParams, useSearchParams } from "react-router-dom";
import { getMmrHistory } from "../../services/apiMatches";
import { useKicker } from "../../contexts/KickerContext";

export function useMmrHistory() {
    const { userId } = useParams();
    const [searchParams] = useSearchParams();
    const { currentKicker: kicker } = useKicker();

    // FILTERING
    const filterValue = searchParams.get("gamemode") || "1on1";
    const filter = { field: "gamemode", value: filterValue };

    const { data: { data, count } = {}, isLoading } = useQuery({
        queryKey: ["mmrHistory", userId, filter, kicker],
        queryFn: () =>
            getMmrHistory({ filter: { name: userId, ...filter, kicker } }),
    });

    return { data, isLoading, count };
}
