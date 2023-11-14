import toast from "react-hot-toast";
import { useMutation, useQueryClient } from "react-query";
import { updatePassword as updatePasswordApi } from "../../services/apiAuth";
import { useNavigate } from "react-router-dom";

export function useUpdatePassword() {
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    const { mutate: updatePassword, isLoading } = useMutation({
        mutationFn: ({ password }) => updatePasswordApi({ password }),
        onSuccess: (data) => {
            toast.success("Password updated successfully");
            queryClient.setQueryData(["user"], data.user);
            navigate(`/user/${data.user.user_metadata.username}/settings`);
        },
        onError: (err) => toast.error(err.message),
    });

    return { updatePassword, isLoading };
}
