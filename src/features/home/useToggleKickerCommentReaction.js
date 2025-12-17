import { useMutation, useQueryClient } from "react-query";
import { toggleCommentReaction as toggleCommentReactionApi } from "../../services/apiComments";
import { useKicker } from "../../contexts/KickerContext";
import toast from "react-hot-toast";

/**
 * Hook to toggle comment reactions in the Kicker-wide comments tab.
 * Unlike useToggleCommentReaction which depends on matchId, this one works across all matches.
 */
export function useToggleKickerCommentReaction() {
    const { currentKicker: kicker } = useKicker();
    const queryClient = useQueryClient();

    const {
        mutate: toggleReaction,
        isLoading: isToggling,
        error,
    } = useMutation({
        mutationFn: ({ commentId, playerId, reactionType }) =>
            toggleCommentReactionApi({
                commentId,
                playerId,
                kickerId: kicker,
                reactionType,
            }),
        onSuccess: () => {
            // Invalidate kicker-wide comment reactions
            queryClient.invalidateQueries(["kicker-comment-reactions", kicker]);
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
