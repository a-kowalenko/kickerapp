-- Remove player_achievement_progress table from supabase_realtime publication

ALTER PUBLICATION supabase_realtime DROP TABLE player_achievement_progress;
