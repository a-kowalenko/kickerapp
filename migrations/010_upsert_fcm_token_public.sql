-- RPC function to upsert FCM token (handles user switching on same device)
-- Runs with SECURITY DEFINER to bypass RLS

CREATE OR REPLACE FUNCTION upsert_fcm_token(
    p_fcm_token TEXT,
    p_device_info TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Get the current authenticated user
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;
    
    -- Delete any existing entry with this token (could be from another user)
    DELETE FROM push_subscriptions
    WHERE fcm_token = p_fcm_token;
    
    -- Delete old tokens for this user with same device type
    IF p_device_info IS NOT NULL THEN
        DELETE FROM push_subscriptions
        WHERE user_id = v_user_id
        AND device_info::jsonb->>'deviceType' = p_device_info::jsonb->>'deviceType';
    END IF;
    
    -- Insert the new token
    INSERT INTO push_subscriptions (user_id, fcm_token, device_info)
    VALUES (v_user_id, p_fcm_token, p_device_info);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION upsert_fcm_token(TEXT, TEXT) TO authenticated;
