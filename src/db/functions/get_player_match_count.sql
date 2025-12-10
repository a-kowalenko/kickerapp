-- Function: public.get_player_match_count (multiple overloads)
-- Description: Generic function to get match counts - multiple signatures
-- Type: Regular Function
-- Security: Invoker

-- Overload 1: Using TEXT parameters
CREATE OR REPLACE FUNCTION public.get_player_match_count(matchestable TEXT, playertable TEXT)
RETURNS TABLE(id INTEGER, name TEXT, match_count INTEGER) AS $$
BEGIN
    RETURN QUERY EXECUTE
    'SELECT p.id, p.name, COALESCE(sum(sub.cnt), 0) as match_count
    FROM ' || quote_ident(playerTable) || ' p
    LEFT JOIN (
        SELECT player1 as player_id, count(*) as cnt FROM ' || quote_ident(matchesTable) || ' GROUP BY player1
        UNION ALL
        SELECT player2 as player_id, count(*) as cnt FROM ' || quote_ident(matchesTable) || ' GROUP BY player2
        UNION ALL
        SELECT player3 as player_id, count(*) as cnt FROM ' || quote_ident(matchesTable) || ' WHERE player3 IS NOT NULL GROUP BY player3
        UNION ALL
        SELECT player4 as player_id, count(*) as cnt FROM ' || quote_ident(matchesTable) || ' WHERE player4 IS NOT NULL GROUP BY player4
    ) sub ON p.id = sub.player_id
    GROUP BY p.id, p.name
    ORDER BY match_count DESC';
END;
$$ LANGUAGE plpgsql;

-- Overload 2: Using REGCLASS parameters
CREATE OR REPLACE FUNCTION public.get_player_match_count(matchestable REGCLASS, playertable REGCLASS)
RETURNS TABLE(id INTEGER, name TEXT, match_count INTEGER) AS $$
BEGIN
    RETURN QUERY EXECUTE format($f$
        SELECT p.id, p.name, COALESCE(sum(cnt), 0) as match_count
        FROM %s p
        LEFT JOIN (
            SELECT player1 as player_id, count(*) as cnt FROM %s GROUP BY player1
            UNION ALL
            SELECT player2 as player_id, count(*) as cnt FROM %s GROUP BY player2
            UNION ALL
            SELECT player3 as player_id, count(*) FROM %s WHERE player3 IS NOT NULL GROUP BY player3
            UNION ALL
            SELECT player4 as player_id, count(*) FROM %s WHERE player4 IS NOT NULL GROUP BY player4
        ) AS subquery ON p.id = subquery.player_id
        GROUP BY p.id, p.name
        ORDER BY match_count DESC
    $f$, playerTable, matchesTable, matchesTable, matchesTable, matchesTable);
END;
$$ LANGUAGE plpgsql;
