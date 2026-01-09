import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { firebaseConfig, vapidKey } from "./firebaseConfig";

// Initialize Firebase
let app;
let messaging;

try {
    app = initializeApp(firebaseConfig);
    // Messaging is only available in browsers that support it
    if (typeof window !== "undefined" && "Notification" in window) {
        messaging = getMessaging(app);
    }
} catch (error) {
    console.error("Firebase initialization error:", error);
}

/**
 * Request notification permission and get FCM token
 * @returns {Promise<string|null>} FCM token or null if permission denied/error
 */
export async function requestNotificationPermission() {
    if (!messaging) {
        console.warn("Firebase messaging not available");
        return null;
    }

    try {
        const permission = await Notification.requestPermission();

        if (permission !== "granted") {
            return null;
        }

        // Get FCM token
        const token = await getToken(messaging, { vapidKey });
        if (token) {
            return token;
        } else {
            return null;
        }
    } catch (error) {
        console.error("Error getting FCM token:", error);
        return null;
    }
}

/**
 * Get current FCM token without requesting permission
 * @returns {Promise<string|null>} FCM token or null
 */
export async function getCurrentToken() {
    if (!messaging) {
        return null;
    }

    try {
        const permission = Notification.permission;
        if (permission !== "granted") {
            return null;
        }

        const token = await getToken(messaging, { vapidKey });
        return token || null;
    } catch (error) {
        console.error("Error getting current FCM token:", error);
        return null;
    }
}

/**
 * Set up foreground message handler
 * @param {Function} callback - Function to call when message received
 * @returns {Function} Unsubscribe function
 */
export function onForegroundMessage(callback) {
    if (!messaging) {
        console.warn(
            "[Firebase] Messaging not available for foreground handler"
        );
        return () => {};
    }

    console.log("[Firebase] Setting up foreground message handler");
    return onMessage(messaging, (payload) => {
        console.log("[Firebase] Foreground message received:", payload);
        callback(payload);
    });
}

/**
 * Check if notifications are supported and permission status
 * @returns {{supported: boolean, permission: string, isIOS: boolean, isPWA: boolean}}
 */
export function getNotificationStatus() {
    const isIOSDevice =
        /iPhone|iPad|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isPWAInstalled =
        window.matchMedia("(display-mode: standalone)").matches ||
        window.navigator.standalone === true;

    // iOS Safari (non-PWA) doesn't support push notifications at all
    if (isIOSDevice && !isPWAInstalled) {
        return {
            supported: false,
            permission: "unsupported",
            isIOS: true,
            isPWA: false,
        };
    }

    if (typeof window === "undefined" || !("Notification" in window)) {
        return {
            supported: false,
            permission: "unsupported",
            isIOS: isIOSDevice,
            isPWA: isPWAInstalled,
        };
    }

    const permission = Notification.permission;

    // On iOS PWA, permission shows as "denied" initially even when never asked
    // We treat "denied" on iOS PWA as "default" (not yet asked)
    const effectivePermission =
        isIOSDevice && isPWAInstalled && permission === "denied"
            ? "default"
            : permission;

    return {
        supported: true,
        permission: effectivePermission,
        isIOS: isIOSDevice,
        isPWA: isPWAInstalled,
    };
}

/**
 * Check if the app is running as a PWA (installed)
 * @returns {boolean}
 */
export function isPWA() {
    return (
        window.matchMedia("(display-mode: standalone)").matches ||
        window.navigator.standalone === true
    );
}

export { app, messaging };
