-- Rollback: Restore original unique constraint

-- Drop the partial indexes
DROP INDEX IF EXISTS kopecht.idx_player_achievement_progress_unique_with_season;
DROP INDEX IF EXISTS kopecht.idx_player_achievement_progress_unique_no_season;

-- Recreate the original unique constraint
ALTER TABLE kopecht.player_achievement_progress 
ADD CONSTRAINT player_achievement_progress_unique 
UNIQUE (player_id, achievement_id, season_id);
