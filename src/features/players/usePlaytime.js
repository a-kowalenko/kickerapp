import { useQuery } from "react-query";
import { useParams } from "react-router-dom";
import { getPlaytime } from "../../services/apiMatches";
import { useKicker } from "../../contexts/KickerContext";

export function usePlaytime() {
    const { userId: name } = useParams();
    const { currentKicker: kicker } = useKicker();

    const { data, isLoading } = useQuery({
        queryKey: ["playTime", name, kicker],
        queryFn: () => getPlaytime({ name, kicker }),
    });

    return { data, isLoading };
}
