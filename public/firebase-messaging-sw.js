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

// Handle background messages (data-only messages)
messaging.onBackgroundMessage((payload) => {
    console.log(
        "[firebase-messaging-sw.js] Received background message:",
        payload
    );

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

    console.log(
        "[firebase-messaging-sw.js] Showing notification:",
        notificationTitle,
        notificationOptions
    );

    // Show the notification
    return self.registration.showNotification(
        notificationTitle,
        notificationOptions
    );
});

// Handle notification click
self.addEventListener("notificationclick", (event) => {
    console.log("[firebase-messaging-sw.js] Notification clicked:", event);

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
            .then((clientList) => {
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

// Handle service worker installation
self.addEventListener("install", (event) => {
    console.log("[firebase-messaging-sw.js] Service Worker installing...");
    self.skipWaiting();
});

// Handle service worker activation
self.addEventListener("activate", (event) => {
    console.log("[firebase-messaging-sw.js] Service Worker activated");
    event.waitUntil(clients.claim());
});
