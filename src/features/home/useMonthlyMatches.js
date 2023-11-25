import { useQuery, useQueryClient } from "react-query";
import { useKicker } from "../../contexts/KickerContext";
import { getMatches } from "../../services/apiMatches";
import { useSearchParams } from "react-router-dom";

export function useMonthlyMatches() {
    const { currentKicker: kicker } = useKicker();
    const [searchParams] = useSearchParams();
    const queryClient = useQueryClient();

    // Filtering
    const filterValue = searchParams.get("gamemode");
    const filter =
        filterValue === "all"
            ? null
            : !filterValue
            ? { field: "gamemode", value: "1on1" }
            : { field: "gamemode", value: filterValue };

    const { data: { data } = {}, isLoading } = useQuery({
        queryKey: ["monthly_matches", filter?.value, kicker],
        queryFn: () =>
            getMatches({
                filter: { month: new Date().getMonth(), kicker, ...filter },
            }),
    });

    // PREFETCH THE NOT SELECTED GAMEMODES
    if (filterValue !== "all") {
        queryClient.prefetchQuery({
            queryKey: ["monthly_matches", null, kicker],
            queryFn: () =>
                getMatches({
                    filter: {
                        month: new Date().getMonth(),
                        kicker,
                    },
                }),
        });
    }
    if (filterValue !== "1on1") {
        queryClient.prefetchQuery({
            queryKey: ["monthly_matches", "1on1", kicker],
            queryFn: () =>
                getMatches({
                    filter: {
                        month: new Date().getMonth(),
                        kicker,
                        field: "gamemode",
                        value: "1on1",
                    },
                }),
        });
    }
    if (filterValue !== "2on2") {
        queryClient.prefetchQuery({
            queryKey: ["monthly_matches", "2on2", kicker],
            queryFn: () =>
                getMatches({
                    filter: {
                        month: new Date().getMonth(),
                        kicker,
                        field: "gamemode",
                        value: "2on2",
                    },
                }),
        });
    }
    if (filterValue !== "2on1") {
        queryClient.prefetchQuery({
            queryKey: ["monthly_matches", "2on1", kicker],
            queryFn: () =>
                getMatches({
                    filter: {
                        month: new Date().getMonth(),
                        kicker,
                        field: "gamemode",
                        value: "2on1",
                    },
                }),
        });
    }

    return { data, isLoading };
}
