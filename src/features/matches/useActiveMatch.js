import { useQuery } from "react-query";
import { getActiveMatch } from "../../services/apiMatches";

export function useActiveMatch() {
    const {
        data: { data: activeMatch } = {},
        isLoading,
        error,
    } = useQuery({
        queryKey: ["match"],
        queryFn: getActiveMatch,
    });

    return { activeMatch, isLoading, error };
}
