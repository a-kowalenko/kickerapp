import toast from "react-hot-toast";
import { useMutation, useQueryClient } from "react-query";
import { updateCurrentUser } from "../../services/apiAuth";
import { useNavigate } from "react-router-dom";
import { useKicker } from "../../contexts/KickerContext";

export function useUpdateUser() {
    const queryClient = useQueryClient();
    const { currentKicker: kicker } = useKicker();
    const navigate = useNavigate();

    const { mutate: updateUser, isLoading: isUpdating } = useMutation({
        mutationFn: ({ username, avatar }) =>
            updateCurrentUser({ username, avatar, kicker }),
        onSuccess: (data) => {
            toast.success("User updated successfully");
            queryClient.invalidateQueries(["ownPlayer"], kicker);
            navigate(`/user/${data.name}/settings`);
        },
        onError: (err) => toast.error(err.message),
    });

    return { updateUser, isUpdating };
}
