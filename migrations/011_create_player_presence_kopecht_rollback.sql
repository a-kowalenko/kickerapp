-- Rollback: Drop player_presence table and related functions

DROP FUNCTION IF EXISTS kopecht.get_players_activity(BIGINT);
DROP FUNCTION IF EXISTS kopecht.upsert_player_presence(BIGINT, BIGINT);
DROP TABLE IF EXISTS kopecht.player_presence;
