-- Rollback: Drop player_presence table and related functions

DROP FUNCTION IF EXISTS public.get_players_activity(BIGINT);
DROP FUNCTION IF EXISTS public.upsert_player_presence(BIGINT, BIGINT);
DROP TABLE IF EXISTS public.player_presence;
