import { useQuery } from "react-query";
import { getDisgraces } from "../../services/apiMatches";
import { useSearchParams } from "react-router-dom";
import { useKicker } from "../../contexts/KickerContext";

export function useDisgraces() {
    const [searchParams] = useSearchParams();
    const { currentKicker: kicker } = useKicker();

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
        queryKey: ["digraces", filter, kicker],
        queryFn: () => getDisgraces({ filter: { ...filter, kicker } }),
    });

    return { disgraces, count, isLoading, error };
}
