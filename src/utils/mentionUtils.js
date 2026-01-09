/**
 * Utility functions for parsing and checking mentions in messages/comments
 */

/**
 * Check if a message/comment content mentions a specific player or @everyone
 * @param {string} content - The message/comment content
 * @param {number} playerId - The player ID to check for
 * @returns {boolean} - True if the player is mentioned or @everyone is used
 */
export function isMentioned(content, playerId) {
    if (!content || !playerId) return false;

    // Check for @everyone
    if (content.includes("@everyone")) {
        return true;
    }

    // Check for direct mention: @[name](playerId)
    // The mention format is @[PlayerName](123)
    const mentionRegex = new RegExp(`@\\[[^\\]]+\\]\\(${playerId}\\)`, "g");
    return mentionRegex.test(content);
}

/**
 * Extract all mentioned player IDs from content
 * @param {string} content - The message/comment content
 * @returns {{ playerIds: number[], hasEveryone: boolean }}
 */
export function extractMentions(content) {
    if (!content) {
        return { playerIds: [], hasEveryone: false };
    }

    const hasEveryone = content.includes("@everyone");

    // Extract all player IDs from @[name](id) patterns
    const mentionRegex = /@\[([^\]]+)\]\((\d+)\)/g;
    const playerIds = [];
    let match;

    while ((match = mentionRegex.exec(content)) !== null) {
        playerIds.push(parseInt(match[2], 10));
    }

    return { playerIds, hasEveryone };
}
