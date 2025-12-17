import { useMutation, useQueryClient } from "react-query";
import { toggleChatReaction as toggleChatReactionApi } from "../../services/apiChat";
import { useKicker } from "../../contexts/KickerContext";
import { CHAT_REACTIONS } from "../../utils/constants";
import toast from "react-hot-toast";

export function useToggleChatReaction() {
    const { currentKicker: kicker } = useKicker();
    const queryClient = useQueryClient();

    const {
        mutate: toggleReaction,
        isLoading: isToggling,
        error,
    } = useMutation({
        mutationFn: ({ messageId, playerId, reactionType }) =>
            toggleChatReactionApi({
                messageId,
                playerId,
                kickerId: kicker,
                reactionType,
            }),
        onSuccess: () => {
            queryClient.invalidateQueries([CHAT_REACTIONS, kicker]);
        },
        onError: (error) => {
            toast.error(error.message);
        },
    });

    return {
        toggleReaction,
        isToggling,
        error,
    };
}
