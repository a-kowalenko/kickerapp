import { useMutation, useQueryClient } from "react-query";
import { login as loginApi } from "../../services/apiAuth";
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

// Helper to save FCM token after login
async function saveFCMToken(userId) {
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

            // Check if token already exists for this user
            const { data: existing } = await supabase
                .schema(databaseSchema)
                .from("push_subscriptions")
                .select("id")
                .eq("fcm_token", token)
                .eq("user_id", userId)
                .maybeSingle();

            if (existing) {
                // Token already saved for this user
                return;
            }

            // Delete old tokens for this user + device type
            await supabase
                .schema(databaseSchema)
                .from("push_subscriptions")
                .delete()
                .eq("user_id", userId)
                .like("device_info", `%"deviceType":"${deviceType}"%`);

            // Insert new token
            await supabase
                .schema(databaseSchema)
                .from("push_subscriptions")
                .insert({
                    user_id: userId,
                    fcm_token: token,
                    device_info: deviceInfo,
                });

            console.log("FCM token saved on login");
        }
    } catch (error) {
        // Ignore duplicate key errors - token already exists
        if (error?.code === "23505") {
            return;
        }
        console.error("Error saving FCM token on login:", error);
        // Don't show error to user - notifications are optional
    }
}

export function useLogin() {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const { tryToJoinKickerAfterLogin } = useKicker();

    const {
        mutate: login,
        isLoading,
        error,
    } = useMutation({
        mutationFn: ({ email, password }) => loginApi({ email, password }),
        onSuccess: (data) => {
            queryClient.invalidateQueries();
            queryClient.setQueryData(["user"], data);

            // Request notification permission after successful login
            if (data.user?.id) {
                saveFCMToken(data.user.id);
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
