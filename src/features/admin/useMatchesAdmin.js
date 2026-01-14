import { useMutation, useQuery, useQueryClient } from "react-query";
import { useKicker } from "../../contexts/KickerContext";
import {
    getAdminMatches,
    updateAdminMatch,
    deleteAdminMatch,
} from "../../services/apiAdminMatches";
import toast from "react-hot-toast";

/**
 * Hook to fetch all matches for admin
 */
export function useAdminMatches({
    playerId,
    status,
    gamemode,
    seasonId,
    limit,
} = {}) {
    const { currentKicker } = useKicker();

    const { data, isLoading, error } = useQuery({
        queryKey: [
            "adminMatches",
            currentKicker,
            playerId,
            status,
            gamemode,
            seasonId,
            limit,
        ],
        queryFn: () =>
            getAdminMatches({
                kickerId: currentKicker,
                playerId,
                status,
                gamemode,
                seasonId,
                limit,
            }),
        enabled: !!currentKicker,
    });

    return {
        matches: data,
        isLoading,
        error,
    };
}

/**
 * Hook to update a match
 */
export function useUpdateAdminMatch() {
    const queryClient = useQueryClient();
    const { currentKicker } = useKicker();

    const { mutate: updateMatch, isLoading } = useMutation({
        mutationFn: updateAdminMatch,
        onSuccess: () => {
            queryClient.invalidateQueries(["adminMatches", currentKicker]);
            toast.success("Match updated successfully");
        },
        onError: (error) => {
            toast.error(error.message || "Failed to update match");
        },
    });

    return { updateMatch, isLoading };
}

/**
 * Hook to delete a match
 */
export function useDeleteAdminMatch() {
    const queryClient = useQueryClient();
    const { currentKicker } = useKicker();

    const { mutate: deleteMatch, isLoading } = useMutation({
        mutationFn: deleteAdminMatch,
        onSuccess: () => {
            queryClient.invalidateQueries(["adminMatches", currentKicker]);
            toast.success("Match deleted successfully");
        },
        onError: (error) => {
            toast.error(error.message || "Failed to delete match");
        },
    });

    return { deleteMatch, isLoading };
}
