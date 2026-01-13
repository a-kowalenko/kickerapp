-- Migration: Create Achievement Feed Statistics RPC Functions
-- Schema: kopecht

SET search_path TO kopecht;

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS kopecht.get_achievement_feed_stats(BIGINT, BIGINT);
DROP FUNCTION IF EXISTS kopecht.get_achievement_leaderboard(BIGINT, BIGINT, INT);

-- Function to get achievement feed statistics
-- Returns counts for today, this week, this month, and total
CREATE OR REPLACE FUNCTION kopecht.get_achievement_feed_stats(
    p_kicker_id BIGINT,
    p_season_id BIGINT DEFAULT NULL
)
RETURNS TABLE (
    today_count BIGINT,
    week_count BIGINT,
    month_count BIGINT,
    total_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_start_of_day TIMESTAMPTZ;
    v_start_of_week TIMESTAMPTZ;
    v_start_of_month TIMESTAMPTZ;
BEGIN
    -- Calculate date boundaries
    v_start_of_day := date_trunc('day', NOW());
    v_start_of_week := NOW() - INTERVAL '7 days';
    v_start_of_month := NOW() - INTERVAL '30 days';
    
    RETURN QUERY
    SELECT 
        COUNT(*) FILTER (WHERE pa.unlocked_at >= v_start_of_day) AS today_count,
        COUNT(*) FILTER (WHERE pa.unlocked_at >= v_start_of_week) AS week_count,
        COUNT(*) FILTER (WHERE pa.unlocked_at >= v_start_of_month) AS month_count,
        COUNT(*) AS total_count
    FROM kopecht.player_achievements pa
    INNER JOIN kopecht.player p ON p.id = pa.player_id
    WHERE p.kicker_id = p_kicker_id
      AND (p_season_id IS NULL OR pa.season_id = p_season_id);
END;
$$;

-- Function to get achievement leaderboard
-- Returns top players by total achievement points
CREATE OR REPLACE FUNCTION kopecht.get_achievement_leaderboard(
    p_kicker_id BIGINT,
    p_season_id BIGINT DEFAULT NULL,
    p_limit INT DEFAULT 5
)
RETURNS TABLE (
    player_id BIGINT,
    player_name TEXT,
    avatar TEXT,
    total_points BIGINT,
    achievement_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id AS player_id,
        p.name AS player_name,
        p.avatar,
        COALESCE(SUM(ad.points), 0)::BIGINT AS total_points,
        COUNT(pa.id) AS achievement_count
    FROM kopecht.player p
    INNER JOIN kopecht.player_achievements pa ON pa.player_id = p.id
    INNER JOIN kopecht.achievement_definitions ad ON ad.id = pa.achievement_id
    WHERE p.kicker_id = p_kicker_id
      AND (p_season_id IS NULL OR pa.season_id = p_season_id)
    GROUP BY p.id, p.name, p.avatar
    ORDER BY total_points DESC
    LIMIT p_limit;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION kopecht.get_achievement_feed_stats(BIGINT, BIGINT) TO authenticated;
GRANT EXECUTE ON FUNCTION kopecht.get_achievement_leaderboard(BIGINT, BIGINT, INT) TO authenticated;

-- Add helpful comments
COMMENT ON FUNCTION kopecht.get_achievement_feed_stats IS 'Get achievement unlock statistics for a kicker (counts by time period)';
COMMENT ON FUNCTION kopecht.get_achievement_leaderboard IS 'Get top players by achievement points for a kicker';
