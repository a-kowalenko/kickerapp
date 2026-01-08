-- Migration: Create combined unread count functions for chat + comments
-- Used for global notification badges (browser tab, PWA badge, iOS badge)

-- 1. Create function to get combined unread count (chat + comments) for current user
-- This is used by the frontend for browser tab title and PWA badge
-- A comment is considered read if EITHER:
--   - The kicker-wide comment_read_status.last_read_at >= comment.created_at, OR
--   - The match-specific match_comment_read_status.last_read_at >= comment.created_at
CREATE OR REPLACE FUNCTION get_combined_unread_count()
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    chat_count BIGINT;
    comment_count BIGINT;
BEGIN
    -- Get chat unread count
    SELECT COALESCE(SUM(unread_count), 0) INTO chat_count
    FROM get_unread_count_per_kicker();
    
    -- Get comment unread count (considering both kicker-wide and match-specific read status)
    SELECT COALESCE(COUNT(*), 0) INTO comment_count
    FROM match_comments mc
    INNER JOIN player p ON p.kicker_id = mc.kicker_id AND p.user_id = auth.uid()
    LEFT JOIN comment_read_status crs ON crs.kicker_id = mc.kicker_id AND crs.user_id = auth.uid()
    LEFT JOIN match_comment_read_status mcrs ON mcrs.match_id = mc.match_id AND mcrs.user_id = auth.uid()
    WHERE mc.player_id != p.id  -- Don't count own comments
        AND mc.created_at > COALESCE(crs.last_read_at, '1970-01-01'::TIMESTAMPTZ)  -- Not read via kicker-wide
        AND mc.created_at > COALESCE(mcrs.last_read_at, '1970-01-01'::TIMESTAMPTZ); -- Not read via match-specific
    
    RETURN chat_count + comment_count;
END;
$$;

-- 2. Create function to get combined unread count for a specific user (used by edge function for iOS/Android badge)
-- This bypasses RLS and is only accessible by service_role
CREATE OR REPLACE FUNCTION get_combined_unread_count_for_user(p_user_id UUID)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    chat_count BIGINT;
    comment_count BIGINT;
BEGIN
    -- Get chat unread count for user
    SELECT COALESCE(SUM(cnt), 0) INTO chat_count
    FROM (
        SELECT COUNT(cm.id) as cnt
        FROM player p
        LEFT JOIN chat_read_status crs ON crs.kicker_id = p.kicker_id AND crs.user_id = p_user_id
        LEFT JOIN chat_messages cm ON cm.kicker_id = p.kicker_id
            AND cm.created_at > COALESCE(crs.last_read_at, '1970-01-01'::TIMESTAMPTZ)
            AND cm.player_id != p.id
            AND (
                cm.recipient_id IS NULL
                OR
                cm.recipient_id = p.id
            )
        WHERE p.user_id = p_user_id
        GROUP BY p.kicker_id
    ) sub;
    
    -- Get comment unread count for user (considering both kicker-wide and match-specific read status)
    SELECT COALESCE(COUNT(*), 0) INTO comment_count
    FROM match_comments mc
    INNER JOIN player p ON p.kicker_id = mc.kicker_id AND p.user_id = p_user_id
    LEFT JOIN comment_read_status crs ON crs.kicker_id = mc.kicker_id AND crs.user_id = p_user_id
    LEFT JOIN match_comment_read_status mcrs ON mcrs.match_id = mc.match_id AND mcrs.user_id = p_user_id
    WHERE mc.player_id != p.id  -- Don't count own comments
        AND mc.created_at > COALESCE(crs.last_read_at, '1970-01-01'::TIMESTAMPTZ)  -- Not read via kicker-wide
        AND mc.created_at > COALESCE(mcrs.last_read_at, '1970-01-01'::TIMESTAMPTZ); -- Not read via match-specific
    
    RETURN chat_count + comment_count;
END;
$$;

-- 3. Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION get_combined_unread_count() TO authenticated;
GRANT EXECUTE ON FUNCTION get_combined_unread_count_for_user(UUID) TO service_role;
