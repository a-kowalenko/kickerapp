-- Rollback: Remove player status system
-- Schema: public
SET search_path TO public;

-- Drop RPC functions
DROP FUNCTION IF EXISTS public.get_bounty_leaderboard(INT, TEXT);
DROP FUNCTION IF EXISTS public.get_players_with_bounties(TEXT, INT);
DROP FUNCTION IF EXISTS public.get_player_status(BIGINT);
DROP FUNCTION IF EXISTS public.update_player_status_after_match(BIGINT, BIGINT, TEXT, BOOLEAN, INT, INT, INT);

-- Drop indexes
DROP INDEX IF EXISTS public.idx_bounty_history_created;
DROP INDEX IF EXISTS public.idx_bounty_history_victim;
DROP INDEX IF EXISTS public.idx_bounty_history_claimer;
DROP INDEX IF EXISTS public.idx_player_monthly_status_month;
DROP INDEX IF EXISTS public.idx_player_monthly_status_player;
DROP INDEX IF EXISTS public.idx_player_status_updated;
DROP INDEX IF EXISTS public.idx_player_status_player;

-- Drop tables
DROP TABLE IF EXISTS public.bounty_history;
DROP TABLE IF EXISTS public.player_monthly_status;
DROP TABLE IF EXISTS public.player_status;
DROP TABLE IF EXISTS public.status_definitions;
