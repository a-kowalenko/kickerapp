import supabase, { databaseSchema } from "../../services/supabase";

/**
 * Get status display configuration for a kicker
 * @param {number} kickerId - The kicker ID
 * @returns {Promise<Array>} Array of status config objects
 */
export async function getStatusDisplayConfig(kickerId) {
    const { data, error } = await supabase
        .schema(databaseSchema)
        .rpc("get_status_display_config", { p_kicker_id: kickerId });

    if (error) {
        console.error("Error fetching status display config:", error);
        throw error;
    }

    return data || [];
}

/**
 * Update a single status config
 * @param {Object} params
 * @param {number} params.kickerId - The kicker ID
 * @param {string} params.statusKey - The status key to update
 * @param {string} [params.layer] - The layer ('effect', 'overlay', 'background')
 * @param {number} [params.priority] - Priority (higher = shown first)
 * @param {boolean} [params.isExclusive] - Whether only one per layer
 * @param {boolean} [params.isEnabled] - Whether enabled
 * @returns {Promise<boolean>} Success
 */
export async function updateStatusDisplayConfig({
    kickerId,
    statusKey,
    layer,
    priority,
    isExclusive,
    isEnabled,
}) {
    const { data, error } = await supabase
        .schema(databaseSchema)
        .rpc("update_status_display_config", {
            p_kicker_id: kickerId,
            p_status_key: statusKey,
            p_layer: layer,
            p_priority: priority,
            p_is_exclusive: isExclusive,
            p_is_enabled: isEnabled,
        });

    if (error) {
        console.error("Error updating status display config:", error);
        throw error;
    }

    return data;
}

/**
 * Batch update multiple status configs
 * @param {Object} params
 * @param {number} params.kickerId - The kicker ID
 * @param {Array} params.configs - Array of config objects to update
 * @returns {Promise<number>} Number of updated configs
 */
export async function batchUpdateStatusDisplayConfig({ kickerId, configs }) {
    // Convert camelCase to snake_case for DB
    const dbConfigs = configs.map((config) => ({
        status_key: config.statusKey,
        layer: config.layer,
        priority: config.priority,
        is_exclusive: config.isExclusive,
        is_enabled: config.isEnabled,
    }));

    const { data, error } = await supabase
        .schema(databaseSchema)
        .rpc("batch_update_status_display_config", {
            p_kicker_id: kickerId,
            p_configs: dbConfigs,
        });

    if (error) {
        console.error("Error batch updating status display config:", error);
        throw error;
    }

    return data;
}
