import { useMutation, useQueryClient } from "react-query";
import { register as registerApi } from "../../services/apiAuth";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export function useRegister() {
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    const {
        mutate: register,
        isLoading,
        error,
    } = useMutation({
        mutationFn: ({ username, email, password }) =>
            registerApi({ username, email, password }),
        onSuccess: (data) => {
            queryClient.setQueryData(["user", data.user]);
            navigate("/home", { replace: true });
        },
        onError: (err) => toast.error(err.message),
    });

    return { register, isLoading, error };
}
