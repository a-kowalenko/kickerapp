-- Function: public.get_player_matches_count(kicker_id bigint)
-- Description: Returns match count per player for a specific kicker
-- Type: Regular Function
-- Security: Invoker

CREATE OR REPLACE FUNCTION public.get_player_matches_count(kicker_id BIGINT)
RETURNS TABLE(id BIGINT, name TEXT, match_count BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT p.id, p.name, COALESCE(SUM(subquery.cnt)::bigint, 0) AS match_count
    FROM player p
    LEFT JOIN (
        SELECT m.player1 AS id, COUNT(*) AS cnt 
        FROM matches m
        WHERE m.kicker_id = $1 AND m.status != 'active'
        GROUP BY m.player1
        UNION ALL
        SELECT m.player2 AS id, COUNT(*) AS cnt 
        FROM matches m
        WHERE m.kicker_id = $1 AND m.status != 'active'
        GROUP BY m.player2
        UNION ALL
        SELECT m.player3 AS id, COUNT(*) AS cnt 
        FROM matches m
        WHERE m.player3 IS NOT NULL AND m.kicker_id = $1 AND m.status != 'active'
        GROUP BY m.player3
        UNION ALL
        SELECT m.player4 AS id, COUNT(*) AS cnt 
        FROM matches m
        WHERE m.player4 IS NOT NULL AND m.kicker_id = $1 AND m.status != 'active'
        GROUP BY m.player4
    ) subquery ON p.id = subquery.id
    WHERE p.kicker_id = $1
    GROUP BY p.id, p.name
    ORDER BY match_count DESC;
END;
$$ LANGUAGE plpgsql;
