import { useMutation } from "react-query";
import { recover as recoverApi } from "../../services/apiAuth";
import toast from "react-hot-toast";

export function useRecover() {
    const {
        mutate: recover,
        isLoading,
        error,
    } = useMutation({
        mutationFn: ({ email }) => recoverApi({ email }),
        onError: (err) => toast.error(err.message),
    });

    return { recover, isLoading, error };
}
