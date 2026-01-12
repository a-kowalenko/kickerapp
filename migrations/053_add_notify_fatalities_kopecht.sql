-- Migration 053: Add notify_fatalities column to push_subscriptions (kopecht schema)
-- Allows users to opt-in/out of fatality notifications (when a match ends 0-10)

SET search_path TO kopecht;

-- 1. Add notify_fatalities column to push_subscriptions
ALTER TABLE kopecht.push_subscriptions
ADD COLUMN IF NOT EXISTS notify_fatalities BOOLEAN NOT NULL DEFAULT true;

-- 2. Update the type constraint on mention_notifications to include 'fatality'
ALTER TABLE kopecht.mention_notifications 
DROP CONSTRAINT IF EXISTS mention_notifications_type_check;

ALTER TABLE kopecht.mention_notifications 
ADD CONSTRAINT mention_notifications_type_check 
CHECK (type IN ('comment', 'chat', 'chat_all', 'team_invite', 'fatality'));

-- 3. Drop old function signature and create updated RPC function with notify_fatalities parameter
DROP FUNCTION IF EXISTS kopecht.update_notification_preferences(BIGINT, BOOLEAN, BOOLEAN, BOOLEAN);

CREATE OR REPLACE FUNCTION kopecht.update_notification_preferences(
    p_subscription_id BIGINT,
    p_notify_all_chat BOOLEAN DEFAULT NULL,
    p_notify_mentions BOOLEAN DEFAULT NULL,
    p_notify_team_invites BOOLEAN DEFAULT NULL,
    p_notify_fatalities BOOLEAN DEFAULT NULL
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
        notify_fatalities = COALESCE(p_notify_fatalities, notify_fatalities),
        updated_at = NOW()
    WHERE id = p_subscription_id;
    
    RETURN TRUE;
END;
$$;

-- 4. Grant execute permissions
GRANT EXECUTE ON FUNCTION kopecht.update_notification_preferences TO authenticated;
