import { useState, useEffect, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";
import supabase, { databaseSchema } from "../services/supabase";
import {
    requestNotificationPermission,
    getCurrentToken,
    onForegroundMessage,
    getNotificationStatus,
    messaging,
} from "../services/firebase";
import { getToken } from "firebase/messaging";
import { vapidKey } from "../services/firebaseConfig";
import toast from "react-hot-toast";

const PUSH_SUBSCRIPTIONS_TABLE = "push_subscriptions";

/**
 * Hook to manage FCM token and push notification subscriptions
 */
export function useFCMToken(userId) {
    const queryClient = useQueryClient();
    const [isRequesting, setIsRequesting] = useState(false);

    // Get notification status
    const notificationStatus = getNotificationStatus();

    // Query existing subscriptions for this user (can have multiple devices)
    const { data: subscriptions, isLoading: isLoadingSubscription } = useQuery({
        queryKey: ["pushSubscription", userId],
        queryFn: async () => {
            if (!userId) return [];

            const { data, error } = await supabase
                .schema(databaseSchema)
                .from(PUSH_SUBSCRIPTIONS_TABLE)
                .select("*")
                .eq("user_id", userId);

            if (error) {
                console.error("Error fetching push subscription:", error);
                return [];
            }
            return data || [];
        },
        enabled: !!userId,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    // Mutation to save FCM token
    const { mutate: saveToken, isLoading: isSaving } = useMutation({
        mutationFn: async ({ token, deviceInfo }) => {
            if (!userId) throw new Error("User not authenticated");

            // Upsert the token (update if exists, insert if not)
            const { data, error } = await supabase
                .schema(databaseSchema)
                .from(PUSH_SUBSCRIPTIONS_TABLE)
                .upsert(
                    {
                        user_id: userId,
                        fcm_token: token,
                        device_info: deviceInfo,
                        updated_at: new Date().toISOString(),
                    },
                    {
                        onConflict: "fcm_token",
                        ignoreDuplicates: false,
                    }
                )
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(["pushSubscription", userId]);
        },
        onError: (error) => {
            console.error("Error saving FCM token:", error);
        },
    });

    // Mutation to delete subscription
    const { mutate: deleteSubscription, isLoading: isDeleting } = useMutation({
        mutationFn: async () => {
            if (!userId) throw new Error("User not authenticated");

            const { error } = await supabase
                .schema(databaseSchema)
                .from(PUSH_SUBSCRIPTIONS_TABLE)
                .delete()
                .eq("user_id", userId);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries(["pushSubscription", userId]);
            toast.success("Notifications disabled");
        },
        onError: (error) => {
            console.error("Error deleting subscription:", error);
            toast.error("Failed to disable notifications");
        },
    });

    // Get device info for subscription
    const getDeviceInfo = useCallback(() => {
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
        } else if (/Linux/.test(ua)) {
            os = "Linux";
        }

        return JSON.stringify({
            deviceType,
            os,
            browser: navigator.userAgent.split(" ").pop(),
            timestamp: new Date().toISOString(),
        });
    }, []);

    // Request permission and save token
    const enableNotifications = useCallback(async () => {
        if (!userId) {
            toast.error("Please log in to enable notifications");
            return false;
        }

        if (!notificationStatus.supported) {
            toast.error("Notifications are not supported on this device");
            return false;
        }

        setIsRequesting(true);

        try {
            // Debug: Show what happens during permission request
            const permissionBefore = Notification.permission;
            toast(`Before request: ${permissionBefore}`, { duration: 3000 });

            // Request permission directly first
            const permissionResult = await Notification.requestPermission();
            toast(`After request: ${permissionResult}`, { duration: 3000 });

            if (permissionResult !== "granted") {
                toast.error(
                    `Permission not granted. Result: ${permissionResult}`
                );
                return false;
            }

            // Now get the FCM token with better error handling
            toast(`Getting FCM token...`, { duration: 2000 });
            toast(`VAPID Key: ${vapidKey?.substring(0, 30)}...`, {
                duration: 3000,
            });

            try {
                if (!messaging) {
                    toast.error("Firebase messaging not initialized");
                    return false;
                }

                const token = await getToken(messaging, { vapidKey });

                if (!token) {
                    toast.error("getToken returned null/undefined");
                    return false;
                }

                toast.success(`Token: ${token.substring(0, 20)}...`, {
                    duration: 3000,
                });

                // Save token to database
                saveToken({
                    token,
                    deviceInfo: getDeviceInfo(),
                });

                toast.success("Notifications enabled!");
                return true;
            } catch (tokenError) {
                toast.error(`Token error: ${tokenError.message}`, {
                    duration: 5000,
                });
                return false;
            }
        } catch (error) {
            toast.error(`Error: ${error.message}`);
            return false;
        } finally {
            setIsRequesting(false);
        }
    }, [userId, notificationStatus.supported, saveToken, getDeviceInfo]);

    // Disable notifications
    const disableNotifications = useCallback(() => {
        deleteSubscription();
    }, [deleteSubscription]);

    // Check and refresh token on mount (for token rotation)
    useEffect(() => {
        if (!userId || !notificationStatus.supported) return;
        if (notificationStatus.permission !== "granted") return;

        // Check if token has changed
        const checkToken = async () => {
            const currentToken = await getCurrentToken();
            if (!currentToken) return;

            // Check if this token already exists in subscriptions
            const existingToken = subscriptions?.find(
                (s) => s.fcm_token === currentToken
            );
            if (!existingToken) {
                // Token is new or has changed, save it
                saveToken({
                    token: currentToken,
                    deviceInfo: getDeviceInfo(),
                });
            }
        };

        checkToken();
    }, [
        userId,
        subscriptions,
        notificationStatus.supported,
        notificationStatus.permission,
        saveToken,
        getDeviceInfo,
    ]);

    // Set up foreground message handler
    useEffect(() => {
        const unsubscribe = onForegroundMessage((payload) => {
            // Show toast notification when app is in foreground
            const { title, body } = payload.notification || {};
            if (title) {
                toast(body || title, {
                    icon: "🔔",
                    duration: 5000,
                });
            }
        });

        return unsubscribe;
    }, []);

    return {
        // State
        subscriptions,
        isEnabled: subscriptions?.length > 0,
        isLoading: isLoadingSubscription || isSaving || isDeleting,
        isRequesting,
        notificationStatus,

        // Actions
        enableNotifications,
        disableNotifications,
    };
}

export default useFCMToken;
