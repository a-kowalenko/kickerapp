import { useMutation, useQueryClient } from "react-query";
import { endMatch as endMatchApi } from "../../services/apiMatches";
import toast from "react-hot-toast";
import { useKicker } from "../../contexts/KickerContext";

export function useEndMatch() {
    const queryClient = useQueryClient();
    const { currentKicker: kicker } = useKicker();

    const { mutate: endMatch, isLoading } = useMutation({
        mutationFn: ({ id, score1, score2 }) =>
            endMatchApi({ id, score1, score2, kicker }),
        onSuccess: (data) => {
            toast.success(`Match ${data.id} finished`);
            queryClient.invalidateQueries(["match"], data.id);
        },
        onError: (err) => toast.error(err),
    });

    return { endMatch, isLoading };
}
