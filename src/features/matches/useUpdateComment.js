import { useMutation, useQueryClient } from "react-query";
import { useParams } from "react-router-dom";
import { updateComment as updateCommentApi } from "../../services/apiComments";
import { useKicker } from "../../contexts/KickerContext";
import { MATCH_COMMENTS } from "../../utils/constants";
import toast from "react-hot-toast";

export function useUpdateComment() {
    const { matchId } = useParams();
    const { currentKicker: kicker } = useKicker();
    const queryClient = useQueryClient();

    const {
        mutate: updateComment,
        isLoading: isUpdating,
        error,
    } = useMutation({
        mutationFn: ({ commentId, content }) =>
            updateCommentApi({ commentId, content }),
        onSuccess: () => {
            queryClient.invalidateQueries([MATCH_COMMENTS, matchId, kicker]);
            toast.success("Comment updated");
        },
        onError: (error) => {
            toast.error(error.message);
        },
    });

    return {
        updateComment,
        isUpdating,
        error,
    };
}
