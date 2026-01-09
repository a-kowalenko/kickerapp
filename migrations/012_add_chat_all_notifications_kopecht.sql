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
