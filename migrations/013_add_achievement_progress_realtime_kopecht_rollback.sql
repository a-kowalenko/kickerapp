-- Remove player_achievement_progress table from supabase_realtime publication

ALTER PUBLICATION supabase_realtime DROP TABLE kopecht.player_achievement_progress;
