-- Migration: Create atomic_increment_progress fallback function
-- This function is a simpler, faster fallback for progress updates
-- Uses INSERT ... ON CONFLICT DO UPDATE for true atomic upsert
-- Schema: public

-- Create function with a unique constraint-friendly approach
CREATE OR REPLACE FUNCTION public.atomic_increment_progress(
    p_player_id BIGINT,
    p_achievement_id BIGINT,
    p_increment INTEGER DEFAULT 1,
    p_max_progress INTEGER DEFAULT 1,
    p_season_id BIGINT DEFAULT NULL
)
RETURNS TABLE (
    new_progress INTEGER
) AS $$
DECLARE
    v_new_progress INTEGER;
BEGIN
    -- Use advisory lock to prevent race conditions on this specific player+achievement combo
    -- This is faster than FOR UPDATE when there's high contention
    PERFORM pg_advisory_xact_lock(
        hashtext('ach_prog_' || p_player_id::text || '_' || p_achievement_id::text || '_' || COALESCE(p_season_id::text, 'null'))
    );

    -- Handle NULL season_id explicitly since PostgreSQL NULL != NULL
    IF p_season_id IS NULL THEN
        -- Try to insert, on conflict update
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
            LEAST(p_increment, p_max_progress),
            NULL,
            NOW()
        )
        ON CONFLICT (player_id, achievement_id, season_id) 
        WHERE season_id IS NULL
        DO UPDATE SET 
            current_progress = LEAST(
                public.player_achievement_progress.current_progress + p_increment, 
                p_max_progress
            ),
            updated_at = NOW()
        RETURNING current_progress INTO v_new_progress;
        
        -- If ON CONFLICT WHERE didn't match (no unique constraint for NULL), try explicit approach
        IF v_new_progress IS NULL THEN
            -- Check if record exists
            SELECT current_progress INTO v_new_progress
            FROM public.player_achievement_progress
            WHERE player_id = p_player_id
              AND achievement_id = p_achievement_id
              AND season_id IS NULL;
            
            IF v_new_progress IS NOT NULL THEN
                -- Update existing
                v_new_progress := LEAST(v_new_progress + p_increment, p_max_progress);
                UPDATE public.player_achievement_progress
                SET current_progress = v_new_progress, updated_at = NOW()
                WHERE player_id = p_player_id
                  AND achievement_id = p_achievement_id
                  AND season_id IS NULL;
            ELSE
                -- Insert new
                v_new_progress := LEAST(p_increment, p_max_progress);
                INSERT INTO public.player_achievement_progress (
                    player_id, achievement_id, current_progress, season_id, updated_at
                ) VALUES (
                    p_player_id, p_achievement_id, v_new_progress, NULL, NOW()
                );
            END IF;
        END IF;
    ELSE
        -- For non-NULL season_id, standard ON CONFLICT works
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
            LEAST(p_increment, p_max_progress),
            p_season_id,
            NOW()
        )
        ON CONFLICT (player_id, achievement_id, season_id)
        DO UPDATE SET 
            current_progress = LEAST(
                public.player_achievement_progress.current_progress + p_increment, 
                p_max_progress
            ),
            updated_at = NOW()
        RETURNING current_progress INTO v_new_progress;
    END IF;

    RETURN QUERY SELECT v_new_progress;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.atomic_increment_progress TO authenticated;
GRANT EXECUTE ON FUNCTION public.atomic_increment_progress TO service_role;

COMMENT ON FUNCTION public.atomic_increment_progress IS 'Atomic fallback for incrementing achievement progress. Uses advisory lock to prevent race conditions under high concurrency.';
