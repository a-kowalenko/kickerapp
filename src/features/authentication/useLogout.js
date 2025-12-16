import { useMutation, useQueryClient } from "react-query";
import { logout as logoutApi } from "../../services/apiAuth";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export function useLogout() {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const { mutate: logout, isLoading } = useMutation({
        mutationFn: logoutApi,
        onSuccess: () => {
            // Clear all cached queries
            queryClient.clear();

            // Clear kicker selection from localStorage
            localStorage.removeItem("currentKicker");

            navigate("/");
            toast.success("You were logged out successfully");
        },
        onError: (err) => toast.error(err.message),
    });

    return { logout, isLoading };
}
