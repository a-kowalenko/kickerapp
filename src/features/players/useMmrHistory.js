import { useQuery } from "react-query";
import { useParams, useSearchParams } from "react-router-dom";
import { getMmrHistory } from "../../services/apiMatches";
import { useKicker } from "../../contexts/KickerContext";
import { useSelectedSeason } from "../seasons/useSelectedSeason";

export function useMmrHistory() {
    const { userId } = useParams();
    const [searchParams] = useSearchParams();
    const { currentKicker: kicker } = useKicker();
    const {
        seasonValue,
        seasonFilter,
        isLoading: isLoadingSeason,
    } = useSelectedSeason();

    // GAMEMODE FILTERING
    const filterValue = searchParams.get("gamemode") || "1on1";

    const filter = { field: "gamemode", value: filterValue, ...seasonFilter };

    const { data: { data, count } = {}, isLoading } = useQuery({
        queryKey: ["mmrHistory", userId, filter, kicker, seasonValue],
        queryFn: () =>
            getMmrHistory({ filter: { name: userId, ...filter, kicker } }),
        enabled: !isLoadingSeason,
    });

    return { data, isLoading: isLoading || isLoadingSeason, count };
}
