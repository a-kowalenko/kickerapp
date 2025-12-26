import {
    CHAT_MESSAGES,
    CHAT_REACTIONS,
    CHAT_TYPING,
    PLAYER,
    CHAT_PAGE_SIZE,
} from "../utils/constants";
import supabase from "./supabase";

// ============ CHAT MESSAGES ============

export async function getChatMessages(
    kicker,
    { offset = 0, limit = CHAT_PAGE_SIZE } = {}
) {
    // First fetch messages with player and recipient joins
    const { data: messages, error } = await supabase
        .from(CHAT_MESSAGES)
        .select(
            `*, 
            player: ${PLAYER}!${CHAT_MESSAGES}_player_id_fkey (*),
            recipient: ${PLAYER}!${CHAT_MESSAGES}_recipient_id_fkey (*)`
        )
        .eq("kicker_id", kicker)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

    if (error) {
        throw new Error(error.message);
    }

    // Fetch reply_to messages separately for self-reference
    const replyToIds = messages
        .filter((m) => m.reply_to_id)
        .map((m) => m.reply_to_id);

    if (replyToIds.length > 0) {
        const { data: replyMessages } = await supabase
            .from(CHAT_MESSAGES)
            .select(
                `id, content, player: ${PLAYER}!${CHAT_MESSAGES}_player_id_fkey (id, name, avatar)`
            )
            .in("id", replyToIds);

        // Map reply_to data to messages
        const replyMap = {};
        replyMessages?.forEach((r) => {
            replyMap[r.id] = r;
        });

        messages.forEach((m) => {
            m.reply_to = m.reply_to_id ? replyMap[m.reply_to_id] || null : null;
        });
    } else {
        messages.forEach((m) => {
            m.reply_to = null;
        });
    }

    return messages;
}

export async function getChatMessageById(messageId) {
    const { data: message, error } = await supabase
        .from(CHAT_MESSAGES)
        .select(
            `*, 
            player: ${PLAYER}!${CHAT_MESSAGES}_player_id_fkey (*),
            recipient: ${PLAYER}!${CHAT_MESSAGES}_recipient_id_fkey (*)`
        )
        .eq("id", messageId)
        .single();

    if (error) {
        throw new Error(error.message);
    }

    // Fetch reply_to separately if exists
    if (message?.reply_to_id) {
        const { data: replyMessage } = await supabase
            .from(CHAT_MESSAGES)
            .select(
                `id, content, player: ${PLAYER}!${CHAT_MESSAGES}_player_id_fkey (id, name, avatar)`
            )
            .eq("id", message.reply_to_id)
            .single();

        message.reply_to = replyMessage || null;
    } else {
        message.reply_to = null;
    }

    return message;
}

export async function createChatMessage({
    playerId,
    kickerId,
    content,
    replyToId = null,
    recipientId = null,
}) {
    const { data, error } = await supabase
        .from(CHAT_MESSAGES)
        .insert({
            player_id: playerId,
            kicker_id: kickerId,
            content,
            reply_to_id: replyToId,
            recipient_id: recipientId,
        })
        .select(
            `*, 
            player: ${PLAYER}!${CHAT_MESSAGES}_player_id_fkey (*),
            recipient: ${PLAYER}!${CHAT_MESSAGES}_recipient_id_fkey (*)`
        )
        .single();

    if (error) {
        throw new Error(error.message);
    }

    // Fetch reply_to separately if exists
    if (data?.reply_to_id) {
        const { data: replyMessage } = await supabase
            .from(CHAT_MESSAGES)
            .select(
                `id, content, player: ${PLAYER}!${CHAT_MESSAGES}_player_id_fkey (id, name, avatar)`
            )
            .eq("id", data.reply_to_id)
            .single();

        data.reply_to = replyMessage || null;
    } else {
        data.reply_to = null;
    }

    return data;
}

export async function updateChatMessage({ messageId, content }) {
    const { data, error } = await supabase
        .from(CHAT_MESSAGES)
        .update({
            content,
            edited_at: new Date().toISOString(),
        })
        .eq("id", messageId)
        .select(
            `*, 
            player: ${PLAYER}!${CHAT_MESSAGES}_player_id_fkey (*),
            recipient: ${PLAYER}!${CHAT_MESSAGES}_recipient_id_fkey (*)`
        )
        .single();

    if (error) {
        throw new Error(error.message);
    }

    // Fetch reply_to separately if exists
    if (data?.reply_to_id) {
        const { data: replyMessage } = await supabase
            .from(CHAT_MESSAGES)
            .select(
                `id, content, player: ${PLAYER}!${CHAT_MESSAGES}_player_id_fkey (id, name, avatar)`
            )
            .eq("id", data.reply_to_id)
            .single();

        data.reply_to = replyMessage || null;
    } else {
        data.reply_to = null;
    }

    return data;
}

export async function deleteChatMessage(messageId) {
    const { error } = await supabase
        .from(CHAT_MESSAGES)
        .delete()
        .eq("id", messageId);

    if (error) {
        throw new Error(error.message);
    }

    return { success: true };
}

// ============ CHAT REACTIONS ============

export async function getChatReactions(kicker, messageIds) {
    if (!messageIds || messageIds.length === 0) {
        return [];
    }

    const { data, error } = await supabase
        .from(CHAT_REACTIONS)
        .select(
            `*, 
            player: ${PLAYER}!${CHAT_REACTIONS}_player_id_fkey (*)`
        )
        .eq("kicker_id", kicker)
        .in("message_id", messageIds);

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

export async function addChatReaction({
    messageId,
    playerId,
    kickerId,
    reactionType,
}) {
    const { data, error } = await supabase
        .from(CHAT_REACTIONS)
        .insert({
            message_id: messageId,
            player_id: playerId,
            kicker_id: kickerId,
            reaction_type: reactionType,
        })
        .select(
            `*, 
            player: ${PLAYER}!${CHAT_REACTIONS}_player_id_fkey (*)`
        )
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

export async function removeChatReaction({
    messageId,
    playerId,
    reactionType,
}) {
    const { error } = await supabase
        .from(CHAT_REACTIONS)
        .delete()
        .eq("message_id", messageId)
        .eq("player_id", playerId)
        .eq("reaction_type", reactionType);

    if (error) {
        throw new Error(error.message);
    }

    return { success: true };
}

export async function toggleChatReaction({
    messageId,
    playerId,
    kickerId,
    reactionType,
}) {
    // Check if reaction exists
    const { data: existing } = await supabase
        .from(CHAT_REACTIONS)
        .select("id")
        .eq("message_id", messageId)
        .eq("player_id", playerId)
        .eq("reaction_type", reactionType)
        .maybeSingle();

    if (existing) {
        // Remove reaction
        return removeChatReaction({ messageId, playerId, reactionType });
    } else {
        // Add reaction
        return addChatReaction({ messageId, playerId, kickerId, reactionType });
    }
}

// ============ TYPING INDICATOR ============

export async function setTypingStatus({ playerId, kickerId }) {
    const { error } = await supabase.from(CHAT_TYPING).upsert(
        {
            player_id: playerId,
            kicker_id: kickerId,
            updated_at: new Date().toISOString(),
        },
        {
            onConflict: "player_id,kicker_id",
        }
    );

    if (error) {
        throw new Error(error.message);
    }

    return { success: true };
}

export async function clearTypingStatus({ playerId, kickerId }) {
    const { error } = await supabase
        .from(CHAT_TYPING)
        .delete()
        .eq("player_id", playerId)
        .eq("kicker_id", kickerId);

    if (error) {
        throw new Error(error.message);
    }

    return { success: true };
}

export async function getTypingUsers(kickerId) {
    const { data, error } = await supabase
        .from(CHAT_TYPING)
        .select(
            `*, 
            player: ${PLAYER}!${CHAT_TYPING}_player_id_fkey (*)`
        )
        .eq("kicker_id", kickerId);

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

// ============ UNREAD STATUS / BADGE ============

/**
 * Update last read timestamp for current user in a specific kicker
 */
export async function updateChatReadStatus(kickerId) {
    const { error } = await supabase.rpc("update_chat_read_status", {
        p_kicker_id: kickerId,
    });

    if (error) {
        throw new Error(error.message);
    }

    return { success: true };
}

/**
 * Get unread count per kicker for current user
 * Returns array of { kicker_id, unread_count }
 */
export async function getUnreadCountPerKicker() {
    const { data, error } = await supabase.rpc("get_unread_count_per_kicker");

    if (error) {
        throw new Error(error.message);
    }

    return data || [];
}

/**
 * Get total unread count across all kickers for current user
 */
export async function getTotalUnreadCount() {
    const { data, error } = await supabase.rpc("get_total_unread_count");

    if (error) {
        throw new Error(error.message);
    }

    return data || 0;
}

/**
 * Get combined unread count (chat + comments) across all kickers for current user
 * Used for global notification badges (browser tab, PWA badge)
 */
export async function getCombinedUnreadCount() {
    const { data, error } = await supabase.rpc("get_combined_unread_count");

    if (error) {
        throw new Error(error.message);
    }

    return data || 0;
}
