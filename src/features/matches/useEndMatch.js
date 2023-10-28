import { useMutation, useQueryClient } from "react-query";
import { endMatch as endMatchApi } from "../../services/apiMatches";
import toast from "react-hot-toast";

export function useEndMatch() {
    const queryClient = useQueryClient();
    const { mutate: endMatch, isLoading } = useMutation({
        mutationFn: endMatchApi,
        onSuccess: (data) => {
            toast.success(`Match ${data.id} finished`);
            queryClient.invalidateQueries(["match"], data.id);
        },
        onError: (err) => toast.error(err),
    });

    return { endMatch, isLoading };
}
