import { useMutation, useQueryClient } from "react-query";
import { deleteMatch as deleteMatchApi } from "../../services/apiMatches";
import toast from "react-hot-toast";
import { useKicker } from "../../contexts/KickerContext";
import { useNavigate } from "react-router-dom";
import { useUser } from "../authentication/useUser";

export function useDeleteMatch() {
    const queryClient = useQueryClient();
    const { currentKicker: kicker } = useKicker();
    const { user } = useUser();
    const navigate = useNavigate();

    const { mutate: deleteMatch, isLoading: isDeleting } = useMutation({
        mutationFn: ({ matchId }) =>
            deleteMatchApi({ matchId, kicker, userId: user?.id }),
        onSuccess: () => {
            toast.success("Match deleted successfully");
            // Invalidate all related queries
            queryClient.invalidateQueries(["match"]);
            queryClient.invalidateQueries(["matches"]);
            queryClient.invalidateQueries(["matchHistory"]);
            queryClient.invalidateQueries(["rankings"]);
            queryClient.invalidateQueries(["seasonRankings"]);
            queryClient.invalidateQueries(["players"]);
            queryClient.invalidateQueries(["player_history"]);
            queryClient.invalidateQueries(["mmrHistory"]);
            queryClient.invalidateQueries(["goals"]);
            // Navigate to matches page
            navigate("/matches");
        },
        onError: (err) => toast.error(err.message),
    });

    return { deleteMatch, isDeleting };
}
