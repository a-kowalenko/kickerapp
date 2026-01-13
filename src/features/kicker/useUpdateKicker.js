import { useMutation, useQueryClient } from "react-query";
import { updateKicker as updateKickerApi } from "../../services/apiKicker";
import toast from "react-hot-toast";

export function useUpdateKicker() {
    const queryClient = useQueryClient();

    const { mutate: updateKicker, isLoading: isUpdating } = useMutation({
        mutationFn: updateKickerApi,
        onSuccess: (data) => {
            queryClient.invalidateQueries(["kicker"]);
            queryClient.invalidateQueries(["kicker-info"]);
            toast.success("Kicker updated successfully");
        },
        onError: (error) => {
            toast.error(error.message || "Failed to update kicker");
        },
    });

    return { updateKicker, isUpdating };
}
