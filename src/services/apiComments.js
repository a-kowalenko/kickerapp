import {
    MATCH_COMMENTS,
    MATCH_REACTIONS,
    COMMENT_REACTIONS,
    PLAYER,
    MATCHES,
    CHAT_PAGE_SIZE,
} from "../utils/constants";
import supabase from "./supabase";

// ============ COMMENTS ============

/**
 * Get all comments for a kicker (for the Match Comments tab on Home)
 * Returns comments with player info and match info for display
 */
export async function getCommentsByKicker(
    kicker,
    { offset = 0, limit = CHAT_PAGE_SIZE } = {}
) {
    const { data, error } = await supabase
        .from(MATCH_COMMENTS)
        .select(
            `*, 
            player: ${PLAYER}!${MATCH_COMMENTS}_player_id_fkey (*),
            match: ${MATCHES}!${MATCH_COMMENTS}_match_id_fkey (
                id,
                created_at,
                player1: ${PLAYER}!${MATCHES}_player1_fkey (id, name),
                player2: ${PLAYER}!${MATCHES}_player2_fkey (id, name),
                player3: ${PLAYER}!${MATCHES}_player3_fkey (id, name),
                player4: ${PLAYER}!${MATCHES}_player4_fkey (id, name),
                scoreTeam1,
                scoreTeam2
            )`
        )
        .eq("kicker_id", kicker)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

export async function getCommentsByMatch(kicker, matchId) {
    const { data, error } = await supabase
        .from(MATCH_COMMENTS)
        .select(
            `*, 
            player: ${PLAYER}!${MATCH_COMMENTS}_player_id_fkey (*)`
        )
        .eq("kicker_id", kicker)
        .eq("match_id", matchId)
        .order("created_at", { ascending: true });

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

export async function createComment({ matchId, playerId, kickerId, content }) {
    const { data, error } = await supabase
        .from(MATCH_COMMENTS)
        .insert({
            match_id: matchId,
            player_id: playerId,
            kicker_id: kickerId,
            content,
        })
        .select(
            `*, 
            player: ${PLAYER}!${MATCH_COMMENTS}_player_id_fkey (*)`
        )
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

export async function updateComment({ commentId, content }) {
    const { data, error } = await supabase
        .from(MATCH_COMMENTS)
        .update({
            content,
            edited_at: new Date().toISOString(),
        })
        .eq("id", commentId)
        .select(
            `*, 
            player: ${PLAYER}!${MATCH_COMMENTS}_player_id_fkey (*)`
        )
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

export async function deleteComment(commentId) {
    const { error } = await supabase
        .from(MATCH_COMMENTS)
        .delete()
        .eq("id", commentId);

    if (error) {
        throw new Error(error.message);
    }

    return { success: true };
}

// ============ MATCH REACTIONS ============

export async function getMatchReactions(kicker, matchId) {
    const { data, error } = await supabase
        .from(MATCH_REACTIONS)
        .select(
            `*, 
            player: ${PLAYER}!${MATCH_REACTIONS}_player_id_fkey (*)`
        )
        .eq("kicker_id", kicker)
        .eq("match_id", matchId);

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

export async function addMatchReaction({
    matchId,
    playerId,
    kickerId,
    reactionType,
}) {
    const { data, error } = await supabase
        .from(MATCH_REACTIONS)
        .insert({
            match_id: matchId,
            player_id: playerId,
            kicker_id: kickerId,
            reaction_type: reactionType,
        })
        .select(
            `*, 
            player: ${PLAYER}!${MATCH_REACTIONS}_player_id_fkey (*)`
        )
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

export async function removeMatchReaction({ matchId, playerId, reactionType }) {
    const { error } = await supabase
        .from(MATCH_REACTIONS)
        .delete()
        .eq("match_id", matchId)
        .eq("player_id", playerId)
        .eq("reaction_type", reactionType);

    if (error) {
        throw new Error(error.message);
    }

    return { success: true };
}

export async function toggleMatchReaction({
    matchId,
    playerId,
    kickerId,
    reactionType,
}) {
    // Check if reaction exists
    const { data: existing } = await supabase
        .from(MATCH_REACTIONS)
        .select("id")
        .eq("match_id", matchId)
        .eq("player_id", playerId)
        .eq("reaction_type", reactionType)
        .maybeSingle();

    if (existing) {
        // Remove reaction
        return removeMatchReaction({ matchId, playerId, reactionType });
    } else {
        // Add reaction
        return addMatchReaction({ matchId, playerId, kickerId, reactionType });
    }
}

// ============ COMMENT REACTIONS ============

export async function getCommentReactions(kicker, commentIds) {
    if (!commentIds || commentIds.length === 0) {
        return [];
    }

    const { data, error } = await supabase
        .from(COMMENT_REACTIONS)
        .select(
            `*, 
            player: ${PLAYER}!${COMMENT_REACTIONS}_player_id_fkey (*)`
        )
        .eq("kicker_id", kicker)
        .in("comment_id", commentIds);

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

export async function addCommentReaction({
    commentId,
    playerId,
    kickerId,
    reactionType,
}) {
    const { data, error } = await supabase
        .from(COMMENT_REACTIONS)
        .insert({
            comment_id: commentId,
            player_id: playerId,
            kicker_id: kickerId,
            reaction_type: reactionType,
        })
        .select(
            `*, 
            player: ${PLAYER}!${COMMENT_REACTIONS}_player_id_fkey (*)`
        )
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

export async function removeCommentReaction({
    commentId,
    playerId,
    reactionType,
}) {
    const { error } = await supabase
        .from(COMMENT_REACTIONS)
        .delete()
        .eq("comment_id", commentId)
        .eq("player_id", playerId)
        .eq("reaction_type", reactionType);

    if (error) {
        throw new Error(error.message);
    }

    return { success: true };
}

export async function toggleCommentReaction({
    commentId,
    playerId,
    kickerId,
    reactionType,
}) {
    // Check if reaction exists
    const { data: existing } = await supabase
        .from(COMMENT_REACTIONS)
        .select("id")
        .eq("comment_id", commentId)
        .eq("player_id", playerId)
        .eq("reaction_type", reactionType)
        .maybeSingle();

    if (existing) {
        // Remove reaction
        return removeCommentReaction({ commentId, playerId, reactionType });
    } else {
        // Add reaction
        return addCommentReaction({
            commentId,
            playerId,
            kickerId,
            reactionType,
        });
    }
}

// ============ COMMENT READ STATUS ============

/**
 * Update last read timestamp for comments in a specific kicker
 */
export async function updateCommentReadStatus(kickerId) {
    const { error } = await supabase.rpc("update_comment_read_status", {
        p_kicker_id: kickerId,
    });

    if (error) {
        throw new Error(error.message);
    }

    return { success: true };
}

/**
 * Get unread comment count for a specific kicker
 */
export async function getUnreadCommentCount(kickerId) {
    const { data, error } = await supabase.rpc("get_unread_comment_count", {
        p_kicker_id: kickerId,
    });

    if (error) {
        throw new Error(error.message);
    }

    return data || 0;
}

/**
 * Get unread comment count per kicker for current user
 * Returns array of { kicker_id, unread_count }
 */
export async function getUnreadCommentCountPerKicker() {
    const { data, error } = await supabase.rpc(
        "get_unread_comment_count_per_kicker"
    );

    if (error) {
        throw new Error(error.message);
    }

    return data || [];
}
