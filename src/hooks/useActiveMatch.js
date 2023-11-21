import { useEffect } from "react";
import { useState } from "react";
import supabase, { databaseSchema } from "../services/supabase";
import {
    GOALS,
    MATCHES,
    MATCH_ENDED,
    MATCH_ENDED_BY_CRON,
} from "../utils/constants";
import { useKicker } from "../contexts/KickerContext";
import { useQueryClient } from "react-query";
import { getActiveMatch, getMatch } from "../services/apiMatches";
import { useParams } from "react-router-dom";

export function useActiveMatch() {
    const { matchId } = useParams();
    const { currentKicker: kicker } = useKicker();
    const [activeMatch, setActiveMatch] = useState(null);
    const queryClient = useQueryClient();

    useEffect(
        function () {
            async function updateActiveMatch(payload) {
                const match = await getMatch({
                    matchId: Number(matchId) || payload.new.id,
                    kicker,
                });

                if (
                    payload.new.status === MATCH_ENDED ||
                    payload.new.status === MATCH_ENDED_BY_CRON
                ) {
                    setActiveMatch(null);
                } else {
                    setActiveMatch(match);
                }

                queryClient.setQueryData(["match", match.id, kicker], match);
                queryClient.invalidateQueries([GOALS, `match_${match.id}`]);
                queryClient.invalidateQueries([MATCHES, 1, kicker]);
                queryClient.invalidateQueries(["todayStats", kicker]);
                queryClient.invalidateQueries(["monthlyDisgraces", kicker]);
                queryClient.invalidateQueries(["mostPlayed", kicker]);
            }

            async function getInitMatch() {
                const match = await getActiveMatch(kicker);
                if (match) {
                    setActiveMatch(match);
                    queryClient.setQueryData(
                        ["match", match.id, kicker],
                        match
                    );
                }
            }

            if (!matchId) {
                getInitMatch();
            }

            const channel = supabase
                .channel("schema-db-changes")
                .on(
                    "postgres_changes",
                    {
                        event: "*",
                        schema: databaseSchema,
                        table: MATCHES,
                    },
                    updateActiveMatch
                )
                .subscribe();

            return () => supabase.removeChannel(channel);
        },
        [kicker, queryClient, matchId]
    );

    return activeMatch;
}
