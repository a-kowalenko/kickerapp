import { useQuery } from "react-query";
import { getDisgraces } from "../../services/apiMatches";
import { useSearchParams } from "react-router-dom";

export function useDisgraces() {
    const [searchParams, setSearchParams] = useSearchParams();

    // FILTER
    const filterValue = searchParams.get("gamemode");
    const filter =
        !filterValue || filterValue === "all"
            ? null
            : { field: "gamemode", value: filterValue };

    const {
        data: { data: disgraces, count } = {},
        isLoading,
        error,
    } = useQuery({
        queryKey: ["digraces", filter],
        queryFn: () => getDisgraces({ filter }),
    });

    return { disgraces, count, isLoading, error };
}
