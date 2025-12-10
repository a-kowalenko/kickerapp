-- Function: public.get_player_match_counts()
-- Description: Returns match count for all players (no parameters)
-- Type: Regular Function (SQL)
-- Security: Invoker

CREATE OR REPLACE FUNCTION public.get_player_match_counts()
RETURNS TABLE(id INTEGER, name TEXT, match_count INTEGER) AS $$
    SELECT p.id, p.name, COALESCE(sum(cnt), 0) as match_count
    FROM player p
    LEFT JOIN (
        SELECT player1 as player_id, count(*) as cnt FROM matches GROUP BY player1
        UNION ALL
        SELECT player2 as player_id, count(*) as cnt FROM matches GROUP BY player2
        UNION ALL
        SELECT player3 as player_id, count(*) as cnt FROM matches WHERE player3 IS NOT NULL GROUP BY player3
        UNION ALL
        SELECT player4 as player_id, count(*) as cnt FROM matches WHERE player4 IS NOT NULL GROUP BY player4
    ) subquery ON p.id = subquery.player_id
    GROUP BY p.id, p.name
    ORDER BY match_count DESC;
$$ LANGUAGE sql;
