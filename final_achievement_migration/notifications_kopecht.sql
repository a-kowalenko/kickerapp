-- Migration: Add notification preferences to push_subscriptions table
-- Allows users to configure which types of push notifications they receive

SET search_path TO kopecht;

-- 1. Add notification preference columns
ALTER TABLE kopecht.push_subscriptions
ADD COLUMN IF NOT EXISTS notify_all_chat BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_mentions BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_team_invites BOOLEAN NOT NULL DEFAULT true;

-- 2. Create RPC function to update notification preferences for a subscription
CREATE OR REPLACE FUNCTION kopecht.update_notification_preferences(
    p_subscription_id BIGINT,
    p_notify_all_chat BOOLEAN DEFAULT NULL,
    p_notify_mentions BOOLEAN DEFAULT NULL,
    p_notify_team_invites BOOLEAN DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Get the user_id of the subscription
    SELECT user_id INTO v_user_id
    FROM kopecht.push_subscriptions
    WHERE id = p_subscription_id;
    
    -- Check if subscription exists and belongs to current user
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Subscription not found';
    END IF;
    
    IF v_user_id != auth.uid() THEN
        RAISE EXCEPTION 'Not authorized to update this subscription';
    END IF;
    
    -- Update only the provided preferences
    UPDATE kopecht.push_subscriptions
    SET 
        notify_all_chat = COALESCE(p_notify_all_chat, notify_all_chat),
        notify_mentions = COALESCE(p_notify_mentions, notify_mentions),
        notify_team_invites = COALESCE(p_notify_team_invites, notify_team_invites),
        updated_at = NOW()
    WHERE id = p_subscription_id;
    
    RETURN TRUE;
END;
$$;

-- 3. Create RPC function to delete a specific subscription by ID
CREATE OR REPLACE FUNCTION kopecht.delete_push_subscription(
    p_subscription_id BIGINT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Get the user_id of the subscription
    SELECT user_id INTO v_user_id
    FROM kopecht.push_subscriptions
    WHERE id = p_subscription_id;
    
    -- Check if subscription exists and belongs to current user
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Subscription not found';
    END IF;
    
    IF v_user_id != auth.uid() THEN
        RAISE EXCEPTION 'Not authorized to delete this subscription';
    END IF;
    
    -- Delete the subscription
    DELETE FROM kopecht.push_subscriptions
    WHERE id = p_subscription_id;
    
    RETURN TRUE;
END;
$$;

-- 4. Grant execute permissions
GRANT EXECUTE ON FUNCTION kopecht.update_notification_preferences TO authenticated;
GRANT EXECUTE ON FUNCTION kopecht.delete_push_subscription TO authenticated;



-- Migration: Add chat_all notification type for "All Chat Messages" push notifications
-- This creates notifications for ALL chat messages (not just mentions) for users who have enabled this option

SET search_path TO kopecht;

-- 1. Update the type constraint to include 'chat_all' and 'team_invite'
ALTER TABLE kopecht.mention_notifications 
DROP CONSTRAINT IF EXISTS mention_notifications_type_check;

ALTER TABLE kopecht.mention_notifications 
ADD CONSTRAINT mention_notifications_type_check 
CHECK (type IN ('comment', 'chat', 'chat_all', 'team_invite'));

-- 2. Create trigger function for chat_all notifications
-- This creates a notification for ALL players in the kicker (except sender) who have notify_all_chat enabled
CREATE OR REPLACE FUNCTION kopecht.trigger_create_chat_all_notifications()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_content_preview TEXT;
    v_player_record RECORD;
BEGIN
    -- Skip whispers (private messages)
    IF NEW.recipient_id IS NOT NULL THEN
        RETURN NEW;
    END IF;
    
    -- Truncate content for preview (max 100 chars)
    v_content_preview := LEFT(NEW.content, 100);
    IF LENGTH(NEW.content) > 100 THEN
        v_content_preview := v_content_preview || '...';
    END IF;
    
    -- Insert notification for all players in the kicker (except sender)
    -- who have notify_all_chat enabled on at least one subscription
    -- But EXCLUDE players who are already getting a mention notification (have @mention in content)
    FOR v_player_record IN 
        SELECT DISTINCT pl.id, pl.user_id 
        FROM kopecht.player pl 
        INNER JOIN kopecht.push_subscriptions ps ON ps.user_id = pl.user_id
        WHERE pl.kicker_id = NEW.kicker_id 
          AND pl.id != NEW.player_id
          AND pl.user_id IS NOT NULL
          AND ps.notify_all_chat = TRUE
          -- Exclude players who are mentioned (they get a 'chat' type notification instead)
          AND NOT EXISTS (
              SELECT 1 
              FROM regexp_matches(NEW.content, '@\[[^\]]+\]\(' || pl.id::TEXT || '\)', 'g')
          )
          -- Also exclude if @everyone is used (they get 'chat' notification)
          AND NEW.content NOT LIKE '%@everyone%'
    LOOP
        INSERT INTO kopecht.mention_notifications (
            user_id, type, source_id, match_id, kicker_id, 
            sender_player_id, content_preview, is_read, created_at
        )
        VALUES (
            v_player_record.user_id, 'chat_all', NEW.id, NULL, NEW.kicker_id,
            NEW.player_id, v_content_preview, FALSE, NOW()
        )
        ON CONFLICT DO NOTHING;
    END LOOP;
    
    RETURN NEW;
END;
$$;

-- 3. Create trigger for chat_all notifications
DROP TRIGGER IF EXISTS trigger_chat_all ON kopecht.chat_messages;
CREATE TRIGGER trigger_chat_all
    AFTER INSERT ON kopecht.chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION kopecht.trigger_create_chat_all_notifications();

-- 4. Update get_mention_notifications to support filtering by type (optional)
-- The existing function already returns all types, frontend will filter if needed



-- Migration 013: Exclude chat_all notifications from notification bell
-- The chat_all type is only for push notifications, not the in-app notification list

-- 1. Update get_mention_notifications to exclude chat_all type
CREATE OR REPLACE FUNCTION kopecht.get_mention_notifications(p_limit INT DEFAULT 50, p_offset INT DEFAULT 0)
RETURNS TABLE (
    id BIGINT,
    type VARCHAR,
    source_id BIGINT,
    match_id BIGINT,
    kicker_id BIGINT,
    kicker_name TEXT,
    sender_player_id BIGINT,
    sender_player_name TEXT,
    sender_avatar TEXT,
    content_preview TEXT,
    is_read BOOLEAN,
    created_at TIMESTAMPTZ,
    match_info JSONB,
    team_invitation_id BIGINT,
    team_info JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        mn.id,
        mn.type,
        mn.source_id,
        mn.match_id,
        mn.kicker_id,
        k.name AS kicker_name,
        mn.sender_player_id,
        p.name AS sender_player_name,
        p.avatar AS sender_avatar,
        mn.content_preview,
        mn.is_read,
        mn.created_at,
        CASE 
            WHEN mn.match_id IS NOT NULL THEN
                jsonb_build_object(
                    'id', m.id,
                    'player1_name', p1.name,
                    'player2_name', p2.name,
                    'player3_name', p3.name,
                    'player4_name', p4.name,
                    'scoreTeam1', m."scoreTeam1",
                    'scoreTeam2', m."scoreTeam2"
                )
            ELSE NULL
        END AS match_info,
        mn.team_invitation_id,
        CASE 
            WHEN mn.team_invitation_id IS NOT NULL THEN
                jsonb_build_object(
                    'invitation_id', ti.id,
                    'team_id', t.id,
                    'team_name', t.name,
                    'team_logo_url', t.logo_url,
                    'invitation_status', ti.status
                )
            ELSE NULL
        END AS team_info
    FROM kopecht.mention_notifications mn
    JOIN kopecht.kicker k ON k.id = mn.kicker_id
    JOIN kopecht.player p ON p.id = mn.sender_player_id
    LEFT JOIN kopecht.matches m ON m.id = mn.match_id
    LEFT JOIN kopecht.player p1 ON p1.id = m.player1
    LEFT JOIN kopecht.player p2 ON p2.id = m.player2
    LEFT JOIN kopecht.player p3 ON p3.id = m.player3
    LEFT JOIN kopecht.player p4 ON p4.id = m.player4
    LEFT JOIN kopecht.team_invitations ti ON ti.id = mn.team_invitation_id
    LEFT JOIN kopecht.teams t ON t.id = ti.team_id
    WHERE mn.user_id = auth.uid()
      AND mn.type != 'chat_all'  -- Exclude chat_all from notification bell
    ORDER BY mn.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- 2. Update get_unread_mention_count to exclude chat_all type
CREATE OR REPLACE FUNCTION kopecht.get_unread_mention_count()
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count BIGINT;
BEGIN
    SELECT COUNT(*)::BIGINT INTO v_count
    FROM kopecht.mention_notifications
    WHERE user_id = auth.uid() 
      AND is_read = FALSE
      AND type != 'chat_all';  -- Exclude chat_all from unread count
    
    RETURN COALESCE(v_count, 0);
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION kopecht.get_mention_notifications(INT, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION kopecht.get_unread_mention_count() TO authenticated;

