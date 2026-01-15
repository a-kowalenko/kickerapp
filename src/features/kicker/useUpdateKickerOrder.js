import { useMutation, useQueryClient } from "react-query";
import { updateKickerOrder } from "../../services/apiKicker";
import toast from "react-hot-toast";

export function useUpdateKickerOrder() {
    const queryClient = useQueryClient();

    const { mutate: reorderKickers, isLoading: isReordering } = useMutation({
        mutationFn: updateKickerOrder,
        onSuccess: () => {
            queryClient.invalidateQueries(["kickers"]);
        },
        onError: (error) => {
            toast.error(`Failed to save order: ${error.message}`);
            // Refetch to restore original order
            queryClient.invalidateQueries(["kickers"]);
        },
    });

    return { reorderKickers, isReordering };
}
