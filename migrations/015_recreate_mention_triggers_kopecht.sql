-- Migration 015: Recreate missing triggers for mentions and team invites (kopecht)
-- The trigger FUNCTIONS exist but the TRIGGERS on tables are missing

-- 1. Recreate trigger on chat_messages for @mentions
DROP TRIGGER IF EXISTS trigger_chat_mentions ON kopecht.chat_messages;
CREATE TRIGGER trigger_chat_mentions
    AFTER INSERT ON kopecht.chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION kopecht.trigger_create_chat_mention_notifications();

-- 2. Recreate trigger on match_comments for @mentions
DROP TRIGGER IF EXISTS trigger_comment_mentions ON kopecht.match_comments;
CREATE TRIGGER trigger_comment_mentions
    AFTER INSERT ON kopecht.match_comments
    FOR EACH ROW
    EXECUTE FUNCTION kopecht.trigger_create_comment_mention_notifications();

-- 3. Create trigger function for team_invitations to insert into mention_notifications
CREATE OR REPLACE FUNCTION kopecht.trigger_create_team_invite_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_invited_user_id UUID;
    v_inviting_player_name TEXT;
    v_team_name TEXT;
BEGIN
    -- Only process pending invitations
    IF NEW.status != 'pending' THEN
        RETURN NEW;
    END IF;

    -- Get the user_id of the invited player
    SELECT user_id INTO v_invited_user_id
    FROM kopecht.player
    WHERE id = NEW.invited_player_id;

    -- Skip if invited player has no user_id
    IF v_invited_user_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- Get inviting player name
    SELECT name INTO v_inviting_player_name
    FROM kopecht.player
    WHERE id = NEW.inviting_player_id;

    -- Get team name (table is called "teams" not "team")
    SELECT name INTO v_team_name
    FROM kopecht.teams
    WHERE id = NEW.team_id;

    -- Insert notification
    INSERT INTO kopecht.mention_notifications (
        user_id, type, source_id, kicker_id,
        sender_player_id, content_preview, team_invitation_id, is_read, created_at
    )
    VALUES (
        v_invited_user_id,
        'team_invite',
        NEW.id,
        (SELECT kicker_id FROM kopecht.player WHERE id = NEW.inviting_player_id),
        NEW.inviting_player_id,
        v_inviting_player_name || ' invited you to join team "' || v_team_name || '"',
        NEW.id,
        FALSE,
        NOW()
    )
    ON CONFLICT DO NOTHING;

    RETURN NEW;
END;
$$;

-- 4. Create trigger on team_invitations
DROP TRIGGER IF EXISTS trigger_team_invite_notification ON kopecht.team_invitations;
CREATE TRIGGER trigger_team_invite_notification
    AFTER INSERT ON kopecht.team_invitations
    FOR EACH ROW
    EXECUTE FUNCTION kopecht.trigger_create_team_invite_notification();
