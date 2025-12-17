-- Rollback: Drop create_season_end_history function from public schema

DROP FUNCTION IF EXISTS public.create_season_end_history(BIGINT, BIGINT);
