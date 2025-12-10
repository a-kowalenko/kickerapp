import { useQuery } from "react-query";
import { useParams } from "react-router-dom";
import { getPlaytime } from "../../services/apiMatches";
import { useKicker } from "../../contexts/KickerContext";
import { useSelectedSeason } from "../seasons/useSelectedSeason";

export function usePlaytime() {
    const { userId: name } = useParams();
    const { currentKicker: kicker } = useKicker();
    const {
        seasonValue,
        seasonFilter,
        isLoading: isLoadingSeason,
    } = useSelectedSeason();

    const { data, isLoading } = useQuery({
        queryKey: ["playTime", name, kicker, seasonValue],
        queryFn: () => getPlaytime({ name, kicker, ...seasonFilter }),
        enabled: !isLoadingSeason,
    });

    return { data, isLoading: isLoading || isLoadingSeason };
}
