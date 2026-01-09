-- Update increment_achievement_progress function to support season_id
-- This fixes the issue where old progress entries were found instead of season-specific ones

-- Drop the old function signature first (without p_season_id parameter)
DROP FUNCTION IF EXISTS public.increment_achievement_progress(BIGINT, BIGINT, BIGINT, INTEGER);

CREATE OR REPLACE FUNCTION public.increment_achievement_progress(
    p_player_id BIGINT,
    p_achievement_id BIGINT,
    p_kicker_id BIGINT,
    p_increment INTEGER DEFAULT 1,
    p_season_id BIGINT DEFAULT NULL
)
RETURNS TABLE (
    new_progress INTEGER,
    max_progress INTEGER,
    is_completed BOOLEAN
) AS $$
DECLARE
    v_max_progress INTEGER;
    v_new_progress INTEGER;
    v_is_completed BOOLEAN := FALSE;
    v_is_season_specific BOOLEAN;
    v_progress_season_id BIGINT;
BEGIN
    -- Get max_progress and is_season_specific from achievement definition
    SELECT ad.max_progress, COALESCE(ad.is_season_specific, true) 
    INTO v_max_progress, v_is_season_specific
    FROM public.achievement_definitions ad
    WHERE ad.id = p_achievement_id AND ad.kicker_id = p_kicker_id;
    
    IF v_max_progress IS NULL THEN
        RAISE EXCEPTION 'Achievement not found: %', p_achievement_id;
    END IF;

    -- Determine the season_id for progress tracking
    -- Season-specific achievements use the provided season_id
    -- Global achievements (is_season_specific = false) use NULL
    IF v_is_season_specific THEN
        v_progress_season_id := p_season_id;
    ELSE
        v_progress_season_id := NULL;
    END IF;

    -- Atomic upsert with increment using row-level locking
    -- Now includes season_id in the unique constraint
    INSERT INTO public.player_achievement_progress AS pap (
        player_id, 
        achievement_id, 
        current_progress,
        season_id,
        updated_at
    )
    VALUES (
        p_player_id, 
        p_achievement_id, 
        LEAST(p_increment, v_max_progress),
        v_progress_season_id,
        NOW()
    )
    ON CONFLICT (player_id, achievement_id, season_id) 
    DO UPDATE SET 
        current_progress = LEAST(pap.current_progress + p_increment, v_max_progress),
        updated_at = NOW()
    RETURNING current_progress INTO v_new_progress;

    -- Check if achievement is now completed
    IF v_new_progress >= v_max_progress THEN
        -- Try to award the achievement (ON CONFLICT DO NOTHING prevents duplicates)
        INSERT INTO public.player_achievements (
            player_id, 
            achievement_id, 
            unlocked_at,
            season_id
        )
        VALUES (
            p_player_id, 
            p_achievement_id, 
            NOW(),
            p_season_id
        )
        ON CONFLICT (player_id, achievement_id, season_id) DO NOTHING;
        
        -- Check if a row was actually inserted (first time completion)
        IF FOUND THEN
            v_is_completed := TRUE;
        END IF;
    END IF;

    RETURN QUERY SELECT v_new_progress, v_max_progress, v_is_completed;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.increment_achievement_progress TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_achievement_progress TO service_role;
