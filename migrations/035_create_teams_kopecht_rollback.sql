-- Rollback: Remove teams and team_invitations tables (kopecht schema)

SET search_path TO kopecht;

-- Remove from realtime publication
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS kopecht.team_invitations;
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS kopecht.teams;

-- Drop RPC functions
DROP FUNCTION IF EXISTS kopecht.get_pending_team_invitations(BIGINT);
DROP FUNCTION IF EXISTS kopecht.get_teams_by_kicker(BIGINT);
DROP FUNCTION IF EXISTS kopecht.update_team_mmr(BIGINT, INTEGER, BOOLEAN);
DROP FUNCTION IF EXISTS kopecht.create_team_with_invitation(VARCHAR(50), BIGINT, BIGINT);
DROP FUNCTION IF EXISTS kopecht.dissolve_team(BIGINT);
DROP FUNCTION IF EXISTS kopecht.decline_team_invitation(BIGINT);
DROP FUNCTION IF EXISTS kopecht.accept_team_invitation(BIGINT);

-- Drop indexes on matches
DROP INDEX IF EXISTS kopecht.idx_matches_team2_id;
DROP INDEX IF EXISTS kopecht.idx_matches_team1_id;

-- Remove team columns from matches
ALTER TABLE kopecht.matches DROP COLUMN IF EXISTS team2_id;
ALTER TABLE kopecht.matches DROP COLUMN IF EXISTS team1_id;

-- Drop team_invitations table (and its policies)
DROP TABLE IF EXISTS kopecht.team_invitations CASCADE;

-- Drop teams table (and its policies)
DROP TABLE IF EXISTS kopecht.teams CASCADE;
