import { useQuery } from "react-query";
import { getMostPlayed } from "../../services/apiPlayer";

export function useMostPlayed() {
    const { data, isLoading } = useQuery({
        queryKey: ["mostPlayed"],
        queryFn: getMostPlayed,
    });

    return { mostPlayed: data, isLoading };
}
