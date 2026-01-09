-- Rollback Migration 013: Restore original functions without chat_all exclusion

-- 1. Restore get_mention_notifications without chat_all filter
CREATE OR REPLACE FUNCTION get_mention_notifications(p_limit INT DEFAULT 50, p_offset INT DEFAULT 0)
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
    FROM mention_notifications mn
    JOIN kicker k ON k.id = mn.kicker_id
    JOIN player p ON p.id = mn.sender_player_id
    LEFT JOIN matches m ON m.id = mn.match_id
    LEFT JOIN player p1 ON p1.id = m.player1
    LEFT JOIN player p2 ON p2.id = m.player2
    LEFT JOIN player p3 ON p3.id = m.player3
    LEFT JOIN player p4 ON p4.id = m.player4
    LEFT JOIN team_invitations ti ON ti.id = mn.team_invitation_id
    LEFT JOIN teams t ON t.id = ti.team_id
    WHERE mn.user_id = auth.uid()
    ORDER BY mn.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- 2. Restore get_unread_mention_count without chat_all filter
CREATE OR REPLACE FUNCTION get_unread_mention_count()
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count BIGINT;
BEGIN
    SELECT COUNT(*)::BIGINT INTO v_count
    FROM mention_notifications
    WHERE user_id = auth.uid() 
      AND is_read = FALSE;
    
    RETURN COALESCE(v_count, 0);
END;
$$;
