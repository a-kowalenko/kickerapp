-- Migration: Create combined unread count functions for chat + comments
-- Used for global notification badges (browser tab, PWA badge, iOS badge)

SET search_path TO kopecht;

-- 1. Create function to get combined unread count (chat + comments) for current user
-- This is used by the frontend for browser tab title and PWA badge
CREATE OR REPLACE FUNCTION kopecht.get_combined_unread_count()
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
    FROM kopecht.get_unread_count_per_kicker();
    
    -- Get comment unread count
    SELECT COALESCE(SUM(unread_count), 0) INTO comment_count
    FROM kopecht.get_unread_comment_count_per_kicker();
    
    RETURN chat_count + comment_count;
END;
$$;

-- 2. Create function to get combined unread count for a specific user (used by edge function for iOS/Android badge)
-- This bypasses RLS and is only accessible by service_role
CREATE OR REPLACE FUNCTION kopecht.get_combined_unread_count_for_user(p_user_id UUID)
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
        FROM kopecht.player p
        LEFT JOIN kopecht.chat_read_status crs ON crs.kicker_id = p.kicker_id AND crs.user_id = p_user_id
        LEFT JOIN kopecht.chat_messages cm ON cm.kicker_id = p.kicker_id
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
    
    -- Get comment unread count for user
    SELECT COALESCE(SUM(cnt), 0) INTO comment_count
    FROM (
        SELECT COUNT(mc.id) as cnt
        FROM kopecht.player p
        LEFT JOIN kopecht.comment_read_status crs ON crs.kicker_id = p.kicker_id AND crs.user_id = p_user_id
        LEFT JOIN kopecht.match_comments mc ON mc.kicker_id = p.kicker_id
            AND mc.created_at > COALESCE(crs.last_read_at, '1970-01-01'::TIMESTAMPTZ)
            AND mc.player_id != p.id  -- Don't count own comments
        WHERE p.user_id = p_user_id
        GROUP BY p.kicker_id
    ) sub;
    
    RETURN chat_count + comment_count;
END;
$$;

-- 3. Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION kopecht.get_combined_unread_count() TO authenticated;
GRANT EXECUTE ON FUNCTION kopecht.get_combined_unread_count_for_user(UUID) TO service_role;
