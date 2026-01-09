-- Migration: Add enabled toggles for push notifications
-- 1. Global master toggle per user (notifications_enabled on user level)
-- 2. Per-device enabled toggle (enabled on subscription level)
-- This allows disabling notifications without removing devices

SET search_path TO public;

-- 1. Add enabled column to push_subscriptions (per-device toggle)
ALTER TABLE public.push_subscriptions
ADD COLUMN IF NOT EXISTS enabled BOOLEAN NOT NULL DEFAULT true;

-- 2. Create a user_notification_settings table for global settings
CREATE TABLE IF NOT EXISTS public.user_notification_settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    notifications_enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on user_notification_settings
ALTER TABLE public.user_notification_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_notification_settings
CREATE POLICY "Users can view their own notification settings"
    ON public.user_notification_settings FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification settings"
    ON public.user_notification_settings FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notification settings"
    ON public.user_notification_settings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- 3. RPC to toggle global notifications (master toggle)
CREATE OR REPLACE FUNCTION public.set_global_notifications_enabled(
    p_enabled BOOLEAN
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
BEGIN
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;
    
    -- Upsert the user's notification settings
    INSERT INTO public.user_notification_settings (user_id, notifications_enabled, updated_at)
    VALUES (v_user_id, p_enabled, NOW())
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        notifications_enabled = p_enabled,
        updated_at = NOW();
    
    RETURN TRUE;
END;
$$;

-- 4. RPC to toggle device-specific notifications
CREATE OR REPLACE FUNCTION public.set_device_notifications_enabled(
    p_subscription_id BIGINT,
    p_enabled BOOLEAN
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
    FROM public.push_subscriptions
    WHERE id = p_subscription_id;
    
    -- Check if subscription exists and belongs to current user
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Subscription not found';
    END IF;
    
    IF v_user_id != auth.uid() THEN
        RAISE EXCEPTION 'Not authorized to update this subscription';
    END IF;
    
    -- Update the enabled status
    UPDATE public.push_subscriptions
    SET 
        enabled = p_enabled,
        updated_at = NOW()
    WHERE id = p_subscription_id;
    
    RETURN TRUE;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.set_global_notifications_enabled(BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_device_notifications_enabled(BIGINT, BOOLEAN) TO authenticated;
