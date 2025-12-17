import { useQuery, useQueryClient } from "react-query";
import { useParams } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import { getMatchReactions } from "../../services/apiComments";
import { useKicker } from "../../contexts/KickerContext";
import { MATCH_REACTIONS } from "../../utils/constants";
import supabase, { databaseSchema } from "../../services/supabase";

export function useMatchReactions() {
    const { matchId } = useParams();
    const { currentKicker: kicker } = useKicker();
    const queryClient = useQueryClient();
    const [channel, setChannel] = useState(null);

    const {
        data: reactions,
        isLoading,
        error,
    } = useQuery({
        queryKey: [MATCH_REACTIONS, matchId, kicker],
        queryFn: () => getMatchReactions(kicker, Number(matchId)),
        enabled: !!kicker && !!matchId,
    });

    const handleRealtimeUpdate = useCallback(() => {
        queryClient.invalidateQueries([MATCH_REACTIONS, matchId, kicker]);
    }, [queryClient, matchId, kicker]);

    useEffect(() => {
        if (!kicker || !matchId) return;

        const channelInstance = supabase
            .channel(`match-reactions-${matchId}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: databaseSchema,
                    table: MATCH_REACTIONS,
                    filter: `match_id=eq.${matchId}`,
                },
                handleRealtimeUpdate
            )
            .on(
                "postgres_changes",
                {
                    event: "DELETE",
                    schema: databaseSchema,
                    table: MATCH_REACTIONS,
                },
                handleRealtimeUpdate
            )
            .subscribe();

        setChannel(channelInstance);

        return () => {
            if (channelInstance) {
                supabase.removeChannel(channelInstance);
            }
        };
    }, [kicker, matchId, handleRealtimeUpdate]);

    // Group reactions by type with count and list of players
    const groupedReactions = reactions?.reduce((acc, reaction) => {
        const type = reaction.reaction_type;
        if (!acc[type]) {
            acc[type] = {
                type,
                count: 0,
                players: [],
                playerIds: [],
            };
        }
        acc[type].count += 1;
        acc[type].players.push(reaction.player);
        acc[type].playerIds.push(reaction.player_id);
        return acc;
    }, {});

    return {
        reactions: reactions || [],
        groupedReactions: groupedReactions || {},
        isLoading,
        error,
    };
}
