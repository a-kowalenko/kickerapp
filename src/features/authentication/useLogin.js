import { useMutation, useQueryClient } from "react-query";
import { login as loginApi } from "../../services/apiAuth";
import { joinKicker } from "../../services/apiKicker";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useKicker } from "../../contexts/KickerContext";
import {
    ENTER_KICKER_RETRY_ATTEMPTS,
    ENTER_KICKER_RETRY_INTERVAL,
} from "../../utils/constants";
import {
    requestNotificationPermission,
    getNotificationStatus,
} from "../../services/firebase";
import supabase, { databaseSchema } from "../../services/supabase";

// Helper to save FCM token after login using RPC function
async function saveFCMToken() {
    const status = getNotificationStatus();

    // Only request if notifications are supported and not denied
    if (!status.supported || status.permission === "denied") {
        return;
    }

    try {
        const token = await requestNotificationPermission();
        if (token) {
            // Get device info
            const ua = navigator.userAgent;
            let deviceType = "desktop";
            let os = "unknown";

            if (/iPhone|iPad|iPod/.test(ua)) {
                deviceType = "ios";
                os = "iOS";
            } else if (/Android/.test(ua)) {
                deviceType = "android";
                os = "Android";
            } else if (/Windows/.test(ua)) {
                os = "Windows";
            } else if (/Mac/.test(ua)) {
                os = "macOS";
            }

            const deviceInfo = JSON.stringify({
                deviceType,
                os,
                timestamp: new Date().toISOString(),
            });

            // Use RPC function that handles user switching on same device
            const { error } = await supabase
                .schema(databaseSchema)
                .rpc("upsert_fcm_token", {
                    p_fcm_token: token,
                    p_device_info: deviceInfo,
                });

            if (error) {
                throw error;
            }
        }
    } catch (error) {
        // Don't log or show error - notifications are optional
    }
}

export function useLogin() {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const { tryToJoinKickerAfterLogin, setCurrentKicker } = useKicker();

    const {
        mutate: login,
        isLoading,
        error,
    } = useMutation({
        mutationFn: ({ email, password }) => loginApi({ email, password }),
        onSuccess: async (data) => {
            queryClient.invalidateQueries();
            queryClient.setQueryData(["user"], data);

            // Request notification permission after successful login
            if (data.user?.id) {
                saveFCMToken();
            }

            // Check for pending invite in localStorage
            const pendingInviteStr = localStorage.getItem("pendingInvite");
            if (pendingInviteStr) {
                let pendingInvite = null;
                try {
                    pendingInvite = JSON.parse(pendingInviteStr);
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
                    // If already a member, still select and navigate
                    if (
                        err.message?.includes("already a member") &&
                        pendingInvite?.kickerId
                    ) {
                        setCurrentKicker(pendingInvite.kickerId);
                        navigate("/home", { replace: true });
                        return;
                    }
                    toast.error("Could not join kicker: " + err.message);
                }
            }

            const { kickers } = data;
            if (kickers.length === 1) {
                tryToJoinKickerAfterLogin(
                    kickers[0].id,
                    ENTER_KICKER_RETRY_ATTEMPTS,
                    ENTER_KICKER_RETRY_INTERVAL,
                    () => navigate("/home")
                );
            }
        },
        onError: (err) => toast.error(err.message),
    });

    return { login, isLoading, error };
}
