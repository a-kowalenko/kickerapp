import { useMutation, useQueryClient } from "react-query";
import { useParams } from "react-router-dom";
import { createComment as createCommentApi } from "../../services/apiComments";
import { useKicker } from "../../contexts/KickerContext";
import { MATCH_COMMENTS } from "../../utils/constants";
import toast from "react-hot-toast";

export function useCreateComment() {
    const { matchId } = useParams();
    const { currentKicker: kicker } = useKicker();
    const queryClient = useQueryClient();

    const {
        mutate: createComment,
        isLoading: isCreating,
        error,
    } = useMutation({
        mutationFn: ({ playerId, content }) =>
            createCommentApi({
                matchId: Number(matchId),
                playerId,
                kickerId: kicker,
                content,
            }),
        onSuccess: () => {
            queryClient.invalidateQueries([MATCH_COMMENTS, matchId, kicker]);
        },
        onError: (error) => {
            toast.error(error.message);
        },
    });

    return {
        createComment,
        isCreating,
        error,
    };
}
