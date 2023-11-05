import toast from "react-hot-toast";
import { useMutation, useQueryClient } from "react-query";
import { updateCurrentUser } from "../../services/apiAuth";
import { useNavigate } from "react-router-dom";

export function useUpdateUser() {
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    const { mutate: updateUser, isLoading: isUpdating } = useMutation({
        mutationFn: ({ username, avatar }) =>
            updateCurrentUser({ username, avatar }),
        onSuccess: (data) => {
            toast.success("User updated successfully");
            queryClient.setQueryData(["user"], data.user);
            navigate(`/user/${data.user.user_metadata.username}/settings`);
        },
        onError: (err) => toast.error(err.message),
    });

    return { updateUser, isUpdating };
}
