-- Rollback: Remove player status system
-- Schema: kopecht

-- Drop RPC functions
DROP FUNCTION IF EXISTS kopecht.get_bounty_leaderboard(INT, TEXT);
DROP FUNCTION IF EXISTS kopecht.get_players_with_bounties(TEXT, INT);
DROP FUNCTION IF EXISTS kopecht.get_player_status(BIGINT);
DROP FUNCTION IF EXISTS kopecht.update_player_status_after_match(BIGINT, BIGINT, TEXT, BOOLEAN, INT, INT, INT);

-- Drop indexes
DROP INDEX IF EXISTS kopecht.idx_bounty_history_created;
DROP INDEX IF EXISTS kopecht.idx_bounty_history_victim;
DROP INDEX IF EXISTS kopecht.idx_bounty_history_claimer;
DROP INDEX IF EXISTS kopecht.idx_player_monthly_status_month;
DROP INDEX IF EXISTS kopecht.idx_player_monthly_status_player;
DROP INDEX IF EXISTS kopecht.idx_player_status_updated;
DROP INDEX IF EXISTS kopecht.idx_player_status_player;

-- Drop tables (order matters due to foreign keys)
DROP TABLE IF EXISTS kopecht.bounty_history;
DROP TABLE IF EXISTS kopecht.player_monthly_status;
DROP TABLE IF EXISTS kopecht.player_status;
DROP TABLE IF EXISTS kopecht.status_definitions;
