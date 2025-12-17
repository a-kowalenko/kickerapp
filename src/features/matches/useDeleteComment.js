import { useMutation, useQueryClient } from "react-query";
import { useParams } from "react-router-dom";
import { deleteComment as deleteCommentApi } from "../../services/apiComments";
import { useKicker } from "../../contexts/KickerContext";
import { MATCH_COMMENTS } from "../../utils/constants";
import toast from "react-hot-toast";

export function useDeleteComment() {
    const { matchId } = useParams();
    const { currentKicker: kicker } = useKicker();
    const queryClient = useQueryClient();

    const {
        mutate: deleteComment,
        isLoading: isDeleting,
        error,
    } = useMutation({
        mutationFn: (commentId) => deleteCommentApi(commentId),
        onSuccess: () => {
            queryClient.invalidateQueries([MATCH_COMMENTS, matchId, kicker]);
            toast.success("Comment deleted");
        },
        onError: (error) => {
            toast.error(error.message);
        },
    });

    return {
        deleteComment,
        isDeleting,
        error,
    };
}
