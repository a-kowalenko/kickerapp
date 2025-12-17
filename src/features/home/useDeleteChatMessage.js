import { useMutation, useQueryClient } from "react-query";
import { deleteChatMessage as deleteChatMessageApi } from "../../services/apiChat";
import { useKicker } from "../../contexts/KickerContext";
import { CHAT_MESSAGES } from "../../utils/constants";
import toast from "react-hot-toast";

export function useDeleteChatMessage() {
    const { currentKicker: kicker } = useKicker();
    const queryClient = useQueryClient();

    const {
        mutate: deleteChatMessage,
        isLoading: isDeleting,
        error,
    } = useMutation({
        mutationFn: (messageId) => deleteChatMessageApi(messageId),
        onSuccess: () => {
            queryClient.invalidateQueries([CHAT_MESSAGES, kicker]);
        },
        onError: (error) => {
            toast.error(error.message);
        },
    });

    return {
        deleteChatMessage,
        isDeleting,
        error,
    };
}
