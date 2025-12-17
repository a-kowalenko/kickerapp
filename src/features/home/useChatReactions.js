import { useQuery, useQueryClient } from "react-query";
import { useCallback, useEffect } from "react";
import { getChatReactions } from "../../services/apiChat";
import { useKicker } from "../../contexts/KickerContext";
import { CHAT_REACTIONS } from "../../utils/constants";
import supabase, { databaseSchema } from "../../services/supabase";

export function useChatReactions(messageIds) {
    const { currentKicker: kicker } = useKicker();
    const queryClient = useQueryClient();

    const {
        data: reactions,
        isLoading,
        error,
    } = useQuery({
        queryKey: [CHAT_REACTIONS, kicker, messageIds],
        queryFn: () => getChatReactions(kicker, messageIds),
        enabled: !!kicker && messageIds?.length > 0,
    });

    const handleRealtimeUpdate = useCallback(() => {
        queryClient.invalidateQueries([CHAT_REACTIONS, kicker]);
    }, [queryClient, kicker]);

    useEffect(() => {
        if (!kicker || !messageIds?.length) return;

        const channelInstance = supabase
            .channel(`chat-reactions-${kicker}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: databaseSchema,
                    table: CHAT_REACTIONS,
                    filter: `kicker_id=eq.${kicker}`,
                },
                handleRealtimeUpdate
            )
            .on(
                "postgres_changes",
                {
                    event: "DELETE",
                    schema: databaseSchema,
                    table: CHAT_REACTIONS,
                },
                handleRealtimeUpdate
            )
            .subscribe();

        return () => {
            if (channelInstance) {
                supabase.removeChannel(channelInstance);
            }
        };
    }, [kicker, messageIds, handleRealtimeUpdate]);

    // Group reactions by message_id, then by reaction_type
    const groupedByMessage = reactions?.reduce((acc, reaction) => {
        const msgId = reaction.message_id;
        const type = reaction.reaction_type;

        if (!acc[msgId]) {
            acc[msgId] = {};
        }

        if (!acc[msgId][type]) {
            acc[msgId][type] = {
                type,
                count: 0,
                players: [],
                playerIds: [],
            };
        }

        acc[msgId][type].count += 1;
        acc[msgId][type].players.push(reaction.player);
        acc[msgId][type].playerIds.push(reaction.player_id);

        return acc;
    }, {});

    return {
        reactions: reactions || [],
        groupedByMessage: groupedByMessage || {},
        isLoading,
        error,
    };
}
