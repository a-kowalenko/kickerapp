-- Fix script: Create player_history entries for already ended Season 2 of Kicker 1
-- Run this AFTER applying migration 005_create_season_end_history_public.sql
-- This script reads the end_date from the seasons table and creates the missing entries

-- Execute the function to create the missing player_history entries
SELECT public.create_season_end_history(2, 1);

-- Verify the entries were created (optional, can be removed)
-- SELECT * FROM public.player_history WHERE season_id = 2 AND kicker_id = 1 ORDER BY player_id;
