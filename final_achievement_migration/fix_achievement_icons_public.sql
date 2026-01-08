-- Migration: Fix achievement category icons (public schema)
-- The icons were not copied correctly in the original migration

SET search_path TO public;

-- Fix all category icons
UPDATE achievement_categories SET icon = '⚽' WHERE key = 'goals';
UPDATE achievement_categories SET icon = '⚡' WHERE key = 'speed';
UPDATE achievement_categories SET icon = '🎮' WHERE key = 'matches';
UPDATE achievement_categories SET icon = '🏆' WHERE key = 'wins';
UPDATE achievement_categories SET icon = '📈' WHERE key = 'skill';
UPDATE achievement_categories SET icon = '🔥' WHERE key = 'comeback';
UPDATE achievement_categories SET icon = '⏱️' WHERE key = 'playtime';
UPDATE achievement_categories SET icon = '🤝' WHERE key = 'teamwork';
UPDATE achievement_categories SET icon = '🔗' WHERE key = 'streaks';
UPDATE achievement_categories SET icon = '🏅' WHERE key = 'season';
UPDATE achievement_categories SET icon = '🎯' WHERE key = 'meta';
UPDATE achievement_categories SET icon = '🔮' WHERE key = 'secret';
