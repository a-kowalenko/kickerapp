-- Rollback: Remove team_history table (public schema)

SET search_path TO public;

-- Drop RPC function
DROP FUNCTION IF EXISTS public.get_team_mmr_history(BIGINT, INTEGER);

-- Drop trigger
DROP TRIGGER IF EXISTS trigger_record_team_history ON public.matches;

-- Drop function
DROP FUNCTION IF EXISTS public.record_team_history();

-- Drop policies
DROP POLICY IF EXISTS "Team history is viewable by everyone" ON public.team_history;

-- Drop table
DROP TABLE IF EXISTS public.team_history;
