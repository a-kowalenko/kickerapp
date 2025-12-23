-- Fix: Update increment_achievement_progress to use UPDATE-first pattern with exception handling
-- This is the most robust approach for handling concurrent inserts
-- Schema: public

CREATE OR REPLACE FUNCTION public.increment_achievement_progress(
    p_player_id BIGINT,
    p_achievement_id BIGINT,
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
    WHERE ad.id = p_achievement_id;
    
    IF v_max_progress IS NULL THEN
        RAISE EXCEPTION 'Achievement not found: %', p_achievement_id;
    END IF;

    -- Determine the season_id for progress tracking
    IF v_is_season_specific THEN
        v_progress_season_id := p_season_id;
    ELSE
        v_progress_season_id := NULL;
    END IF;

    -- STRATEGY: UPDATE-first, then INSERT with exception handling
    -- This is the most robust pattern for concurrent upserts
    
    -- Step 1: Try UPDATE first (works if record exists)
    IF v_progress_season_id IS NULL THEN
        UPDATE public.player_achievement_progress
        SET current_progress = LEAST(current_progress + p_increment, v_max_progress),
            updated_at = NOW()
        WHERE player_id = p_player_id 
          AND achievement_id = p_achievement_id
          AND season_id IS NULL
        RETURNING current_progress INTO v_new_progress;
    ELSE
        UPDATE public.player_achievement_progress
        SET current_progress = LEAST(current_progress + p_increment, v_max_progress),
            updated_at = NOW()
        WHERE player_id = p_player_id 
          AND achievement_id = p_achievement_id
          AND season_id = v_progress_season_id
        RETURNING current_progress INTO v_new_progress;
    END IF;

    -- Step 2: If no row was updated, we need to INSERT
    IF NOT FOUND THEN
        BEGIN
            -- Try to insert new record
            v_new_progress := LEAST(p_increment, v_max_progress);
            
            INSERT INTO public.player_achievement_progress (
                player_id, 
                achievement_id, 
                current_progress,
                season_id,
                updated_at
            )
            VALUES (
                p_player_id, 
                p_achievement_id, 
                v_new_progress,
                v_progress_season_id,
                NOW()
            );
        EXCEPTION WHEN unique_violation THEN
            -- Another concurrent request inserted first, do UPDATE instead
            IF v_progress_season_id IS NULL THEN
                UPDATE public.player_achievement_progress
                SET current_progress = LEAST(current_progress + p_increment, v_max_progress),
                    updated_at = NOW()
                WHERE player_id = p_player_id 
                  AND achievement_id = p_achievement_id
                  AND season_id IS NULL
                RETURNING current_progress INTO v_new_progress;
            ELSE
                UPDATE public.player_achievement_progress
                SET current_progress = LEAST(current_progress + p_increment, v_max_progress),
                    updated_at = NOW()
                WHERE player_id = p_player_id 
                  AND achievement_id = p_achievement_id
                  AND season_id = v_progress_season_id
                RETURNING current_progress INTO v_new_progress;
            END IF;
        END;
    END IF;

    -- Check if achievement is now completed
    IF v_new_progress >= v_max_progress THEN
        BEGIN
            IF v_progress_season_id IS NULL THEN
                INSERT INTO public.player_achievements (
                    player_id, achievement_id, unlocked_at, season_id
                ) 
                SELECT p_player_id, p_achievement_id, NOW(), NULL
                WHERE NOT EXISTS (
                    SELECT 1 FROM public.player_achievements
                    WHERE player_id = p_player_id 
                      AND achievement_id = p_achievement_id
                      AND season_id IS NULL
                );
            ELSE
                INSERT INTO public.player_achievements (
                    player_id, achievement_id, unlocked_at, season_id
                )
                SELECT p_player_id, p_achievement_id, NOW(), p_season_id
                WHERE NOT EXISTS (
                    SELECT 1 FROM public.player_achievements
                    WHERE player_id = p_player_id 
                      AND achievement_id = p_achievement_id
                      AND season_id = p_season_id
                );
            END IF;
            
            IF FOUND THEN
                v_is_completed := TRUE;
            END IF;
        EXCEPTION WHEN unique_violation THEN
            -- Achievement already awarded by another concurrent request
            v_is_completed := FALSE;
        END;
    END IF;

    RETURN QUERY SELECT v_new_progress, v_max_progress, v_is_completed;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.increment_achievement_progress TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_achievement_progress TO service_role;

COMMENT ON FUNCTION public.increment_achievement_progress IS 'Atomically increments achievement progress using UPDATE-first pattern with exception handling for concurrent inserts.';
