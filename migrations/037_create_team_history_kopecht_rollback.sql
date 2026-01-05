-- Rollback: Remove team_history table (kopecht schema)

SET search_path TO kopecht;

-- Drop RPC function
DROP FUNCTION IF EXISTS kopecht.get_team_mmr_history(BIGINT, INTEGER);

-- Drop trigger
DROP TRIGGER IF EXISTS trigger_record_team_history ON kopecht.matches;

-- Drop function
DROP FUNCTION IF EXISTS kopecht.record_team_history();

-- Drop policies
DROP POLICY IF EXISTS "Team history is viewable by everyone" ON kopecht.team_history;

-- Drop table
DROP TABLE IF EXISTS kopecht.team_history;
