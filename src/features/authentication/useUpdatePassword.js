import toast from "react-hot-toast";
import { useMutation, useQueryClient } from "react-query";
import { updatePassword as updatePasswordApi } from "../../services/apiAuth";

export function useUpdatePassword() {
    const queryClient = useQueryClient();

    const { mutate: updatePassword, isLoading } = useMutation({
        mutationFn: ({ password }) => updatePasswordApi({ password }),
        onSuccess: (data) => {
            toast.success("Password updated successfully");
            queryClient.setQueryData(["user"], data.user);
        },
        onError: (err) => toast.error(err.message),
    });

    return { updatePassword, isLoading };
}
