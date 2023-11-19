import { useMutation, useQueryClient } from "react-query";
import { useKicker } from "../../contexts/KickerContext";
import {
    scoreGoal as scoreGoalApi,
    scoreOwnGoal as scoreOwnGoalApi,
    undoLastAction as undoLastActionApi,
} from "../../services/apiMatches";
import toast from "react-hot-toast";
import { useParams } from "react-router-dom";

export function useUpdateMatch() {
    const { currentKicker: kicker } = useKicker();
    const queryClient = useQueryClient();
    const { matchId } = useParams();

    const {
        mutate: scoreGoal,
        isLoading: isScoringGoal,
        error: scoringGoalError,
    } = useMutation({
        mutationFn: ({ playerId }) => scoreGoalApi(playerId, matchId, kicker),
        onSuccess: (data) => {
            queryClient.setQueryData(["match", Number(matchId), kicker], data);
            toast.success("Goal scored");
        },
        onError: (data) => {
            toast.error(data.message);
        },
    });

    const {
        mutate: scoreOwnGoal,
        isLoading: isScoringOwnGoal,
        error: scoringOwnGoalError,
    } = useMutation({
        mutationFn: ({ playerId }) =>
            scoreOwnGoalApi(playerId, matchId, kicker),
        onSuccess: (data) => {
            queryClient.setQueryData(["match", Number(matchId), kicker], data);
            toast.success("Own Goal scored");
        },
        onError: (data) => {
            toast.error(data.message);
        },
    });

    const {
        mutate: undoLastAction,
        isLoading: isUndoingLastAction,
        error: undoLastActionError,
    } = useMutation({
        mutationFn: () => undoLastActionApi(matchId, kicker),
        onSuccess: (data) => {
            queryClient.setQueryData(["match", Number(matchId), kicker], data);
            toast.success("Undo success");
        },
        onError: (data) => {
            toast.error(data.message);
        },
    });

    return {
        scoreGoal,
        isScoringGoal,
        scoringGoalError,
        scoreOwnGoal,
        isScoringOwnGoal,
        scoringOwnGoalError,
        undoLastAction,
        isUndoingLastAction,
        undoLastActionError,
    };
}
