-- Rollback: Remove team status system tables and functions
-- Schema: public

SET search_path TO public;

-- Drop functions first
DROP FUNCTION IF EXISTS public.update_team_status_after_match(BIGINT, BIGINT, BOOLEAN, BIGINT);
DROP FUNCTION IF EXISTS public.get_team_bounty_for_team(BIGINT);
DROP FUNCTION IF EXISTS public.get_player_team_stats(BIGINT, BIGINT);
DROP FUNCTION IF EXISTS public.update_team_season_ranking_with_bounty(BIGINT, BIGINT, INTEGER, BOOLEAN, INTEGER);

-- Drop columns from matches table
ALTER TABLE public.matches DROP COLUMN IF EXISTS bounty_team1_team;
ALTER TABLE public.matches DROP COLUMN IF EXISTS bounty_team2_team;

-- Drop tables
DROP TABLE IF EXISTS public.team_bounty_history;
DROP TABLE IF EXISTS public.team_status;
