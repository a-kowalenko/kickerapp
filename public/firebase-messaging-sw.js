// Firebase Messaging Service Worker
// This file MUST be in the public folder at the root level for Firebase to work correctly

// Import Firebase scripts using importScripts (required for service workers)
importScripts(
    "https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js"
);
importScripts(
    "https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js"
);

// Firebase configuration - these values will be replaced during build or should match your firebaseConfig.js
// For production, consider injecting these values during build process
const firebaseConfig = {
    apiKey: "AIzaSyDHu_bubnyR8Lez3oOFNHxNulu07LlOyss",
    authDomain: "kickerapp-bbc5b.firebaseapp.com",
    projectId: "kickerapp-bbc5b",
    storageBucket: "kickerapp-bbc5b.firebasestorage.app",
    messagingSenderId: "597231031342",
    appId: "1:597231031342:web:a264b6b3ea6dc12fa83bbf",
    measurementId: "G-90MFG6RJRH",
};

// Initialize Firebase in the service worker
firebase.initializeApp(firebaseConfig);

// Initialize Firebase Cloud Messaging
const messaging = firebase.messaging();

// ============ BADGE COUNT MANAGEMENT ============
const BADGE_DB_NAME = "kickerapp-badge";
const BADGE_STORE_NAME = "badge";
const BADGE_KEY = "unread-count";

// Open IndexedDB for badge count persistence
function openBadgeDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(BADGE_DB_NAME, 1);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(BADGE_STORE_NAME)) {
                db.createObjectStore(BADGE_STORE_NAME);
            }
        };
    });
}

// Get current badge count from IndexedDB
async function getBadgeCount() {
    try {
        const db = await openBadgeDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(BADGE_STORE_NAME, "readonly");
            const store = tx.objectStore(BADGE_STORE_NAME);
            const request = store.get(BADGE_KEY);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result || 0);
        });
    } catch (error) {
        console.error("[SW] Error getting badge count:", error);
        return 0;
    }
}

// Set badge count in IndexedDB
async function setBadgeCount(count) {
    try {
        const db = await openBadgeDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(BADGE_STORE_NAME, "readwrite");
            const store = tx.objectStore(BADGE_STORE_NAME);
            const request = store.put(count, BADGE_KEY);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });
    } catch (error) {
        console.error("[SW] Error setting badge count:", error);
    }
}

// Update the app badge
async function updateAppBadge(count) {
    try {
        if (count > 0) {
            await self.registration.setAppBadge(count);
        } else {
            await self.registration.clearAppBadge();
        }
    } catch (error) {
        // Badge API might not be supported
        console.debug("[SW] App badge update failed:", error);
    }
}

// Increment badge count
async function incrementBadge() {
    const currentCount = await getBadgeCount();
    const newCount = currentCount + 1;
    await setBadgeCount(newCount);
    await updateAppBadge(newCount);
    return newCount;
}

// Clear badge count
async function clearBadge() {
    await setBadgeCount(0);
    await updateAppBadge(0);
}

// ============ MESSAGE HANDLING ============

// Handle background messages (data-only messages)
messaging.onBackgroundMessage(async (payload) => {
    console.log("[SW] Background message received:", payload);

    const notificationData = payload.data || {};
    const notification = payload.notification || {};

    // Build notification title - prefer data field for data-only messages
    const notificationTitle =
        notificationData.title || notification.title || "KickerApp";

    // Build notification options
    const notificationOptions = {
        body: notificationData.body || notification.body || "",
        icon: "/android-chrome-192x192.png",
        badge: "/favicon-32x32.png",
        tag:
            notificationData.tag ||
            `kicker-${notificationData.type || "notification"}-${Date.now()}`,
        renotify: true,
        requireInteraction: false,
        silent: false, // Allow sound
        vibrate: [200, 100, 200], // Vibration pattern for mobile
        // Store data for click handling
        data: {
            type: notificationData.type || "general", // 'comment', 'chat', 'mention'
            matchId: notificationData.matchId || null,
            kickerId: notificationData.kickerId || null,
            url: notificationData.url || "/home",
        },
        // Action buttons (optional)
        actions: notificationData.matchId
            ? [{ action: "view", title: "View" }]
            : [],
    };

    // Set badge count - always use server-provided count (includes chat + comments)
    if (
        notificationData.type === "chat" ||
        notificationData.type === "comment"
    ) {
        const serverBadgeCount = parseInt(notificationData.badge, 10);
        if (!isNaN(serverBadgeCount) && serverBadgeCount > 0) {
            // Use the server-provided badge count (combined chat + comments)
            console.log("[SW] Setting badge from server:", serverBadgeCount);
            await setBadgeCount(serverBadgeCount);
            await updateAppBadge(serverBadgeCount);
        }
        // No fallback increment - badge count should always come from server
        // to ensure accuracy of combined chat + comments count
    }

    // Show the notification
    console.log("[SW] Showing notification:", notificationTitle);
    return self.registration.showNotification(
        notificationTitle,
        notificationOptions
    );
});

// Handle notification click
self.addEventListener("notificationclick", (event) => {
    event.notification.close();

    const data = event.notification.data || {};
    let targetUrl = "/home";

    // Determine navigation based on notification type
    if (data.type === "comment" && data.matchId) {
        targetUrl = `/matches/${data.matchId}`;
    } else if (data.type === "chat") {
        targetUrl = "/home";
    } else if (data.url) {
        targetUrl = data.url;
    }

    // Handle action button clicks
    if (event.action === "view") {
        // Use the determined URL
    }

    // Open or focus the app
    event.waitUntil(
        clients
            .matchAll({ type: "window", includeUncontrolled: true })
            .then(async (clientList) => {
                // Check if app is already open
                for (const client of clientList) {
                    if (client.url.includes(self.location.origin)) {
                        // App is open, focus it and navigate
                        client.focus();
                        client.postMessage({
                            type: "NOTIFICATION_CLICK",
                            url: targetUrl,
                        });
                        return;
                    }
                }
                // App is not open, open new window
                return clients.openWindow(targetUrl);
            })
    );
});

// Handle messages from the main app
self.addEventListener("message", (event) => {
    if (event.data?.type === "CLEAR_BADGE") {
        clearBadge();
    } else if (event.data?.type === "INCREMENT_BADGE") {
        incrementBadge();
    } else if (event.data?.type === "SET_BADGE") {
        const count = event.data.count || 0;
        setBadgeCount(count);
        updateAppBadge(count);
    }
});

// Handle service worker installation
self.addEventListener("install", (event) => {
    self.skipWaiting();
});

// Handle service worker activation
self.addEventListener("activate", (event) => {
    console.log("[firebase-messaging-sw.js] Service Worker activated");
    event.waitUntil(clients.claim());
});
