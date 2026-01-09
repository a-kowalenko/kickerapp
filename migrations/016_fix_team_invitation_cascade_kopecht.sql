-- Migration 016: Fix team-related foreign key constraints (kopecht)
-- Add ON DELETE CASCADE so related records are deleted properly

-- 1. Fix mention_notifications -> team_invitations constraint
ALTER TABLE kopecht.mention_notifications 
DROP CONSTRAINT IF EXISTS mention_notifications_team_invitation_id_fkey;

ALTER TABLE kopecht.mention_notifications
ADD CONSTRAINT mention_notifications_team_invitation_id_fkey 
FOREIGN KEY (team_invitation_id) 
REFERENCES kopecht.team_invitations(id) 
ON DELETE CASCADE;

-- 2. Fix team_invitations -> teams constraint (so invitations are deleted when team is deleted)
ALTER TABLE kopecht.team_invitations 
DROP CONSTRAINT IF EXISTS team_invitations_team_id_fkey;

ALTER TABLE kopecht.team_invitations
ADD CONSTRAINT team_invitations_team_id_fkey 
FOREIGN KEY (team_id) 
REFERENCES kopecht.teams(id) 
ON DELETE CASCADE;
