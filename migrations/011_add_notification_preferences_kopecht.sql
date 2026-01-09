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
