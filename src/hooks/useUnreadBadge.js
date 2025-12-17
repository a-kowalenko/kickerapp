import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery } from "react-query";
import supabase, { databaseSchema } from "../services/supabase";
import {
    getTotalUnreadCount,
    getUnreadCountPerKicker,
} from "../services/apiChat";
import { CHAT_MESSAGES } from "../utils/constants";

const ORIGINAL_TITLE = "KickerApp";
const BADGE_QUERY_KEY = "unreadBadgeCount";

/**
 * Hook to manage unread message badges
 * - Updates app badge (PWA) via navigator.setAppBadge
 * - Updates document title with count for browser tabs
 * - Listens to realtime chat message inserts
 * @param {string} userId - Current user ID
 */
export function useUnreadBadge(userId) {
    const [isAppBadgeSupported, setIsAppBadgeSupported] = useState(false);
    const previousCountRef = useRef(0);

    // Check if App Badge API is supported
    useEffect(() => {
        setIsAppBadgeSupported("setAppBadge" in navigator);
    }, []);

    // Query total unread count
    const { data: totalUnreadCount = 0, refetch: refetchUnreadCount } =
        useQuery({
            queryKey: [BADGE_QUERY_KEY, userId],
            queryFn: getTotalUnreadCount,
            enabled: !!userId,
            staleTime: 1000 * 60, // 1 minute
            refetchOnWindowFocus: true,
        });

    // Query unread count per kicker (for detail UI)
    const { data: unreadPerKicker = [], refetch: refetchUnreadPerKicker } =
        useQuery({
            queryKey: [BADGE_QUERY_KEY, "perKicker", userId],
            queryFn: getUnreadCountPerKicker,
            enabled: !!userId,
            staleTime: 1000 * 60, // 1 minute
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

    // Update document title (browser tab fallback)
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
        },
        [updateDocumentTitle, updateAppBadge]
    );

    // Increment badge by 1 (for realtime updates when not in chat)
    const incrementBadge = useCallback(async () => {
        const newCount = previousCountRef.current + 1;
        previousCountRef.current = newCount;
        await setBadge(newCount);

        // Also notify service worker
        if (navigator.serviceWorker?.controller) {
            navigator.serviceWorker.controller.postMessage({
                type: "INCREMENT_BADGE",
            });
        }
    }, [setBadge]);

    // Update badges when count changes
    useEffect(() => {
        previousCountRef.current = totalUnreadCount;
        setBadge(totalUnreadCount);
    }, [totalUnreadCount, setBadge]);

    // Subscribe to realtime chat message inserts
    useEffect(() => {
        if (!userId) return;

        const channel = supabase
            .channel("unread-badge-updates")
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: databaseSchema,
                    table: CHAT_MESSAGES,
                },
                () => {
                    // Refetch unread count when new message arrives
                    // The query will calculate the correct count based on last_read_at
                    refetchUnreadCount();
                    refetchUnreadPerKicker();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId, refetchUnreadCount, refetchUnreadPerKicker]);

    // Handle visibility change (user returns to tab)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible" && userId) {
                // Refetch count when tab becomes visible
                refetchUnreadCount();
                refetchUnreadPerKicker();
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => {
            document.removeEventListener(
                "visibilitychange",
                handleVisibilityChange
            );
        };
    }, [userId, refetchUnreadCount, refetchUnreadPerKicker]);

    // Listen for messages from service worker
    useEffect(() => {
        const handleServiceWorkerMessage = (event) => {
            if (event.data?.type === "BADGE_COUNT_UPDATE") {
                // Service worker is informing us of a badge update
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

    // Get unread count for a specific kicker
    const getUnreadForKicker = useCallback(
        (kickerId) => {
            const found = unreadPerKicker.find((k) => k.kicker_id === kickerId);
            return found?.unread_count || 0;
        },
        [unreadPerKicker]
    );

    return {
        // State
        totalUnreadCount,
        unreadPerKicker,
        isAppBadgeSupported,

        // Actions
        clearBadge,
        setBadge,
        incrementBadge,
        refetchUnreadCount,
        getUnreadForKicker,
    };
}

export default useUnreadBadge;
