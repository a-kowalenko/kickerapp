import supabase from "./supabase";

// ============ MENTION NOTIFICATIONS ============

/**
 * Get paginated mention notifications with related data
 * @param {number} limit - Number of notifications to fetch
 * @param {number} offset - Offset for pagination
 * @returns {Promise<Array>} Array of notification objects
 */
export async function getMentionNotifications(limit = 50, offset = 0) {
    const { data, error } = await supabase.rpc("get_mention_notifications", {
        p_limit: limit,
        p_offset: offset,
    });

    if (error) {
        console.error("Error fetching mention notifications:", error);
        throw new Error(error.message);
    }

    return data || [];
}

/**
 * Get count of unread mention notifications
 * @returns {Promise<number>} Count of unread notifications
 */
export async function getUnreadMentionCount() {
    const { data, error } = await supabase.rpc("get_unread_mention_count");

    if (error) {
        console.error("Error fetching unread mention count:", error);
        throw new Error(error.message);
    }

    return data || 0;
}

/**
 * Mark a single notification as read
 * @param {number} notificationId - ID of the notification to mark as read
 */
export async function markMentionAsRead(notificationId) {
    const { error } = await supabase.rpc("mark_mention_as_read", {
        p_notification_id: notificationId,
    });

    if (error) {
        console.error("Error marking mention as read:", error);
        throw new Error(error.message);
    }
}

/**
 * Mark all notifications as read
 */
export async function markAllMentionsAsRead() {
    const { error } = await supabase.rpc("mark_all_mentions_as_read");

    if (error) {
        console.error("Error marking all mentions as read:", error);
        throw new Error(error.message);
    }
}
