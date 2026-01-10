-- Migration 051: Session Management Functions (public schema)
-- Provides functions to view and manage user authentication sessions

-- ============================================
-- Function to get all sessions for the current user
-- Returns session details including user_agent and ip
-- ============================================
CREATE OR REPLACE FUNCTION public.get_user_sessions()
RETURNS TABLE (
    session_id uuid,
    created_at timestamptz,
    updated_at timestamptz,
    user_agent text,
    ip inet
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth, public
AS $$
BEGIN
    -- Only return sessions for the authenticated user
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    RETURN QUERY
    SELECT 
        s.id as session_id,
        s.created_at,
        s.updated_at,
        s.user_agent,
        s.ip
    FROM auth.sessions s
    WHERE s.user_id = auth.uid()
    ORDER BY s.updated_at DESC;
END;
$$;

-- ============================================
-- Function to terminate a specific session
-- Users can only terminate their own sessions
-- ============================================
CREATE OR REPLACE FUNCTION public.terminate_session(target_session_id text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth, public
AS $$
DECLARE
    session_user_id uuid;
    session_uuid uuid;
BEGIN
    -- Only allow authenticated users
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Cast the text parameter to uuid
    session_uuid := target_session_id::uuid;

    -- Check if the session belongs to the current user
    SELECT user_id INTO session_user_id
    FROM auth.sessions
    WHERE id = session_uuid;

    IF session_user_id IS NULL THEN
        RAISE EXCEPTION 'Session not found';
    END IF;

    IF session_user_id != auth.uid() THEN
        RAISE EXCEPTION 'Cannot terminate another user''s session';
    END IF;

    -- Delete the session
    DELETE FROM auth.sessions WHERE id = session_uuid;

    -- Also delete any refresh tokens associated with this session
    DELETE FROM auth.refresh_tokens WHERE session_id = session_uuid;

    RETURN true;
END;
$$;

-- ============================================
-- Function to terminate all sessions except the current one
-- Useful for "Sign out everywhere else" functionality
-- ============================================
CREATE OR REPLACE FUNCTION public.terminate_other_sessions(current_session_id text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth, public
AS $$
DECLARE
    deleted_count integer;
    session_uuid uuid;
    deleted_session_ids uuid[];
BEGIN
    -- Only allow authenticated users
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Cast the text parameter to uuid
    session_uuid := current_session_id::uuid;

    -- Delete all sessions for this user except the current one
    -- and collect deleted session IDs
    WITH deleted AS (
        DELETE FROM auth.sessions
        WHERE user_id = auth.uid()
        AND id != session_uuid
        RETURNING id
    )
    SELECT COUNT(*), ARRAY_AGG(id) INTO deleted_count, deleted_session_ids FROM deleted;

    -- Delete refresh tokens for the deleted sessions using the collected IDs
    IF deleted_session_ids IS NOT NULL AND array_length(deleted_session_ids, 1) > 0 THEN
        DELETE FROM auth.refresh_tokens
        WHERE user_id = auth.uid()::text
        AND session_id = ANY(deleted_session_ids);
    END IF;

    RETURN deleted_count;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_sessions() TO authenticated;
GRANT EXECUTE ON FUNCTION public.terminate_session(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.terminate_other_sessions(text) TO authenticated;
