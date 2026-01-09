-- Migration 016: Fix team-related foreign key constraints (public)
-- Add ON DELETE CASCADE so related records are deleted properly

-- 1. Fix mention_notifications -> team_invitations constraint
ALTER TABLE public.mention_notifications 
DROP CONSTRAINT IF EXISTS mention_notifications_team_invitation_id_fkey;

ALTER TABLE public.mention_notifications
ADD CONSTRAINT mention_notifications_team_invitation_id_fkey 
FOREIGN KEY (team_invitation_id) 
REFERENCES public.team_invitations(id) 
ON DELETE CASCADE;

-- 2. Fix team_invitations -> teams constraint (so invitations are deleted when team is deleted)
ALTER TABLE public.team_invitations 
DROP CONSTRAINT IF EXISTS team_invitations_team_id_fkey;

ALTER TABLE public.team_invitations
ADD CONSTRAINT team_invitations_team_id_fkey 
FOREIGN KEY (team_id) 
REFERENCES public.teams(id) 
ON DELETE CASCADE;
