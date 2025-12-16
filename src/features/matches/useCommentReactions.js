import { useQuery, useQueryClient } from "react-query";
import { useParams } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import { getCommentReactions } from "../../services/apiComments";
import { useKicker } from "../../contexts/KickerContext";
import { COMMENT_REACTIONS } from "../../utils/constants";
import supabase, { databaseSchema } from "../../services/supabase";

export function useCommentReactions(commentIds) {
    const { matchId } = useParams();
    const { currentKicker: kicker } = useKicker();
    const queryClient = useQueryClient();
    const [channel, setChannel] = useState(null);

    const {
        data: reactions,
        isLoading,
        error,
    } = useQuery({
        queryKey: [COMMENT_REACTIONS, matchId, kicker, commentIds],
        queryFn: () => getCommentReactions(kicker, commentIds),
        enabled: !!kicker && !!matchId && commentIds?.length > 0,
    });

    const handleRealtimeUpdate = useCallback(() => {
        queryClient.invalidateQueries([COMMENT_REACTIONS, matchId, kicker]);
    }, [queryClient, matchId, kicker]);

    useEffect(() => {
        if (!kicker || !matchId) return;

        const channelInstance = supabase
            .channel(`comment-reactions-${matchId}`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: databaseSchema,
                    table: COMMENT_REACTIONS,
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

    // Group reactions by comment_id and then by type
    const groupedByComment = reactions?.reduce((acc, reaction) => {
        const commentId = reaction.comment_id;
        const type = reaction.reaction_type;

        if (!acc[commentId]) {
            acc[commentId] = {};
        }

        if (!acc[commentId][type]) {
            acc[commentId][type] = {
                type,
                count: 0,
                players: [],
                playerIds: [],
            };
        }

        acc[commentId][type].count += 1;
        acc[commentId][type].players.push(reaction.player);
        acc[commentId][type].playerIds.push(reaction.player_id);

        return acc;
    }, {});

    return {
        reactions: reactions || [],
        groupedByComment: groupedByComment || {},
        isLoading,
        error,
    };
}
