import { createContext, useContext, useEffect, useState } from "react";
import supabase, { databaseSchema } from "../services/supabase";
import {
    GOALS,
    MATCHES,
    MATCH_ENDED,
    MATCH_ENDED_BY_CRON,
} from "../utils/constants";
import { getActiveMatch, getMatch } from "../services/apiMatches";
import { useQueryClient } from "react-query";
import { useKicker } from "./KickerContext";
import { useParams } from "react-router-dom";

const MatchContext = createContext();

function MatchProvider({ children }) {
    const { matchId } = useParams();
    const { currentKicker: kicker } = useKicker();
    const [activeMatch, setActiveMatch] = useState(null);
    const queryClient = useQueryClient();

    useEffect(
        function () {
            async function updateActiveMatch(payload) {
                const match = await getMatch({
                    matchId: payload.new.id,
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

            getInitMatch();

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

    return (
        <MatchContext.Provider value={{ activeMatch, setActiveMatch }}>
            {children}
        </MatchContext.Provider>
    );
}

function useMatchContext() {
    const context = useContext(MatchContext);

    if (context === undefined) {
        throw new Error(
            "MatchContext cannot be used outside the MatchProvider"
        );
    }

    return context;
}

export { MatchProvider, useMatchContext };
