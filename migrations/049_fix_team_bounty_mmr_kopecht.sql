-- Migration 049: Fix team bounty not being added to MMR (kopecht schema)
-- The bounty_claimed was being stored but NOT added to the team's MMR
-- This fix adds p_bounty_claimed to the MMR calculation (same as player bounty logic)

SET search_path TO kopecht;

DROP FUNCTION IF EXISTS kopecht.update_team_season_ranking_with_bounty(BIGINT, BIGINT, INTEGER, BOOLEAN, INTEGER);

CREATE OR REPLACE FUNCTION kopecht.update_team_season_ranking_with_bounty(
    p_team_id BIGINT,
    p_season_id BIGINT,
    p_mmr_change INTEGER,
    p_won BOOLEAN,
    p_bounty_claimed INTEGER DEFAULT 0
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Ensure ranking exists
    PERFORM kopecht.get_or_create_team_season_ranking(p_team_id, p_season_id);
    
    -- Update the ranking
    -- Add bounty_claimed to MMR for winner (same as player bounty logic)
    UPDATE kopecht.team_season_rankings
    SET 
        mmr = mmr + p_mmr_change + p_bounty_claimed,
        wins = CASE WHEN p_won THEN wins + 1 ELSE wins END,
        losses = CASE WHEN NOT p_won THEN losses + 1 ELSE losses END,
        bounty_claimed = bounty_claimed + p_bounty_claimed
    WHERE team_id = p_team_id AND season_id = p_season_id;
END;
$$;

GRANT EXECUTE ON FUNCTION kopecht.update_team_season_ranking_with_bounty(BIGINT, BIGINT, INTEGER, BOOLEAN, INTEGER) TO authenticated;
