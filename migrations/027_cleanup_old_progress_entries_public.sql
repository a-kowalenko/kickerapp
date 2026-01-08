-- Cleanup old progress entries without season_id for season-specific achievements
-- This prevents old progress from being counted in new seasons

-- Delete progress entries that have no season_id but belong to season-specific achievements
DELETE FROM public.player_achievement_progress pap
WHERE pap.season_id IS NULL
AND EXISTS (
    SELECT 1 FROM public.achievement_definitions ad
    WHERE ad.id = pap.achievement_id
    AND COALESCE(ad.is_season_specific, true) = true
);

-- Note: This will reset progress for season-specific achievements
-- Global achievements (is_season_specific = false) will keep their progress with season_id = NULL
