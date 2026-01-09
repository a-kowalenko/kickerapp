-- Rollback: Remove team invite notifications from mention_notifications system (public schema)

SET search_path TO public;

-- 1. Drop triggers
DROP TRIGGER IF EXISTS trigger_team_invite_response ON public.team_invitations;
DROP TRIGGER IF EXISTS trigger_team_invite_notification ON public.team_invitations;

-- 2. Drop trigger functions
DROP FUNCTION IF EXISTS public.trigger_mark_team_invite_notification_read();
DROP FUNCTION IF EXISTS public.trigger_create_team_invite_notification();

-- 3. Delete any existing team_invite notifications
DELETE FROM public.mention_notifications WHERE type = 'team_invite';

-- 4. Drop team_invitation_id index and column
DROP INDEX IF EXISTS public.idx_mention_notifications_team_invitation_id;
ALTER TABLE public.mention_notifications DROP COLUMN IF EXISTS team_invitation_id;

-- 5. Restore original type constraint (comment, chat only)
ALTER TABLE public.mention_notifications 
DROP CONSTRAINT IF EXISTS mention_notifications_type_check;

ALTER TABLE public.mention_notifications 
ADD CONSTRAINT mention_notifications_type_check 
CHECK (type IN ('comment', 'chat'));

-- 6. Restore original get_mention_notifications function (without team_info)
-- Must DROP first because return type is changing (removing team_invitation_id and team_info columns)
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
    match_info JSONB
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
        END AS match_info
    FROM public.mention_notifications mn
    JOIN public.kicker k ON k.id = mn.kicker_id
    JOIN public.player p ON p.id = mn.sender_player_id
    LEFT JOIN public.matches m ON m.id = mn.match_id
    LEFT JOIN public.player p1 ON p1.id = m.player1
    LEFT JOIN public.player p2 ON p2.id = m.player2
    LEFT JOIN public.player p3 ON p3.id = m.player3
    LEFT JOIN public.player p4 ON p4.id = m.player4
    WHERE mn.user_id = auth.uid()
    ORDER BY mn.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;
