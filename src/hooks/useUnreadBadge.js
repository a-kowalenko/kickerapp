import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useQueryClient } from "react-query";
import supabase, { databaseSchema } from "../services/supabase";
import { getUnreadMentionCount } from "../services/apiNotifications";

const ORIGINAL_TITLE = "KickerApp";
const MENTION_NOTIFICATIONS_TABLE = "mention_notifications";

// Shared query key - same as in useNotifications.js for cache sharing
const UNREAD_COUNT_QUERY_KEY = "mention-notifications-unread";

/**
 * Hook to manage unread notification badges
 * - Uses mention_notifications as the SINGLE SOURCE OF TRUTH
 * - Updates app badge (PWA) via navigator.setAppBadge
 * - Updates document title with count for browser tabs
 * - Shares the same query cache as NotificationBell for instant sync
 * @param {string} userId - Current user ID
 */
export function useUnreadBadge(userId) {
    const queryClient = useQueryClient();
    const [isAppBadgeSupported, setIsAppBadgeSupported] = useState(false);
    const previousCountRef = useRef(0);

    // Check if App Badge API is supported
    useEffect(() => {
        setIsAppBadgeSupported("setAppBadge" in navigator);
    }, []);

    // Query unread mention count - SAME QUERY KEY as useUnreadMentionCount
    // This ensures NotificationBell and browser badge share the same cache
    const { data: totalUnreadCount = 0, refetch: refetchUnreadCount } =
        useQuery({
            queryKey: [UNREAD_COUNT_QUERY_KEY, userId],
            queryFn: getUnreadMentionCount,
            enabled: !!userId,
            staleTime: 1000 * 10, // 10 seconds - keep in sync with useNotifications
            refetchOnWindowFocus: true,
        });

    // Update app badge (PWA)
    const updateAppBadge = useCallback(
        async (count) => {
            if (!isAppBadgeSupported) return;

            try {
                if (count > 0) {
                    await navigator.setAppBadge(count);
                } else {
                    await navigator.clearAppBadge();
                }
            } catch (error) {
                // Badge API might fail silently in some contexts
                console.debug("App badge update failed:", error);
            }
        },
        [isAppBadgeSupported]
    );

    // Update document title (browser tab)
    const updateDocumentTitle = useCallback((count) => {
        if (count > 0) {
            document.title = `(${count}) ${ORIGINAL_TITLE}`;
        } else {
            document.title = ORIGINAL_TITLE;
        }
    }, []);

    // Clear all badges
    const clearBadge = useCallback(async () => {
        updateDocumentTitle(0);
        await updateAppBadge(0);

        // Notify service worker to clear its badge count
        if (navigator.serviceWorker?.controller) {
            navigator.serviceWorker.controller.postMessage({
                type: "CLEAR_BADGE",
            });
        }
    }, [updateDocumentTitle, updateAppBadge]);

    // Set badge to specific count
    const setBadge = useCallback(
        async (count) => {
            updateDocumentTitle(count);
            await updateAppBadge(count);

            // Sync with service worker
            if (navigator.serviceWorker?.controller) {
                navigator.serviceWorker.controller.postMessage({
                    type: "SET_BADGE",
                    count,
                });
            }
        },
        [updateDocumentTitle, updateAppBadge]
    );

    // Update badges when count changes - THIS IS THE KEY SYNC POINT
    useEffect(() => {
        previousCountRef.current = totalUnreadCount;
        setBadge(totalUnreadCount);
    }, [totalUnreadCount, setBadge]);

    // Subscribe to realtime mention_notifications changes
    // This triggers INSTANT updates when notifications are created/read
    useEffect(() => {
        if (!userId) return;

        const channelName = `badge-mentions-${userId}`;
        const channel = supabase
            .channel(channelName)
            .on(
                "postgres_changes",
                {
                    event: "*", // INSERT, UPDATE (mark as read), DELETE
                    schema: databaseSchema,
                    table: MENTION_NOTIFICATIONS_TABLE,
                    filter: `user_id=eq.${userId}`,
                },
                () => {
                    // Immediately invalidate to trigger refetch
                    // This updates BOTH NotificationBell AND browser badge instantly
                    queryClient.invalidateQueries([
                        UNREAD_COUNT_QUERY_KEY,
                        userId,
                    ]);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId, queryClient]);

    // Handle visibility change (user returns to tab)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible" && userId) {
                // Refetch count when tab becomes visible
                refetchUnreadCount();
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => {
            document.removeEventListener(
                "visibilitychange",
                handleVisibilityChange
            );
        };
    }, [userId, refetchUnreadCount]);

    // Listen for messages from service worker
    useEffect(() => {
        const handleServiceWorkerMessage = (event) => {
            if (event.data?.type === "BADGE_COUNT_UPDATE") {
                refetchUnreadCount();
            }
        };

        navigator.serviceWorker?.addEventListener(
            "message",
            handleServiceWorkerMessage
        );
        return () => {
            navigator.serviceWorker?.removeEventListener(
                "message",
                handleServiceWorkerMessage
            );
        };
    }, [refetchUnreadCount]);

    // Invalidate badge queries to trigger refetch
    const invalidateUnreadBadge = useCallback(() => {
        queryClient.invalidateQueries([UNREAD_COUNT_QUERY_KEY, userId]);
    }, [queryClient, userId]);

    return {
        // State
        totalUnreadCount,
        isAppBadgeSupported,

        // Actions
        clearBadge,
        setBadge,
        refetchUnreadCount,
        invalidateUnreadBadge,
    };
}

export default useUnreadBadge;
