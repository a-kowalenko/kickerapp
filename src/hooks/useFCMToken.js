import { useState, useEffect, useCallback, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";
import supabase, { databaseSchema, supabaseUrl } from "../services/supabase";
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
    const [currentFcmToken, setCurrentFcmToken] = useState(null);

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

    // Get current device's subscription
    const currentDeviceSubscription = useMemo(() => {
        if (!subscriptions || !currentFcmToken) return null;
        return (
            subscriptions.find((s) => s.fcm_token === currentFcmToken) || null
        );
    }, [subscriptions, currentFcmToken]);

    // Mutation to save FCM token using RPC function
    const { mutate: saveToken, isLoading: isSaving } = useMutation({
        mutationFn: async ({ token, deviceInfo }) => {
            if (!userId) throw new Error("User not authenticated");

            // Use RPC function that handles user switching on same device
            const { error } = await supabase
                .schema(databaseSchema)
                .rpc("upsert_fcm_token", {
                    p_fcm_token: token,
                    p_device_info: deviceInfo,
                });

            if (error) throw error;
            setCurrentFcmToken(token);
            return { fcm_token: token };
        },
        onSuccess: () => {
            queryClient.invalidateQueries(["pushSubscription", userId]);
        },
        onError: (error) => {
            console.error("Error saving FCM token:", error);
        },
    });

    // Mutation to delete all subscriptions for user
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

    // Mutation to delete a specific subscription by ID
    const { mutate: deleteSubscriptionById, isLoading: isDeletingById } =
        useMutation({
            mutationFn: async (subscriptionId) => {
                if (!userId) throw new Error("User not authenticated");

                const { error } = await supabase
                    .schema(databaseSchema)
                    .rpc("delete_push_subscription", {
                        p_subscription_id: subscriptionId,
                    });

                if (error) throw error;
            },
            onSuccess: () => {
                queryClient.invalidateQueries(["pushSubscription", userId]);
                toast.success("Device removed");
            },
            onError: (error) => {
                console.error("Error deleting subscription:", error);
                toast.error("Failed to remove device");
            },
        });

    // Mutation to update notification preferences
    const { mutate: updatePreferences, isLoading: isUpdatingPreferences } =
        useMutation({
            mutationFn: async ({
                subscriptionId,
                notifyAllChat,
                notifyMentions,
                notifyTeamInvites,
            }) => {
                if (!userId) throw new Error("User not authenticated");

                const { error } = await supabase
                    .schema(databaseSchema)
                    .rpc("update_notification_preferences", {
                        p_subscription_id: subscriptionId,
                        p_notify_all_chat: notifyAllChat,
                        p_notify_mentions: notifyMentions,
                        p_notify_team_invites: notifyTeamInvites,
                    });

                if (error) throw error;
            },
            onSuccess: () => {
                queryClient.invalidateQueries(["pushSubscription", userId]);
                toast.success("Preferences updated");
            },
            onError: (error) => {
                console.error("Error updating preferences:", error);
                toast.error("Failed to update preferences");
            },
        });

    // State to track which subscription is currently being tested
    const [testingSubscriptionId, setTestingSubscriptionId] = useState(null);

    // Mutation to send test notification to a single device
    const { mutateAsync: sendTestNotificationAsync, isLoading: isSendingTest } =
        useMutation({
            mutationFn: async (subscriptionId) => {
                const { data: sessionData } = await supabase.auth.getSession();
                const accessToken = sessionData?.session?.access_token;

                if (!accessToken) throw new Error("Not authenticated");

                const response = await fetch(
                    `${supabaseUrl}/functions/v1/send-test-notification`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${accessToken}`,
                        },
                        body: JSON.stringify({
                            subscriptionId,
                            databaseSchema,
                        }),
                    }
                );

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(
                        result.error || "Failed to send test notification"
                    );
                }

                return result;
            },
            onError: (error) => {
                console.error("Error sending test notification:", error);
                toast.error(
                    error.message || "Failed to send test notification"
                );
            },
        });

    // Wrapper to send test to single device with tracking
    const sendTestNotification = useCallback(
        async (subscriptionId) => {
            setTestingSubscriptionId(subscriptionId);
            try {
                await sendTestNotificationAsync(subscriptionId);
                toast.success("Test notification sent!");
            } finally {
                setTestingSubscriptionId(null);
            }
        },
        [sendTestNotificationAsync]
    );

    // State for sending to all devices
    const [isSendingToAll, setIsSendingToAll] = useState(false);

    // Send test notification to all devices
    const sendTestToAllDevices = useCallback(async () => {
        if (!subscriptions || subscriptions.length === 0) return;

        setIsSendingToAll(true);
        try {
            const results = await Promise.allSettled(
                subscriptions.map((sub) => sendTestNotificationAsync(sub.id))
            );

            const successCount = results.filter(
                (r) => r.status === "fulfilled"
            ).length;
            const failCount = results.filter(
                (r) => r.status === "rejected"
            ).length;

            if (failCount === 0) {
                toast.success(
                    `Test sent to ${successCount} device${
                        successCount > 1 ? "s" : ""
                    }!`
                );
            } else if (successCount > 0) {
                toast.success(
                    `Test sent to ${successCount}/${subscriptions.length} devices`
                );
            } else {
                toast.error("Failed to send test notifications");
            }
        } finally {
            setIsSendingToAll(false);
        }
    }, [subscriptions, sendTestNotificationAsync]);

    // Get detailed device info for subscription
    const getDeviceInfo = useCallback(() => {
        const ua = navigator.userAgent;
        let deviceType = "desktop";
        let os = "Unknown";
        let osVersion = "";
        let browser = "Unknown";
        let browserVersion = "";
        let deviceModel = "";

        // Detect OS and version
        if (/iPhone/.test(ua)) {
            deviceType = "ios";
            os = "iOS";
            deviceModel = "iPhone";
            const match = ua.match(/iPhone OS (\d+[._]\d+)/);
            if (match) osVersion = match[1].replace("_", ".");
        } else if (/iPad/.test(ua)) {
            deviceType = "ios";
            os = "iPadOS";
            deviceModel = "iPad";
            const match = ua.match(/CPU OS (\d+[._]\d+)/);
            if (match) osVersion = match[1].replace("_", ".");
        } else if (/iPod/.test(ua)) {
            deviceType = "ios";
            os = "iOS";
            deviceModel = "iPod";
            const match = ua.match(/iPhone OS (\d+[._]\d+)/);
            if (match) osVersion = match[1].replace("_", ".");
        } else if (/Android/.test(ua)) {
            deviceType = "android";
            os = "Android";
            const versionMatch = ua.match(/Android (\d+(\.\d+)?)/);
            if (versionMatch) osVersion = versionMatch[1];
            // Try to get device model
            const modelMatch = ua.match(/;\s*([^;)]+)\s*Build/);
            if (modelMatch) deviceModel = modelMatch[1].trim();
        } else if (/Windows NT/.test(ua)) {
            os = "Windows";
            const match = ua.match(/Windows NT (\d+\.\d+)/);
            if (match) {
                const ntVersion = match[1];
                // Map NT version to Windows version
                const versionMap = {
                    "10.0": "10/11",
                    "6.3": "8.1",
                    "6.2": "8",
                    "6.1": "7",
                };
                osVersion = versionMap[ntVersion] || ntVersion;
            }
        } else if (/Mac OS X/.test(ua)) {
            os = "macOS";
            const match = ua.match(/Mac OS X (\d+[._]\d+[._]?\d*)/);
            if (match) osVersion = match[1].replace(/_/g, ".");
        } else if (/Linux/.test(ua)) {
            os = "Linux";
        } else if (/CrOS/.test(ua)) {
            os = "Chrome OS";
        }

        // Detect browser and version
        if (/Edg\//.test(ua)) {
            browser = "Edge";
            const match = ua.match(/Edg\/(\d+(\.\d+)?)/);
            if (match) browserVersion = match[1];
        } else if (/OPR\//.test(ua) || /Opera/.test(ua)) {
            browser = "Opera";
            const match = ua.match(/(?:OPR|Opera)\/(\d+(\.\d+)?)/);
            if (match) browserVersion = match[1];
        } else if (/Chrome\//.test(ua) && !/Chromium/.test(ua)) {
            browser = "Chrome";
            const match = ua.match(/Chrome\/(\d+(\.\d+)?)/);
            if (match) browserVersion = match[1];
        } else if (/Safari\//.test(ua) && !/Chrome/.test(ua)) {
            browser = "Safari";
            const match = ua.match(/Version\/(\d+(\.\d+)?)/);
            if (match) browserVersion = match[1];
        } else if (/Firefox\//.test(ua)) {
            browser = "Firefox";
            const match = ua.match(/Firefox\/(\d+(\.\d+)?)/);
            if (match) browserVersion = match[1];
        } else if (/MSIE|Trident/.test(ua)) {
            browser = "Internet Explorer";
            const match = ua.match(/(?:MSIE |rv:)(\d+(\.\d+)?)/);
            if (match) browserVersion = match[1];
        } else if (/SamsungBrowser/.test(ua)) {
            browser = "Samsung Internet";
            const match = ua.match(/SamsungBrowser\/(\d+(\.\d+)?)/);
            if (match) browserVersion = match[1];
        }

        return JSON.stringify({
            deviceType,
            os,
            osVersion,
            browser,
            browserVersion,
            deviceModel,
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
            // Request permission
            const permissionResult = await Notification.requestPermission();

            if (permissionResult !== "granted") {
                toast.error("Notification permission was not granted");
                return false;
            }

            // Get FCM token
            if (!messaging) {
                toast.error("Notifications not available");
                return false;
            }

            const token = await getToken(messaging, { vapidKey });

            if (!token) {
                toast.error("Failed to get notification token");
                return false;
            }

            // Save token to database
            saveToken({
                token,
                deviceInfo: getDeviceInfo(),
            });

            toast.success("Notifications enabled!");
            return true;
        } catch (error) {
            console.error("Error enabling notifications:", error);
            toast.error("Failed to enable notifications");
            return false;
        } finally {
            setIsRequesting(false);
        }
    }, [userId, notificationStatus.supported, saveToken, getDeviceInfo]);

    // Disable notifications
    const disableNotifications = useCallback(() => {
        deleteSubscription();
    }, [deleteSubscription]);

    // Get current FCM token for device identification (doesn't save, just identifies)
    useEffect(() => {
        if (!userId || !notificationStatus.supported) return;
        if (notificationStatus.permission !== "granted") return;

        const identifyCurrentDevice = async () => {
            const token = await getCurrentToken();
            if (token) {
                setCurrentFcmToken(token);
            }
        };

        identifyCurrentDevice();
    }, [userId, notificationStatus.supported, notificationStatus.permission]);

    // Check and refresh token on mount (for token rotation)
    // Only refreshes if user already has subscriptions (doesn't auto-enable)
    useEffect(() => {
        if (!userId || !notificationStatus.supported) return;
        if (notificationStatus.permission !== "granted") return;
        // Only check for token rotation if user already has subscriptions
        // This prevents auto-enabling after user explicitly disabled
        if (!subscriptions || subscriptions.length === 0) return;

        // Check if token has changed
        const checkToken = async () => {
            const token = await getCurrentToken();
            if (!token) return;

            // Check if this token already exists in subscriptions
            const existingToken = subscriptions?.find(
                (s) => s.fcm_token === token
            );
            if (!existingToken) {
                // Token is new or has changed, save it
                saveToken({
                    token,
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
        console.log("[useFCMToken] Setting up foreground message handler");
        const unsubscribe = onForegroundMessage((payload) => {
            console.log(
                "[useFCMToken] Foreground message callback triggered:",
                payload
            );
            // Get notification data - check both notification and data fields
            const notification = payload.notification || {};
            const data = payload.data || {};

            const title = notification.title || data.title || "KickerApp";
            const body = notification.body || data.body || "";
            // Use unique tag from data, or generate one to ensure notification always shows
            const tag =
                data.tag || `${data.type || "notification"}-${Date.now()}`;

            console.log("[useFCMToken] Showing notification:", {
                title,
                body,
                tag,
                permission: Notification.permission,
            });

            // Show browser notification if permission granted
            if (Notification.permission === "granted") {
                const notif = new Notification(title, {
                    body,
                    icon: "/android-chrome-192x192.png",
                    badge: "/favicon-32x32.png",
                    tag: tag,
                    data: {
                        type: data.type,
                        matchId: data.matchId,
                        kickerId: data.kickerId,
                        url: data.url || "/home",
                    },
                });

                // Handle notification click
                notif.onclick = () => {
                    window.focus();
                    if (data.url) {
                        window.location.href = data.url;
                    }
                    notif.close();
                };
            } else {
                // Fallback to toast if notification permission not granted
                console.log(
                    "[useFCMToken] Permission not granted, showing toast"
                );
                if (title) {
                    toast(body || title, {
                        icon: "🔔",
                        duration: 5000,
                    });
                }
            }
        });

        return unsubscribe;
    }, []);

    return {
        // State
        subscriptions,
        currentDeviceSubscription,
        isEnabled: subscriptions?.length > 0,
        isLoading:
            isLoadingSubscription ||
            isSaving ||
            isDeleting ||
            isDeletingById ||
            isUpdatingPreferences,
        isRequesting,
        isSendingTest,
        isSendingToAll,
        testingSubscriptionId,
        notificationStatus,

        // Actions
        enableNotifications,
        disableNotifications,
        deleteSubscriptionById,
        updatePreferences,
        sendTestNotification,
        sendTestToAllDevices,
    };
}

export default useFCMToken;
