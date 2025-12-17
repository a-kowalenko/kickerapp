-- Rollback: Drop create_season_end_history function from kopecht schema

DROP FUNCTION IF EXISTS kopecht.create_season_end_history(BIGINT, BIGINT);
