-- Atomic Achievement Progress Update Function (public schema)
-- This prevents race conditions when multiple events fire simultaneously

-- Function to atomically increment achievement progress
CREATE OR REPLACE FUNCTION public.increment_achievement_progress(
    p_player_id BIGINT,
    p_achievement_id BIGINT,
    p_kicker_id BIGINT,
    p_increment INTEGER DEFAULT 1
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
BEGIN
    -- Get max_progress from achievement definition
    SELECT ad.max_progress INTO v_max_progress
    FROM public.achievement_definitions ad
    WHERE ad.id = p_achievement_id AND ad.kicker_id = p_kicker_id;
    
    IF v_max_progress IS NULL THEN
        RAISE EXCEPTION 'Achievement not found: %', p_achievement_id;
    END IF;

    -- Atomic upsert with increment using row-level locking
    -- player_achievement_progress does NOT have kicker_id or created_at columns
    INSERT INTO public.player_achievement_progress AS pap (
        player_id, 
        achievement_id, 
        current_progress, 
        updated_at
    )
    VALUES (
        p_player_id, 
        p_achievement_id, 
        LEAST(p_increment, v_max_progress), 
        NOW()
    )
    ON CONFLICT (player_id, achievement_id) 
    DO UPDATE SET 
        current_progress = LEAST(pap.current_progress + p_increment, v_max_progress),
        updated_at = NOW()
    RETURNING current_progress INTO v_new_progress;

    -- Check if achievement is now completed
    IF v_new_progress >= v_max_progress THEN
        -- Try to award the achievement (ON CONFLICT DO NOTHING prevents duplicates)
        -- player_achievements uses unlocked_at not earned_at
        INSERT INTO public.player_achievements (
            player_id, 
            achievement_id, 
            unlocked_at
        )
        VALUES (
            p_player_id, 
            p_achievement_id, 
            NOW()
        )
        ON CONFLICT (player_id, achievement_id) DO NOTHING;
        
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
