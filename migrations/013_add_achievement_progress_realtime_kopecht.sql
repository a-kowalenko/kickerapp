-- Add player_achievement_progress table to supabase_realtime publication
-- This enables live UI updates when achievement progress changes

ALTER PUBLICATION supabase_realtime ADD TABLE kopecht.player_achievement_progress;
