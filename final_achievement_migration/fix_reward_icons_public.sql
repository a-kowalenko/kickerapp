-- Migration: Fix reward definition icons (public schema)
-- The icons were not copied correctly in the original migration

SET search_path TO public;

-- Fix all reward icons
UPDATE reward_definitions SET icon = '💪' WHERE key = 'title_carry';
UPDATE reward_definitions SET icon = '⚔️' WHERE key = 'title_giant_slayer';
UPDATE reward_definitions SET icon = '🔥' WHERE key = 'title_unstoppable';
UPDATE reward_definitions SET icon = '✨' WHERE key = 'title_perfectionist';
UPDATE reward_definitions SET icon = '⚡' WHERE key = 'title_speedster';
UPDATE reward_definitions SET icon = '👑' WHERE key = 'title_comeback_king';
UPDATE reward_definitions SET icon = '🎖️' WHERE key = 'title_veteran';
UPDATE reward_definitions SET icon = '🏆' WHERE key = 'title_champion';
UPDATE reward_definitions SET icon = '🙃' WHERE key = 'title_own_goal_master';
UPDATE reward_definitions SET icon = '🐢' WHERE key = 'title_underdog';
UPDATE reward_definitions SET icon = '⚰️' WHERE key = 'title_final_nail';
UPDATE reward_definitions SET icon = '🖼️' WHERE key = 'frame_domination';
UPDATE reward_definitions SET icon = '🖼️' WHERE key = 'frame_grandmaster_1on1';
UPDATE reward_definitions SET icon = '🖼️' WHERE key = 'frame_grandmaster_2on2';
UPDATE reward_definitions SET icon = '🖼️' WHERE key = 'frame_unstoppable_1on1';
UPDATE reward_definitions SET icon = '🖼️' WHERE key = 'frame_unstoppable_2on2';
UPDATE reward_definitions SET icon = '🖼️' WHERE key = 'frame_completionist';
UPDATE reward_definitions SET icon = '🖼️' WHERE key = 'frame_point_master';
