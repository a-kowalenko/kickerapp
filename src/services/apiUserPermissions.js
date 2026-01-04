import supabase, { databaseSchema } from "./supabase";

// Permission types - add new permissions here
export const PERMISSION_TYPES = {
    CAN_UPLOAD_IMAGES: "can_upload_images",
    // Future permissions can be added here:
    // CAN_PIN_MESSAGES: "can_pin_messages",
    // IS_MODERATOR: "is_moderator",
};

// Permission metadata for UI display
export const PERMISSION_METADATA = {
    [PERMISSION_TYPES.CAN_UPLOAD_IMAGES]: {
        label: "Upload Images",
        description:
            "Allow user to upload images and screenshots in chat and comments",
        icon: "HiPhoto",
    },
    // Add metadata for future permissions here
};

/**
 * Check if a user has a specific permission
 * @param {string} userId - The user ID
 * @param {number} kickerId - The kicker ID
 * @param {string} permissionType - The permission type to check
 * @returns {Promise<boolean>}
 */
export async function hasPermission(userId, kickerId, permissionType) {
    const { data, error } = await supabase
        .schema(databaseSchema)
        .rpc("has_permission", {
            p_user_id: userId,
            p_kicker_id: kickerId,
            p_permission_type: permissionType,
        });

    if (error) {
        console.error("[Permissions] Check error:", error);
        return false;
    }

    return data === true;
}

/**
 * Get all permissions for a user in a kicker
 * @param {string} userId - The user ID
 * @param {number} kickerId - The kicker ID
 * @returns {Promise<Array<{ permission_type: string, granted_at: string }>>}
 */
export async function getUserPermissions(userId, kickerId) {
    const { data, error } = await supabase
        .schema(databaseSchema)
        .rpc("get_user_permissions", {
            p_user_id: userId,
            p_kicker_id: kickerId,
        });

    if (error) {
        console.error("[Permissions] Get user permissions error:", error);
        throw error;
    }

    return data || [];
}

/**
 * Get all users with their permissions for a kicker (admin only)
 * @param {number} kickerId - The kicker ID
 * @returns {Promise<Array>}
 */
export async function getKickerPermissions(kickerId) {
    const { data, error } = await supabase
        .schema(databaseSchema)
        .rpc("get_kicker_permissions", {
            p_kicker_id: kickerId,
        });

    if (error) {
        console.error("[Permissions] Get kicker permissions error:", error);
        throw error;
    }

    // Group permissions by user
    const userMap = new Map();

    for (const row of data || []) {
        const key = row.user_id;
        if (!userMap.has(key)) {
            userMap.set(key, {
                userId: row.user_id,
                playerId: row.player_id,
                playerName: row.player_name,
                playerAvatar: row.player_avatar,
                permissions: {},
            });
        }

        if (row.permission_type) {
            userMap.get(key).permissions[row.permission_type] = {
                granted: true,
                grantedAt: row.granted_at,
            };
        }
    }

    return Array.from(userMap.values());
}

/**
 * Grant a permission to a user (admin only)
 * @param {string} userId - The user ID to grant permission to
 * @param {number} kickerId - The kicker ID
 * @param {string} permissionType - The permission type to grant
 * @returns {Promise<boolean>}
 */
export async function grantPermission(userId, kickerId, permissionType) {
    const { data, error } = await supabase
        .schema(databaseSchema)
        .rpc("grant_permission", {
            p_user_id: userId,
            p_kicker_id: kickerId,
            p_permission_type: permissionType,
        });

    if (error) {
        console.error("[Permissions] Grant error:", error);
        throw error;
    }

    return data === true;
}

/**
 * Revoke a permission from a user (admin only)
 * @param {string} userId - The user ID to revoke permission from
 * @param {number} kickerId - The kicker ID
 * @param {string} permissionType - The permission type to revoke
 * @returns {Promise<boolean>}
 */
export async function revokePermission(userId, kickerId, permissionType) {
    const { data, error } = await supabase
        .schema(databaseSchema)
        .rpc("revoke_permission", {
            p_user_id: userId,
            p_kicker_id: kickerId,
            p_permission_type: permissionType,
        });

    if (error) {
        console.error("[Permissions] Revoke error:", error);
        throw error;
    }

    return data === true;
}
