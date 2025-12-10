-- Function: public.get_players_by_kicker(kicker_id_param integer)
-- Description: Returns all players for a specific kicker, ordered by name
-- Type: Regular Function
-- Security: Invoker

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
