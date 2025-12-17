import { useQuery, useQueryClient } from "react-query";
import { useEffect, useCallback } from "react";
import { getMatches } from "../../services/apiMatches";
import { MATCHES } from "../../utils/constants";
import { useKicker } from "../../contexts/KickerContext";
import { useSelectedSeason } from "../seasons/useSelectedSeason";
import supabase, { databaseSchema } from "../../services/supabase";

export function useRecentMatches() {
    const { currentKicker: kicker } = useKicker();
    const queryClient = useQueryClient();
    const {
        seasonValue,
        seasonFilter,
        isLoading: isLoadingSeason,
    } = useSelectedSeason();
    const firstPage = 1;

    const {
        data: { data: matches } = {},
        isLoading: isLoadingMatches,
        errorMatches,
    } = useQuery({
        queryKey: [MATCHES, "recent", firstPage, kicker, seasonValue],
        queryFn: () =>
            getMatches({
                currentPage: firstPage,
                filter: { kicker, ...seasonFilter },
            }),
        enabled: !isLoadingSeason,
    });

    // Realtime subscription for match updates
    const handleRealtimeChange = useCallback(() => {
        queryClient.invalidateQueries([
            MATCHES,
            "recent",
            firstPage,
            kicker,
            seasonValue,
        ]);
    }, [queryClient, kicker, seasonValue]);

    useEffect(() => {
        if (!kicker) return;

        const channelInstance = supabase
            .channel(`recent-matches-${kicker}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: databaseSchema,
                    table: "matches",
                    filter: `kicker_id=eq.${kicker}`,
                },
                handleRealtimeChange
            )
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: databaseSchema,
                    table: "matches",
                    filter: `kicker_id=eq.${kicker}`,
                },
                handleRealtimeChange
            )
            .on(
                "postgres_changes",
                {
                    event: "DELETE",
                    schema: databaseSchema,
                    table: "matches",
                },
                handleRealtimeChange
            )
            .subscribe();

        return () => {
            if (channelInstance) {
                supabase.removeChannel(channelInstance);
            }
        };
    }, [kicker, handleRealtimeChange]);

    return {
        matches,
        isLoadingMatches: isLoadingMatches || isLoadingSeason,
    };
}
