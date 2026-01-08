-- Migration: Fix avatar field name in teams RPC functions
-- The player table uses 'avatar' not 'avatar_url'

-- Fix get_teams_by_kicker function
CREATE OR REPLACE FUNCTION public.get_teams_by_kicker(p_kicker_id BIGINT)
RETURNS TABLE (
    id BIGINT,
    name VARCHAR(50),
    logo_url TEXT,
    player1_id BIGINT,
    player1_name TEXT,
    player1_avatar TEXT,
    player2_id BIGINT,
    player2_name TEXT,
    player2_avatar TEXT,
    status TEXT,
    mmr INTEGER,
    wins INTEGER,
    losses INTEGER,
    created_at TIMESTAMPTZ,
    dissolved_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id,
        t.name,
        t.logo_url,
        t.player1_id,
        p1.name AS player1_name,
        p1.avatar AS player1_avatar,
        t.player2_id,
        p2.name AS player2_name,
        p2.avatar AS player2_avatar,
        t.status,
        t.mmr,
        t.wins,
        t.losses,
        t.created_at,
        t.dissolved_at
    FROM public.teams t
    JOIN public.player p1 ON t.player1_id = p1.id
    JOIN public.player p2 ON t.player2_id = p2.id
    WHERE t.kicker_id = p_kicker_id
    ORDER BY t.mmr DESC, t.wins DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix get_pending_team_invitations function
CREATE OR REPLACE FUNCTION public.get_pending_team_invitations(p_player_id BIGINT)
RETURNS TABLE (
    invitation_id BIGINT,
    team_id BIGINT,
    team_name VARCHAR(50),
    inviting_player_id BIGINT,
    inviting_player_name TEXT,
    inviting_player_avatar TEXT,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ti.id AS invitation_id,
        t.id AS team_id,
        t.name AS team_name,
        ti.inviting_player_id,
        p.name AS inviting_player_name,
        p.avatar AS inviting_player_avatar,
        ti.created_at
    FROM public.team_invitations ti
    JOIN public.teams t ON ti.team_id = t.id
    JOIN public.player p ON ti.inviting_player_id = p.id
    WHERE ti.invited_player_id = p_player_id
    AND ti.status = 'pending'
    ORDER BY ti.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
