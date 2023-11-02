import { useQuery } from "react-query";
import { getRankings } from "../../services/apiRankings";
import { useSearchParams } from "react-router-dom";

export function useRankings() {
    const [searchParams] = useSearchParams();

    // FILTER
    const filterValue = searchParams.get("gamemode");
    const filter =
        !filterValue || filterValue === "1on1"
            ? { field: "mmr" }
            : { field: "mmr2on2" };

    const {
        data: { data: rankings, count } = {},
        isLoading: isLoadingRankings,
        errorRankings,
    } = useQuery({
        queryKey: ["rankings", filter],
        queryFn: () => getRankings({ filter }),
    });

    return { rankings, count, isLoadingRankings, errorRankings };
}
