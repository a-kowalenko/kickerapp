import { useMutation, useQueryClient } from "react-query";
import { logout as logoutApi } from "../../services/apiAuth";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import supabase, { databaseSchema } from "../../services/supabase";
import { getCurrentToken } from "../../services/firebase";

// Delete FCM token before logout so next user can use it
async function deleteFCMToken() {
    try {
        const token = await getCurrentToken();
        if (token) {
            await supabase
                .schema(databaseSchema)
                .from("push_subscriptions")
                .delete()
                .eq("fcm_token", token);
        }
    } catch (error) {
        // Ignore errors - logout should still proceed
    }
}

export function useLogout() {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const { mutate: logout, isLoading } = useMutation({
        mutationFn: async () => {
            // Delete FCM token first (while still authenticated)
            await deleteFCMToken();
            // Then logout
            return logoutApi();
        },
        onSuccess: () => {
            // Clear all cached queries
            queryClient.clear();

            // Clear kicker selection from localStorage
            // Set to JSON null to properly trigger useLocalStorageState update
            localStorage.setItem("currentKicker", JSON.stringify(null));

            // Dispatch storage event manually for same-window updates
            window.dispatchEvent(
                new StorageEvent("storage", {
                    key: "currentKicker",
                    newValue: JSON.stringify(null),
                    oldValue: localStorage.getItem("currentKicker"),
                })
            );

            navigate("/");
            toast.success("You were logged out successfully");
        },
        onError: (err) => toast.error(err.message),
    });

    return { logout, isLoading };
}
