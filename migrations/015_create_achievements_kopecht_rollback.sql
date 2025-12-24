-- Rollback: Remove Achievement System Tables
-- Schema: kopecht

SET search_path TO kopecht;

-- Remove from realtime
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS kopecht.player_achievements;

-- Drop triggers
DROP TRIGGER IF EXISTS update_player_achievement_progress_updated_at ON kopecht.player_achievement_progress;
DROP TRIGGER IF EXISTS update_achievement_definitions_updated_at ON kopecht.achievement_definitions;

-- Drop functions
DROP FUNCTION IF EXISTS kopecht.update_achievement_progress_updated_at();
DROP FUNCTION IF EXISTS kopecht.update_achievement_definition_updated_at();

-- Drop tables (order matters due to foreign keys)
DROP TABLE IF EXISTS kopecht.player_achievements;
DROP TABLE IF EXISTS kopecht.player_achievement_progress;
DROP TABLE IF EXISTS kopecht.achievement_definitions;
DROP TABLE IF EXISTS kopecht.achievement_categories;
