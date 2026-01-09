-- Rollback Migration 015: Remove triggers (kopecht)

-- Remove the team invite trigger and function
DROP TRIGGER IF EXISTS trigger_team_invite_notification ON kopecht.team_invitations;
DROP FUNCTION IF EXISTS kopecht.trigger_create_team_invite_notification();

-- Note: We keep the mention triggers as they should work fine
-- DROP TRIGGER IF EXISTS trigger_chat_mentions ON kopecht.chat_messages;
-- DROP TRIGGER IF EXISTS trigger_comment_mentions ON kopecht.match_comments;
