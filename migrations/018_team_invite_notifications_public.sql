-- Migration: Add team invite notifications to mention_notifications system (public schema)
-- Creates notifications when players receive team invitations
-- Auto-marks notification as read when invitation is responded to

SET search_path TO public;

-- 1. Alter mention_notifications table to support team invites
-- Drop old constraint and add new one with 'team_invite' type
ALTER TABLE public.mention_notifications 
DROP CONSTRAINT IF EXISTS mention_notifications_type_check;

ALTER TABLE public.mention_notifications 
ADD CONSTRAINT mention_notifications_type_check 
CHECK (type IN ('comment', 'chat', 'team_invite'));

-- Add team_invitation_id column for team invite notifications
ALTER TABLE public.mention_notifications 
ADD COLUMN IF NOT EXISTS team_invitation_id BIGINT REFERENCES public.team_invitations(id) ON DELETE CASCADE;

-- Create index for team_invitation_id lookups
CREATE INDEX IF NOT EXISTS idx_mention_notifications_team_invitation_id 
ON public.mention_notifications(team_invitation_id) 
WHERE team_invitation_id IS NOT NULL;

-- 2. Trigger function to create notification when team invitation is created
-- Also sends push notification via pg_net HTTP call to edge function
CREATE OR REPLACE FUNCTION public.trigger_create_team_invite_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_invited_user_id UUID;
    v_inviter_name TEXT;
    v_team_name TEXT;
    v_kicker_id BIGINT;
    v_content_preview TEXT;
    v_supabase_url TEXT;
    v_service_role_key TEXT;
    v_request_id BIGINT;
BEGIN
    -- Get invited player's user_id
    SELECT user_id INTO v_invited_user_id 
    FROM public.player 
    WHERE id = NEW.invited_player_id;
    
    -- Skip if player has no user_id (guest player)
    IF v_invited_user_id IS NULL THEN
        RETURN NEW;
    END IF;
    
    -- Get inviter's name
    SELECT name INTO v_inviter_name 
    FROM public.player 
    WHERE id = NEW.inviting_player_id;
    
    -- Get team name and kicker_id
    SELECT name, kicker_id INTO v_team_name, v_kicker_id 
    FROM public.teams 
    WHERE id = NEW.team_id;
    
    -- Build content preview message
    v_content_preview := v_inviter_name || ' invited you to join team "' || v_team_name || '"';
    
    -- Insert notification (for bell icon)
    INSERT INTO public.mention_notifications (
        user_id,
        type,
        source_id,
        match_id,
        kicker_id,
        sender_player_id,
        content_preview,
        team_invitation_id,
        is_read,
        created_at
    ) VALUES (
        v_invited_user_id,
        'team_invite',
        NEW.id,  -- source_id = invitation id
        NULL,    -- no match_id for team invites
        v_kicker_id,
        NEW.inviting_player_id,
        v_content_preview,
        NEW.id,
        FALSE,
        NOW()
    );
    
    -- Send push notification via pg_net HTTP call to edge function
    -- Get Supabase URL and service role key from vault (or use direct values)
    SELECT decrypted_secret INTO v_supabase_url 
    FROM vault.decrypted_secrets 
    WHERE name = 'supabase_url';
    
    SELECT decrypted_secret INTO v_service_role_key 
    FROM vault.decrypted_secrets 
    WHERE name = 'service_role_key';
    
    -- Only send push if we have the secrets configured
    IF v_supabase_url IS NOT NULL AND v_service_role_key IS NOT NULL THEN
        SELECT net.http_post(
            url := v_supabase_url || '/functions/v1/send-push-notification',
            headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'Authorization', 'Bearer ' || v_service_role_key
            ),
            body := jsonb_build_object(
                'type', 'INSERT',
                'table', 'team_invitations',
                'schema', 'public',
                'record', jsonb_build_object(
                    'id', NEW.id,
                    'team_id', NEW.team_id,
                    'inviting_player_id', NEW.inviting_player_id,
                    'invited_player_id', NEW.invited_player_id,
                    'status', NEW.status
                )
            )
        ) INTO v_request_id;
    END IF;
    
    RETURN NEW;
END;
$$;

-- 3. Create trigger on team_invitations INSERT
DROP TRIGGER IF EXISTS trigger_team_invite_notification ON public.team_invitations;
CREATE TRIGGER trigger_team_invite_notification
    AFTER INSERT ON public.team_invitations
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_create_team_invite_notification();

-- 4. Trigger function to mark notification as read when invitation is responded to
CREATE OR REPLACE FUNCTION public.trigger_mark_team_invite_notification_read()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Only act when status changes from 'pending' to something else
    IF OLD.status = 'pending' AND NEW.status != 'pending' THEN
        UPDATE public.mention_notifications
        SET is_read = TRUE
        WHERE team_invitation_id = NEW.id AND is_read = FALSE;
    END IF;
    
    RETURN NEW;
END;
$$;

-- 5. Create trigger on team_invitations UPDATE
DROP TRIGGER IF EXISTS trigger_team_invite_response ON public.team_invitations;
CREATE TRIGGER trigger_team_invite_response
    AFTER UPDATE ON public.team_invitations
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_mark_team_invite_notification_read();

-- 6. Update get_mention_notifications to include team info for team_invite type
-- Must DROP first because return type is changing (adding team_invitation_id and team_info columns)
DROP FUNCTION IF EXISTS public.get_mention_notifications(INT, INT);

CREATE OR REPLACE FUNCTION public.get_mention_notifications(p_limit INT DEFAULT 50, p_offset INT DEFAULT 0)
RETURNS TABLE (
    id BIGINT,
    type VARCHAR(20),
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
    FROM public.mention_notifications mn
    JOIN public.kicker k ON k.id = mn.kicker_id
    JOIN public.player p ON p.id = mn.sender_player_id
    LEFT JOIN public.matches m ON m.id = mn.match_id
    LEFT JOIN public.player p1 ON p1.id = m.player1
    LEFT JOIN public.player p2 ON p2.id = m.player2
    LEFT JOIN public.player p3 ON p3.id = m.player3
    LEFT JOIN public.player p4 ON p4.id = m.player4
    LEFT JOIN public.team_invitations ti ON ti.id = mn.team_invitation_id
    LEFT JOIN public.teams t ON t.id = ti.team_id
    WHERE mn.user_id = auth.uid()
    ORDER BY mn.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;
