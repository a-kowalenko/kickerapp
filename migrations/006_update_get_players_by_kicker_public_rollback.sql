-- Rollback: Restore original get_players_by_kicker function (public schema)

SET search_path TO public;

-- Restore original function without season parameter
CREATE OR REPLACE FUNCTION public.get_players_by_kicker(kicker_id_param INTEGER)
RETURNS SETOF player AS $$
BEGIN
    RETURN QUERY 
    SELECT * 
    FROM player
    WHERE kicker_id = kicker_id_param
    ORDER BY LOWER(name);
END;
$$ LANGUAGE plpgsql;

-- Drop the custom type
DROP TYPE IF EXISTS public.player_with_season_mmr;
