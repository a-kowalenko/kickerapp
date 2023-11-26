import { useQueryClient } from "react-query";
import { useKicker } from "../../contexts/KickerContext";
import { MATCHES, PLAYER } from "../../utils/constants";
import { useParams } from "react-router-dom";
import { getPlayerByName } from "../../services/apiPlayer";
import {
    getMatches,
    getMmrHistory,
    getOpponentStats,
} from "../../services/apiMatches";

export function usePrefetchProfileData() {
    const { currentKicker: kicker } = useKicker();
    const queryClient = useQueryClient();
    const { userId } = useParams();
    const name = userId;
    const filter = { field: "gamemode", value: "1on1" };
    const currentPage = 1;

    // ------------------------------ Profile ------------------------------
    queryClient.prefetchQuery({
        queryKey: [PLAYER, name, kicker],
        queryFn: () => getPlayerByName({ name, kicker }),
        enabled: !!name,
    });

    // ------------------------------ ProfileMatches ------------------------------
    queryClient.prefetchQuery({
        queryKey: [MATCHES, null, currentPage, kicker],
        queryFn: () =>
            getMatches({
                currentPage,
                filter: { kicker },
            }),
    });
    queryClient.prefetchQuery({
        queryKey: [MATCHES, filter, currentPage, kicker],
        queryFn: () =>
            getMatches({
                currentPage,
                filter: { ...filter, kicker },
            }),
    });
    queryClient.prefetchQuery({
        queryKey: ["matchHistory", name, null, currentPage, kicker],
        queryFn: () => getMatches({ filter: { name, kicker }, currentPage }),
        enabled: !!name,
    });
    queryClient.prefetchQuery({
        queryKey: ["matchHistory", name, filter, currentPage, kicker],
        queryFn: () =>
            getMatches({ filter: { name, kicker, ...filter }, currentPage }),
        enabled: !!name,
    });

    // ------------------------------ PlayerStatistics ------------------------------
    queryClient.prefetchQuery({
        queryKey: ["opponentStats", userId, filter, kicker],
        queryFn: () =>
            getOpponentStats({
                username: userId,
                filter: { ...filter, kicker },
            }),
    });
    queryClient.prefetchQuery({
        queryKey: ["mmrHistory", userId, filter, kicker],
        queryFn: () =>
            getMmrHistory({ filter: { name: userId, ...filter, kicker } }),
    });
}
