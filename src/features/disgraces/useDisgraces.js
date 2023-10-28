import { useQuery } from "react-query";
import { getDisgraces } from "../../services/apiMatches";

export function useDisgraces() {
    const {
        data: { data: disgraces, count } = {},
        isLoading,
        error,
    } = useQuery({
        queryKey: ["digraces"],
        queryFn: getDisgraces,
    });

    return { disgraces, count, isLoading, error };
}
