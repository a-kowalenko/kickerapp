import { useQuery } from "react-query";
import { useParams } from "react-router-dom";
import { getPlaytime } from "../../services/apiMatches";

export function usePlaytime() {
    const { userId: name } = useParams();

    const { data, isLoading } = useQuery({
        queryKey: ["playTime", name],
        queryFn: () => getPlaytime({ name }),
    });

    console.log("data", data);

    return { data, isLoading };
}
