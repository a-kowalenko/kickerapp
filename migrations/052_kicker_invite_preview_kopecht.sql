-- Migration 052: Kicker Invite Preview Function (kopecht schema)
-- Provides a public function to get kicker preview info for invite links

SET search_path TO kopecht;

-- ============================================
-- Function to get kicker preview for invite page
-- This is a PUBLIC function (no auth required) that returns
-- limited info for displaying an invite page
-- ============================================
CREATE OR REPLACE FUNCTION kopecht.get_kicker_invite_preview(
    invite_token uuid,
    inviter_player_id bigint DEFAULT NULL
)
RETURNS TABLE (
    kicker_id bigint,
    kicker_name text,
    kicker_avatar text,
    inviter_name text,
    inviter_avatar text,
    sample_players jsonb,
    player_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = kopecht
AS $$
DECLARE
    found_kicker_id bigint;
BEGIN
    -- Find kicker by access token
    SELECT k.id INTO found_kicker_id
    FROM kopecht.kicker k
    WHERE k.access_token = invite_token;

    IF found_kicker_id IS NULL THEN
        RAISE EXCEPTION 'Invalid invite token';
    END IF;

    RETURN QUERY
    SELECT 
        k.id as kicker_id,
        k.name as kicker_name,
        k.avatar as kicker_avatar,
        -- Get inviter info if player_id provided
        (
            SELECT p.name 
            FROM kopecht.player p 
            WHERE p.id = inviter_player_id 
            AND p.kicker_id = k.id
        ) as inviter_name,
        (
            SELECT p.avatar 
            FROM kopecht.player p 
            WHERE p.id = inviter_player_id 
            AND p.kicker_id = k.id
        ) as inviter_avatar,
        -- Get 3 random players (excluding inviter)
        (
            SELECT jsonb_agg(player_info)
            FROM (
                SELECT jsonb_build_object(
                    'name', p.name,
                    'avatar', p.avatar
                ) as player_info
                FROM kopecht.player p
                WHERE p.kicker_id = k.id
                AND (inviter_player_id IS NULL OR p.id != inviter_player_id)
                ORDER BY random()
                LIMIT 3
            ) sub
        ) as sample_players,
        -- Total player count
        (
            SELECT COUNT(*)
            FROM kopecht.player p
            WHERE p.kicker_id = k.id
        ) as player_count
    FROM kopecht.kicker k
    WHERE k.id = found_kicker_id;
END;
$$;

-- Grant execute to anon (public, no auth required)
GRANT EXECUTE ON FUNCTION kopecht.get_kicker_invite_preview(uuid, bigint) TO anon;
GRANT EXECUTE ON FUNCTION kopecht.get_kicker_invite_preview(uuid, bigint) TO authenticated;
