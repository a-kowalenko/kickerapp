-- Fix unique constraint for player_achievement_progress to handle NULL season_id correctly
-- PostgreSQL doesn't consider NULL = NULL, so we need two partial indexes

-- First, clean up any existing duplicate rows where season_id IS NULL
-- Keep the row with the highest current_progress (or most recent updated_at if tied)
DELETE FROM player_achievement_progress a
USING player_achievement_progress b
WHERE a.season_id IS NULL
  AND b.season_id IS NULL
  AND a.player_id = b.player_id
  AND a.achievement_id = b.achievement_id
  AND a.id < b.id
  AND (a.current_progress < b.current_progress 
       OR (a.current_progress = b.current_progress AND a.updated_at < b.updated_at)
       OR (a.current_progress = b.current_progress AND a.updated_at = b.updated_at));

-- Also handle the case where we keep the one with higher progress even if it has lower id
DELETE FROM player_achievement_progress a
USING player_achievement_progress b
WHERE a.season_id IS NULL
  AND b.season_id IS NULL
  AND a.player_id = b.player_id
  AND a.achievement_id = b.achievement_id
  AND a.id > b.id
  AND (a.current_progress < b.current_progress 
       OR (a.current_progress = b.current_progress AND a.updated_at < b.updated_at));

-- Drop the existing unique constraint
ALTER TABLE player_achievement_progress 
DROP CONSTRAINT IF EXISTS player_achievement_progress_unique;

-- Create partial unique index for rows WITH season_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_player_achievement_progress_unique_with_season 
ON player_achievement_progress (player_id, achievement_id, season_id) 
WHERE season_id IS NOT NULL;

-- Create partial unique index for rows WITHOUT season_id (all-time achievements)
CREATE UNIQUE INDEX IF NOT EXISTS idx_player_achievement_progress_unique_no_season 
ON player_achievement_progress (player_id, achievement_id) 
WHERE season_id IS NULL;
