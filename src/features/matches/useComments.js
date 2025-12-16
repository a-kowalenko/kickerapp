import { useQuery, useQueryClient } from "react-query";
import { useParams } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import { getCommentsByMatch } from "../../services/apiComments";
import { useKicker } from "../../contexts/KickerContext";
import { MATCH_COMMENTS } from "../../utils/constants";
import supabase, { databaseSchema } from "../../services/supabase";

export function useComments() {
    const { matchId } = useParams();
    const { currentKicker: kicker } = useKicker();
    const queryClient = useQueryClient();
    const [channel, setChannel] = useState(null);

    const {
        data: comments,
        isLoading,
        error,
    } = useQuery({
        queryKey: [MATCH_COMMENTS, matchId, kicker],
        queryFn: () => getCommentsByMatch(kicker, Number(matchId)),
        enabled: !!kicker && !!matchId,
    });

    const handleRealtimeUpdate = useCallback(() => {
        queryClient.invalidateQueries([MATCH_COMMENTS, matchId, kicker]);
    }, [queryClient, matchId, kicker]);

    useEffect(() => {
        if (!kicker || !matchId) return;

        const channelInstance = supabase
            .channel(`comments-${matchId}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: databaseSchema,
                    table: MATCH_COMMENTS,
                    filter: `match_id=eq.${matchId}`,
                },
                handleRealtimeUpdate
            )
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: databaseSchema,
                    table: MATCH_COMMENTS,
                    filter: `match_id=eq.${matchId}`,
                },
                handleRealtimeUpdate
            )
            .on(
                "postgres_changes",
                {
                    event: "DELETE",
                    schema: databaseSchema,
                    table: MATCH_COMMENTS,
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

    return {
        comments: comments || [],
        isLoading,
        error,
    };
}
