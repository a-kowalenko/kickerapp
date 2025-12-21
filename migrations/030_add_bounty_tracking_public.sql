-- ============================================
-- Migration: Add Bounty Tracking Columns
-- Adds bounty tracking to matches, season_rankings, and player_history
-- ============================================

-- ============================================
-- 1. ADD BOUNTY COLUMNS TO MATCHES TABLE
-- Stores the bounty earned by each team in a match
-- ============================================
ALTER TABLE public.matches 
ADD COLUMN IF NOT EXISTS bounty_team1 INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS bounty_team2 INT DEFAULT 0;

-- ============================================
-- 2. ADD BOUNTY COLUMNS TO SEASON_RANKINGS TABLE
-- Tracks total bounty claimed per player per season
-- ============================================
ALTER TABLE public.season_rankings
ADD COLUMN IF NOT EXISTS bounty_claimed INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS bounty_claimed_2on2 INT DEFAULT 0;

-- ============================================
-- 3. ADD BOUNTY COLUMNS TO PLAYER_HISTORY TABLE
-- Tracks daily bounty claimed for historical stats
-- ============================================
ALTER TABLE public.player_history
ADD COLUMN IF NOT EXISTS bounty_claimed INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS bounty_claimed_2on2 INT DEFAULT 0;

-- ============================================
-- 4. UPDATE STATUS_DEFINITIONS TO ENSURE EVEN BOUNTY VALUES
-- Bounty should always be divisible by 2 for fair 2on2 splits
-- ============================================
UPDATE public.status_definitions
SET bounty_per_streak = 4
WHERE key = 'warming_up' AND bounty_per_streak = 3;

UPDATE public.status_definitions
SET bounty_per_streak = 6
WHERE key = 'hot_streak' AND bounty_per_streak = 5;

UPDATE public.status_definitions
SET bounty_per_streak = 8
WHERE key = 'on_fire' AND bounty_per_streak = 8;

UPDATE public.status_definitions
SET bounty_per_streak = 12
WHERE key = 'legendary' AND bounty_per_streak = 12;

-- ============================================
-- 5. CREATE RPC TO GET TEAM BOUNTY
-- Returns total bounty for a list of player IDs in a given gamemode
-- ============================================
CREATE OR REPLACE FUNCTION public.get_team_bounty(
    p_player_ids BIGINT[],
    p_gamemode TEXT
)
RETURNS INT AS $$
DECLARE
    v_total_bounty INT := 0;
BEGIN
    SELECT COALESCE(SUM(current_bounty), 0)
    INTO v_total_bounty
    FROM public.player_status
    WHERE player_id = ANY(p_player_ids)
      AND gamemode = p_gamemode;
    
    RETURN v_total_bounty;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_team_bounty(BIGINT[], TEXT) TO authenticated;

-- ============================================
-- 6. CREATE RPC TO UPDATE SEASON RANKINGS BOUNTY
-- Increments bounty_claimed for winners
-- ============================================
CREATE OR REPLACE FUNCTION public.add_bounty_to_season_rankings(
    p_player_id BIGINT,
    p_season_id BIGINT,
    p_bounty_amount INT,
    p_gamemode TEXT
)
RETURNS VOID AS $$
BEGIN
    IF p_gamemode = '1on1' THEN
        UPDATE public.season_rankings
        SET bounty_claimed = bounty_claimed + p_bounty_amount
        WHERE player_id = p_player_id AND season_id = p_season_id;
    ELSE
        UPDATE public.season_rankings
        SET bounty_claimed_2on2 = bounty_claimed_2on2 + p_bounty_amount
        WHERE player_id = p_player_id AND season_id = p_season_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.add_bounty_to_season_rankings(BIGINT, BIGINT, INT, TEXT) TO authenticated;

-- ============================================
-- 7. UPDATE update_player_history FUNCTION
-- Add bounty tracking to daily history snapshots
-- ============================================

-- Note: The existing update_player_history function will need to be updated
-- to include bounty_claimed in the daily snapshot. This is handled separately
-- if the function exists, or the bounty is tracked via direct updates.

COMMENT ON COLUMN public.matches.bounty_team1 IS 'Total bounty earned by team 1 in this match';
COMMENT ON COLUMN public.matches.bounty_team2 IS 'Total bounty earned by team 2 in this match';
COMMENT ON COLUMN public.season_rankings.bounty_claimed IS 'Total bounty claimed in 1on1 this season';
COMMENT ON COLUMN public.season_rankings.bounty_claimed_2on2 IS 'Total bounty claimed in 2on2 this season';
COMMENT ON COLUMN public.player_history.bounty_claimed IS 'Bounty claimed in 1on1 on this date';
COMMENT ON COLUMN public.player_history.bounty_claimed_2on2 IS 'Bounty claimed in 2on2 on this date';
