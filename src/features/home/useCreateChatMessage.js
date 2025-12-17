import { useMutation } from "react-query";
import { createChatMessage as createChatMessageApi } from "../../services/apiChat";
import { useKicker } from "../../contexts/KickerContext";
import toast from "react-hot-toast";

export function useCreateChatMessage() {
    const { currentKicker: kicker } = useKicker();

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
        // Don't invalidate queries here - realtime subscription handles new messages
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
