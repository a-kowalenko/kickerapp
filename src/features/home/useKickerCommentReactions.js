import { useQuery, useQueryClient } from "react-query";
import { useCallback, useEffect } from "react";
import { getCommentReactions } from "../../services/apiComments";
import { useKicker } from "../../contexts/KickerContext";
import { COMMENT_REACTIONS } from "../../utils/constants";
import supabase, { databaseSchema } from "../../services/supabase";

/**
 * Hook to fetch reactions for comments in the Kicker-wide comments tab.
 * Unlike useCommentReactions which depends on matchId, this one works across all matches.
 */
export function useKickerCommentReactions(commentIds) {
    const { currentKicker: kicker } = useKicker();
    const queryClient = useQueryClient();

    const {
        data: reactions,
        isLoading,
        error,
    } = useQuery({
        queryKey: ["kicker-comment-reactions", kicker, commentIds],
        queryFn: () => getCommentReactions(kicker, commentIds),
        enabled: !!kicker && commentIds?.length > 0,
    });

    const handleRealtimeUpdate = useCallback(() => {
        queryClient.invalidateQueries(["kicker-comment-reactions", kicker]);
    }, [queryClient, kicker]);

    useEffect(() => {
        if (!kicker) return;

        const channelInstance = supabase
            .channel(`kicker-comment-reactions-${kicker}`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: databaseSchema,
                    table: COMMENT_REACTIONS,
                    filter: `kicker_id=eq.${kicker}`,
                },
                handleRealtimeUpdate
            )
            .subscribe();

        return () => {
            if (channelInstance) {
                supabase.removeChannel(channelInstance);
            }
        };
    }, [kicker, handleRealtimeUpdate]);

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
