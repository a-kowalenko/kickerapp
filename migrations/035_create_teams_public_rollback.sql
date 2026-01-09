-- Rollback: Remove teams and team_invitations tables (public schema)

-- Remove from realtime publication
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS public.team_invitations;
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS public.teams;

-- Drop RPC functions
DROP FUNCTION IF EXISTS public.get_pending_team_invitations(BIGINT);
DROP FUNCTION IF EXISTS public.get_teams_by_kicker(BIGINT);
DROP FUNCTION IF EXISTS public.update_team_mmr(BIGINT, INTEGER, BOOLEAN);
DROP FUNCTION IF EXISTS public.create_team_with_invitation(VARCHAR(50), BIGINT, BIGINT);
DROP FUNCTION IF EXISTS public.dissolve_team(BIGINT);
DROP FUNCTION IF EXISTS public.decline_team_invitation(BIGINT);
DROP FUNCTION IF EXISTS public.accept_team_invitation(BIGINT);

-- Drop indexes on matches
DROP INDEX IF EXISTS public.idx_matches_team2_id;
DROP INDEX IF EXISTS public.idx_matches_team1_id;

-- Remove team columns from matches
ALTER TABLE public.matches DROP COLUMN IF EXISTS team2_id;
ALTER TABLE public.matches DROP COLUMN IF EXISTS team1_id;

-- Drop team_invitations table (and its policies)
DROP TABLE IF EXISTS public.team_invitations CASCADE;

-- Drop teams table (and its policies)
DROP TABLE IF EXISTS public.teams CASCADE;
