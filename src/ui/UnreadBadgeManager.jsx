import { useEffect } from "react";
import { useUser } from "../features/authentication/useUser";
import { useUnreadBadge } from "../hooks/useUnreadBadge";

/**
 * Component that manages the unread badge count globally
 * Must be rendered within a protected route where user is authenticated
 */
function UnreadBadgeManager() {
    const { user } = useUser();
    
    // Initialize the badge hook - it handles all the subscription logic
    const { totalUnreadCount } = useUnreadBadge(user?.id);

    // Sync badge with service worker when count changes
    useEffect(() => {
        if (navigator.serviceWorker?.controller) {
            navigator.serviceWorker.controller.postMessage({
                type: "SET_BADGE",
                count: totalUnreadCount,
            });
        }
    }, [totalUnreadCount]);

    // This component doesn't render anything visible
    return null;
}

export default UnreadBadgeManager;
