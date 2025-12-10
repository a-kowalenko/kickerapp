-- Rollback: 001_create_seasons_public.sql
-- This script reverts all changes made by the seasons migration for public schema (PRODUCTION)
-- IMPORTANT: Run this BEFORE rollback of dependent migrations (002, 003)

SET search_path TO public;

-- 1. Drop RLS policies on seasons and season_rankings tables
DROP POLICY IF EXISTS "System can manage season_rankings" ON public.season_rankings;
DROP POLICY IF EXISTS "Admins can update seasons" ON public.seasons;
DROP POLICY IF EXISTS "Admins can insert seasons" ON public.seasons;
DROP POLICY IF EXISTS "Users can view season_rankings" ON public.season_rankings;
DROP POLICY IF EXISTS "Users can view seasons for their kickers" ON public.seasons;

-- 2. Drop get_season_rankings function
DROP FUNCTION IF EXISTS public.get_season_rankings(BIGINT, BIGINT);

-- 3. Drop trigger and function for creating season rankings for new players
DROP TRIGGER IF EXISTS after_player_insert_create_season_ranking ON public.player;
DROP FUNCTION IF EXISTS public.create_season_ranking_for_new_player();

-- 4. Restore original get_player_matches_count function (without season support)
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

-- 5. Drop get_next_season_number function
DROP FUNCTION IF EXISTS public.get_next_season_number(BIGINT);

-- 6. Clear season_id from matches table (set back to NULL)
UPDATE public.matches SET season_id = NULL;

-- 7. Remove current_season_id from kicker table
ALTER TABLE public.kicker DROP COLUMN IF EXISTS current_season_id;

-- 8. Drop season_rankings table (this also drops its indexes)
DROP TABLE IF EXISTS public.season_rankings;

-- 9. Drop seasons table (this also drops its indexes)
DROP TABLE IF EXISTS public.seasons;

