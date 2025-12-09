import { useQuery } from "react-query";
import { useParams, useSearchParams } from "react-router-dom";
import { getOpponentStats } from "../../services/apiMatches";
import { useKicker } from "../../contexts/KickerContext";
import { useSelectedSeason } from "../seasons/useSelectedSeason";

export function useOpponentStats() {
    const { userId: username } = useParams();
    const [searchParams] = useSearchParams();
    const { currentKicker: kicker } = useKicker();
    const {
        seasonValue,
        seasonFilter,
        isLoading: isLoadingSeason,
    } = useSelectedSeason();

    const filterValue = !searchParams.get("gamemode")
        ? "1on1"
        : searchParams.get("gamemode");

    const filter = { field: "gamemode", value: filterValue, ...seasonFilter };

    const { data, isLoading } = useQuery({
        queryKey: ["opponentStats", username, filter, kicker, seasonValue],
        queryFn: () =>
            getOpponentStats({ username, filter: { ...filter, kicker } }),
        enabled: !isLoadingSeason,
    });

    return { data, isLoading: isLoading || isLoadingSeason };
}
