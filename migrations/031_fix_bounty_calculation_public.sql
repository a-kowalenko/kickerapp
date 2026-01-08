-- Migration: Fix bounty calculation - only add bounty when crossing thresholds
-- Schema: public
-- 
-- BUG: Previously, bounty was calculated as `bounty_per_streak * (streak - 2)` 
-- which meant bounty increased on EVERY win after streak 3.
--
-- FIX: Bounty should only be ADDED when crossing specific thresholds:
-- - 3rd win: +4 (warming_up)
-- - 5th win: +6 (hot_streak)  
-- - 7th win: +8 (on_fire)
-- - 10th win: +12 (legendary)

SET search_path TO public;

-- Drop existing function first (return type changed - added bounty_gained and old_streak)
DROP FUNCTION IF EXISTS public.update_player_status_after_match(BIGINT, BIGINT, TEXT, BOOLEAN, INT, INT, INT);

CREATE OR REPLACE FUNCTION public.update_player_status_after_match(
    p_player_id BIGINT,
    p_match_id BIGINT,
    p_gamemode TEXT,
    p_is_winner BOOLEAN,
    p_score_diff INT,
    p_own_mmr INT,
    p_opponent_mmr INT
)
RETURNS TABLE (
    bounty_claimed INT,
    bounty_victim_id BIGINT,
    new_status TEXT[],
    streak INT,
    bounty_gained INT,
    old_streak INT
) AS $$
DECLARE
    v_current_streak INT;
    v_new_streak INT;
    v_current_bounty INT;
    v_new_bounty INT;
    v_threshold_bounty INT;
    v_bounty_gained INT := 0;
    v_active_statuses TEXT[];
    v_bounty_to_claim INT := 0;
    v_bounty_victim BIGINT := NULL;
    v_opponent_status RECORD;
    v_status_def RECORD;
    v_month TEXT;
    v_was_on_loss_streak BOOLEAN := FALSE;
    v_loss_streak_before INT := 0;
BEGIN
    -- Get current month for monthly events
    v_month := TO_CHAR(NOW(), 'YYYY-MM');
    
    -- Get or create player status record
    INSERT INTO public.player_status (player_id, gamemode, current_streak, current_bounty, active_statuses)
    VALUES (p_player_id, p_gamemode, 0, 0, '{}')
    ON CONFLICT (player_id, gamemode) DO NOTHING;
    
    -- Get current status
    SELECT current_streak, current_bounty, active_statuses
    INTO v_current_streak, v_current_bounty, v_active_statuses
    FROM public.player_status
    WHERE player_id = p_player_id AND gamemode = p_gamemode;
    
    -- Track if player was on a loss streak (for comeback detection)
    IF v_current_streak < 0 THEN
        v_was_on_loss_streak := TRUE;
        v_loss_streak_before := ABS(v_current_streak);
    END IF;
    
    -- Calculate new streak
    IF p_is_winner THEN
        IF v_current_streak >= 0 THEN
            v_new_streak := v_current_streak + 1;
        ELSE
            v_new_streak := 1;  -- Reset from loss streak
        END IF;
    ELSE
        IF v_current_streak <= 0 THEN
            v_new_streak := v_current_streak - 1;
        ELSE
            v_new_streak := -1;  -- Reset from win streak
        END IF;
    END IF;
    
    -- ============================================
    -- FIXED BOUNTY CALCULATION
    -- Only add bounty when crossing a threshold
    -- ============================================
    IF p_is_winner AND v_new_streak >= 3 THEN
        -- Keep existing bounty as base (or 0 if coming from loss streak)
        IF v_current_streak >= 0 THEN
            v_new_bounty := v_current_bounty;
        ELSE
            v_new_bounty := 0;
        END IF;
        
        -- Check if we just crossed a threshold (3, 5, 7, or 10)
        -- Only add bounty if v_new_streak matches a threshold AND v_current_streak was below it
        SELECT bounty_per_streak INTO v_threshold_bounty
        FROM public.status_definitions
        WHERE type = 'streak' 
          AND (condition->>'streak_type') = 'win'
          AND (condition->>'min_streak')::int = v_new_streak
          AND v_current_streak < v_new_streak;  -- Must have just crossed this threshold
        
        -- Add threshold bounty if we crossed one
        IF v_threshold_bounty IS NOT NULL AND v_threshold_bounty > 0 THEN
            v_new_bounty := v_new_bounty + v_threshold_bounty;
            v_bounty_gained := v_threshold_bounty;  -- Track how much bounty was just gained
        END IF;
    ELSE
        -- Not on a win streak of 3+, bounty is 0
        v_new_bounty := 0;
    END IF;
    
    -- Check if we need to claim bounty from opponent (if we won and broke their streak)
    IF p_is_winner THEN
        FOR v_opponent_status IN
            SELECT ps.player_id, ps.current_streak, ps.current_bounty
            FROM public.player_status ps
            JOIN public.matches m ON m.id = p_match_id
            WHERE ps.gamemode = p_gamemode
              AND ps.current_streak >= 3
              AND ps.player_id != p_player_id
              AND (
                  (p_gamemode = '1on1' AND ps.player_id IN (m.player1, m.player2))
                  OR
                  (p_gamemode = '2on2' AND ps.player_id IN (m.player1, m.player2, m.player3, m.player4))
              )
        LOOP
            v_bounty_to_claim := v_bounty_to_claim + v_opponent_status.current_bounty;
            v_bounty_victim := v_opponent_status.player_id;
            
            INSERT INTO public.bounty_history (claimer_id, victim_id, match_id, gamemode, streak_broken, bounty_amount)
            VALUES (p_player_id, v_opponent_status.player_id, p_match_id, p_gamemode, v_opponent_status.current_streak, v_opponent_status.current_bounty);
        END LOOP;
    END IF;
    
    -- Determine active statuses based on new streak
    v_active_statuses := '{}';
    
    FOR v_status_def IN
        SELECT key, condition
        FROM public.status_definitions
        WHERE type = 'streak'
        ORDER BY priority DESC
    LOOP
        IF (v_status_def.condition->>'streak_type') = 'win' AND v_new_streak >= (v_status_def.condition->>'min_streak')::int THEN
            v_active_statuses := array_append(v_active_statuses, v_status_def.key);
        ELSIF (v_status_def.condition->>'streak_type') = 'loss' AND v_new_streak <= -(v_status_def.condition->>'min_streak')::int THEN
            v_active_statuses := array_append(v_active_statuses, v_status_def.key);
        END IF;
    END LOOP;
    
    -- Check for special events
    
    -- Comeback King: Won after 5+ loss streak
    IF p_is_winner AND v_was_on_loss_streak AND v_loss_streak_before >= 5 THEN
        v_active_statuses := array_append(v_active_statuses, 'comeback_king');
        
        INSERT INTO public.player_monthly_status (player_id, gamemode, month, comeback_count)
        VALUES (p_player_id, p_gamemode, v_month, 1)
        ON CONFLICT (player_id, gamemode, month)
        DO UPDATE SET comeback_count = public.player_monthly_status.comeback_count + 1, updated_at = NOW();
    END IF;
    
    -- Underdog: Beat opponent with 200+ higher MMR
    IF p_is_winner AND (p_opponent_mmr - p_own_mmr) >= 200 THEN
        v_active_statuses := array_append(v_active_statuses, 'underdog');
        
        INSERT INTO public.player_monthly_status (player_id, gamemode, month, underdog_count)
        VALUES (p_player_id, p_gamemode, v_month, 1)
        ON CONFLICT (player_id, gamemode, month)
        DO UPDATE SET underdog_count = public.player_monthly_status.underdog_count + 1, updated_at = NOW();
    END IF;
    
    -- Dominator: 10-0 win
    IF p_is_winner AND p_score_diff = 10 THEN
        v_active_statuses := array_append(v_active_statuses, 'dominator');
        
        INSERT INTO public.player_monthly_status (player_id, gamemode, month, dominator_count)
        VALUES (p_player_id, p_gamemode, v_month, 1)
        ON CONFLICT (player_id, gamemode, month)
        DO UPDATE SET dominator_count = public.player_monthly_status.dominator_count + 1, updated_at = NOW();
    END IF;
    
    -- Humiliated: 0-10 loss
    IF NOT p_is_winner AND p_score_diff = -10 THEN
        v_active_statuses := array_append(v_active_statuses, 'humiliated');
        
        INSERT INTO public.player_monthly_status (player_id, gamemode, month, humiliated_count)
        VALUES (p_player_id, p_gamemode, v_month, 1)
        ON CONFLICT (player_id, gamemode, month)
        DO UPDATE SET humiliated_count = public.player_monthly_status.humiliated_count + 1, updated_at = NOW();
    END IF;
    
    -- Update player status
    UPDATE public.player_status
    SET current_streak = v_new_streak,
        current_bounty = v_new_bounty,
        active_statuses = v_active_statuses,
        last_match_id = p_match_id,
        updated_at = NOW()
    WHERE player_id = p_player_id AND gamemode = p_gamemode;
    
    -- Return results
    bounty_claimed := v_bounty_to_claim;
    bounty_victim_id := v_bounty_victim;
    new_status := v_active_statuses;
    streak := v_new_streak;
    bounty_gained := v_bounty_gained;
    old_streak := v_current_streak;
    
    RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.update_player_status_after_match(BIGINT, BIGINT, TEXT, BOOLEAN, INT, INT, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_player_status_after_match(BIGINT, BIGINT, TEXT, BOOLEAN, INT, INT, INT) TO service_role;
