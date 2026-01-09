-- Fix upsert_fcm_token to allow multiple devices of the same type
-- Previously it deleted all tokens with the same deviceType, now it uses a unique device fingerprint

CREATE OR REPLACE FUNCTION kopecht.upsert_fcm_token(
    p_fcm_token TEXT,
    p_device_info TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = kopecht
AS $$
DECLARE
    v_user_id UUID;
    v_device_fingerprint TEXT;
    v_existing_fingerprint TEXT;
BEGIN
    -- Get the current authenticated user
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;
    
    -- Delete any existing entry with this token (could be from another user on same browser)
    DELETE FROM kopecht.push_subscriptions
    WHERE fcm_token = p_fcm_token;
    
    -- Create a device fingerprint from device_info for more precise matching
    -- This allows multiple devices of the same type (e.g., two iPhones)
    IF p_device_info IS NOT NULL THEN
        -- Create fingerprint: deviceType + os + osVersion + browser + browserVersion + deviceModel
        v_device_fingerprint := COALESCE(p_device_info::jsonb->>'deviceType', '') || '|' ||
                                COALESCE(p_device_info::jsonb->>'os', '') || '|' ||
                                COALESCE(p_device_info::jsonb->>'osVersion', '') || '|' ||
                                COALESCE(p_device_info::jsonb->>'browser', '') || '|' ||
                                COALESCE(p_device_info::jsonb->>'browserVersion', '') || '|' ||
                                COALESCE(p_device_info::jsonb->>'deviceModel', '');
        
        -- Only delete if there's an exact device match for this user
        -- This prevents multiple iPhones from overwriting each other
        DELETE FROM kopecht.push_subscriptions ps
        WHERE ps.user_id = v_user_id
        AND (
            COALESCE(ps.device_info::jsonb->>'deviceType', '') || '|' ||
            COALESCE(ps.device_info::jsonb->>'os', '') || '|' ||
            COALESCE(ps.device_info::jsonb->>'osVersion', '') || '|' ||
            COALESCE(ps.device_info::jsonb->>'browser', '') || '|' ||
            COALESCE(ps.device_info::jsonb->>'browserVersion', '') || '|' ||
            COALESCE(ps.device_info::jsonb->>'deviceModel', '')
        ) = v_device_fingerprint;
    END IF;
    
    -- Insert the new token
    INSERT INTO kopecht.push_subscriptions (user_id, fcm_token, device_info)
    VALUES (v_user_id, p_fcm_token, p_device_info);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION kopecht.upsert_fcm_token(TEXT, TEXT) TO authenticated;
