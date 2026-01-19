import { useMutation, useQueryClient } from "react-query";
import { createChatMessage as createChatMessageApi } from "../../services/apiChat";
import { useKicker } from "../../contexts/KickerContext";
import { useOwnPlayer } from "../../hooks/useOwnPlayer";
import { CHAT_MESSAGES } from "../../utils/constants";
import toast from "react-hot-toast";

export function useCreateChatMessage() {
    const { currentKicker: kicker } = useKicker();
    const { data: currentPlayer } = useOwnPlayer();
    const currentPlayerId = currentPlayer?.id;
    const queryClient = useQueryClient();

    const {
        mutate: createChatMessage,
        isLoading: isCreating,
        error,
    } = useMutation({
        mutationFn: ({ playerId, content, replyToId, recipientId }) =>
            createChatMessageApi({
                playerId,
                kickerId: kicker,
                content,
                replyToId,
                recipientId,
            }),
        // Invalidate as backup in case realtime subscription is disconnected
        onSuccess: () => {
            queryClient.invalidateQueries([
                CHAT_MESSAGES,
                kicker,
                currentPlayerId,
            ]);
        },
        onError: (error) => {
            toast.error(error.message);
        },
    });

    return {
        createChatMessage,
        isCreating,
        error,
    };
}
