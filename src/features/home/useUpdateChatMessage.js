import { useMutation, useQueryClient } from "react-query";
import { updateChatMessage as updateChatMessageApi } from "../../services/apiChat";
import { useKicker } from "../../contexts/KickerContext";
import { CHAT_MESSAGES } from "../../utils/constants";
import toast from "react-hot-toast";

export function useUpdateChatMessage() {
    const { currentKicker: kicker } = useKicker();
    const queryClient = useQueryClient();

    const {
        mutate: updateChatMessage,
        isLoading: isUpdating,
        error,
    } = useMutation({
        mutationFn: ({ messageId, content }) =>
            updateChatMessageApi({ messageId, content }),
        onSuccess: () => {
            queryClient.invalidateQueries([CHAT_MESSAGES, kicker]);
        },
        onError: (error) => {
            toast.error(error.message);
        },
    });

    return {
        updateChatMessage,
        isUpdating,
        error,
    };
}
