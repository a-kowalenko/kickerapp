-- Rollback: Remove Achievement System Tables
-- Schema: public

SET search_path TO public;

-- Remove from realtime
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS public.player_achievements;

-- Drop triggers
DROP TRIGGER IF EXISTS update_player_achievement_progress_updated_at ON public.player_achievement_progress;
DROP TRIGGER IF EXISTS update_achievement_definitions_updated_at ON public.achievement_definitions;

-- Drop functions
DROP FUNCTION IF EXISTS public.update_achievement_progress_updated_at();
DROP FUNCTION IF EXISTS public.update_achievement_definition_updated_at();

-- Drop tables (order matters due to foreign keys)
DROP TABLE IF EXISTS public.player_achievements;
DROP TABLE IF EXISTS public.player_achievement_progress;
DROP TABLE IF EXISTS public.achievement_definitions;
DROP TABLE IF EXISTS public.achievement_categories;
