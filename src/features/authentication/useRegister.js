import { useMutation, useQueryClient } from "react-query";
import { register as registerApi } from "../../services/apiAuth";
import { joinKicker } from "../../services/apiKicker";
import { useNavigate } from "react-router-dom";
import { useKicker } from "../../contexts/KickerContext";
import toast from "react-hot-toast";

export function useRegister() {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const { setCurrentKicker } = useKicker();

    const {
        mutate: register,
        isLoading,
        error,
    } = useMutation({
        mutationFn: ({ username, email, password }) =>
            registerApi({ username, email, password }),
        onSuccess: async (data) => {
            queryClient.setQueryData(["user", data.user]);

            // Check for pending invite in localStorage
            const pendingInviteStr = localStorage.getItem("pendingInvite");
            if (pendingInviteStr) {
                try {
                    const pendingInvite = JSON.parse(pendingInviteStr);
                    if (pendingInvite?.token) {
                        // Auto-join the kicker
                        const kicker = await joinKicker({
                            accessToken: pendingInvite.token,
                        });
                        // Clear pending invite
                        localStorage.removeItem("pendingInvite");
                        // Select the kicker
                        setCurrentKicker(kicker.id);
                        toast.success(
                            `Welcome to ${
                                pendingInvite.kickerName || "the kicker"
                            }!`
                        );
                        navigate("/home", { replace: true });
                        return;
                    }
                } catch (err) {
                    // Clear invalid pending invite
                    localStorage.removeItem("pendingInvite");
                    toast.error("Could not join kicker: " + err.message);
                }
            }

            navigate("/home", { replace: true });
        },
        onError: (err) => toast.error(err.message),
    });

    return { register, isLoading, error };
}
