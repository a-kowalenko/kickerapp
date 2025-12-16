-- Rollback: Restore original get_players_by_kicker function (kopecht schema)

SET search_path TO kopecht;

-- Restore original function without season parameter
CREATE OR REPLACE FUNCTION kopecht.get_players_by_kicker(kicker_id_param INTEGER)
RETURNS SETOF kopecht.player AS $$
BEGIN
    RETURN QUERY 
    SELECT * 
    FROM kopecht.player
    WHERE kicker_id = kicker_id_param
    ORDER BY LOWER(name);
END;
$$ LANGUAGE plpgsql;

-- Drop the custom type
DROP TYPE IF EXISTS kopecht.player_with_season_mmr;
