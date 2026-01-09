-- Fix increment_achievement_progress function to handle NULL season_id correctly
-- The previous ON CONFLICT clause doesn't work with NULL values in PostgreSQL
-- This update uses explicit SELECT + INSERT/UPDATE logic instead

CREATE OR REPLACE FUNCTION kopecht.increment_achievement_progress(
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
    v_current_progress INTEGER;
    v_is_completed BOOLEAN := FALSE;
    v_is_season_specific BOOLEAN;
    v_progress_season_id BIGINT;
    v_existing_id BIGINT;
BEGIN
    -- Get max_progress and is_season_specific from achievement definition
    SELECT ad.max_progress, COALESCE(ad.is_season_specific, true) 
    INTO v_max_progress, v_is_season_specific
    FROM kopecht.achievement_definitions ad
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

    -- Check if progress record exists (handle NULL season_id explicitly)
    IF v_progress_season_id IS NULL THEN
        SELECT id, current_progress INTO v_existing_id, v_current_progress
        FROM kopecht.player_achievement_progress
        WHERE player_id = p_player_id 
          AND achievement_id = p_achievement_id
          AND season_id IS NULL
        FOR UPDATE;
    ELSE
        SELECT id, current_progress INTO v_existing_id, v_current_progress
        FROM kopecht.player_achievement_progress
        WHERE player_id = p_player_id 
          AND achievement_id = p_achievement_id
          AND season_id = v_progress_season_id
        FOR UPDATE;
    END IF;

    IF v_existing_id IS NOT NULL THEN
        -- Update existing record
        v_new_progress := LEAST(v_current_progress + p_increment, v_max_progress);
        
        UPDATE kopecht.player_achievement_progress
        SET current_progress = v_new_progress,
            updated_at = NOW()
        WHERE id = v_existing_id;
    ELSE
        -- Insert new record
        v_new_progress := LEAST(p_increment, v_max_progress);
        
        INSERT INTO kopecht.player_achievement_progress (
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
    END IF;

    -- Check if achievement is now completed
    IF v_new_progress >= v_max_progress THEN
        -- Try to award the achievement
        -- Use explicit check for NULL season_id
        IF p_season_id IS NULL THEN
            -- Check if achievement already awarded (for all-time achievements)
            IF NOT EXISTS (
                SELECT 1 FROM kopecht.player_achievements
                WHERE player_id = p_player_id 
                  AND achievement_id = p_achievement_id
                  AND season_id IS NULL
            ) THEN
                INSERT INTO kopecht.player_achievements (
                    player_id, 
                    achievement_id, 
                    unlocked_at,
                    season_id
                )
                VALUES (
                    p_player_id, 
                    p_achievement_id, 
                    NOW(),
                    NULL
                );
                v_is_completed := TRUE;
            END IF;
        ELSE
            -- Check if achievement already awarded for this season
            IF NOT EXISTS (
                SELECT 1 FROM kopecht.player_achievements
                WHERE player_id = p_player_id 
                  AND achievement_id = p_achievement_id
                  AND season_id = p_season_id
            ) THEN
                INSERT INTO kopecht.player_achievements (
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
                );
                v_is_completed := TRUE;
            END IF;
        END IF;
    END IF;

    RETURN QUERY SELECT v_new_progress, v_max_progress, v_is_completed;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION kopecht.increment_achievement_progress TO authenticated;
GRANT EXECUTE ON FUNCTION kopecht.increment_achievement_progress TO service_role;
