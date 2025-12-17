import { useMutation, useQueryClient } from "react-query";
import { useParams } from "react-router-dom";
import {
    toggleMatchReaction as toggleMatchReactionApi,
    toggleCommentReaction as toggleCommentReactionApi,
} from "../../services/apiComments";
import { useKicker } from "../../contexts/KickerContext";
import { MATCH_REACTIONS, COMMENT_REACTIONS } from "../../utils/constants";
import toast from "react-hot-toast";

export function useToggleMatchReaction() {
    const { matchId } = useParams();
    const { currentKicker: kicker } = useKicker();
    const queryClient = useQueryClient();

    const {
        mutate: toggleReaction,
        isLoading: isToggling,
        error,
    } = useMutation({
        mutationFn: ({ playerId, reactionType }) =>
            toggleMatchReactionApi({
                matchId: Number(matchId),
                playerId,
                kickerId: kicker,
                reactionType,
            }),
        onSuccess: () => {
            queryClient.invalidateQueries([MATCH_REACTIONS, matchId, kicker]);
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

export function useToggleCommentReaction() {
    const { matchId } = useParams();
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
            queryClient.invalidateQueries([COMMENT_REACTIONS, matchId, kicker]);
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
