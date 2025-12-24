-- Enable Realtime for Achievement Tables (public schema)
-- Run this in Supabase SQL Editor

-- Enable realtime for player_achievement_progress
ALTER PUBLICATION supabase_realtime ADD TABLE public.player_achievement_progress;

-- Enable realtime for player_achievements
ALTER PUBLICATION supabase_realtime ADD TABLE public.player_achievements;

-- Verify realtime is enabled
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';
