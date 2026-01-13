-- Rollback Migration 053: Remove notify_fatalities column (kopecht schema)

SET search_path TO kopecht;

-- 1. Remove notify_fatalities column
ALTER TABLE kopecht.push_subscriptions
DROP COLUMN IF EXISTS notify_fatalities;

-- 2. Restore original type constraint on mention_notifications
ALTER TABLE kopecht.mention_notifications 
DROP CONSTRAINT IF EXISTS mention_notifications_type_check;

ALTER TABLE kopecht.mention_notifications 
ADD CONSTRAINT mention_notifications_type_check 
CHECK (type IN ('comment', 'chat', 'chat_all', 'team_invite'));

-- 3. Restore original RPC function without notify_fatalities parameter
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
