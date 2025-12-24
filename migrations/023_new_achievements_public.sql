-- New Achievements Migration (public schema)
-- Run this in Supabase SQL Editor

-- ============================================
-- SEASON ACHIEVEMENTS
-- ============================================

-- Finish on podium (top 3) in 1on1 season
INSERT INTO public.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id
) VALUES (
    'season_podium_1on1', 
    'On the Podium (1on1)', 
    'Finish a 1on1 season in the top 3',
    (SELECT id FROM public.achievement_categories WHERE key = 'season' AND kicker_id = 1),
    'SEASON_ENDED',
    '{"type": "threshold", "metric": "season_rank", "target": 3, "comparison": "lte", "filters": {"gamemode": "1on1"}}',
    200,
    1,
    false,
    false,
    1
) ON CONFLICT (key, kicker_id) DO NOTHING;

-- Finish on podium (top 3) in 2on2 season
INSERT INTO public.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id
) VALUES (
    'season_podium_2on2', 
    'On the Podium (2on2)', 
    'Finish a 2on2 season in the top 3',
    (SELECT id FROM public.achievement_categories WHERE key = 'season' AND kicker_id = 1),
    'SEASON_ENDED',
    '{"type": "threshold", "metric": "season_rank", "target": 3, "comparison": "lte", "filters": {"gamemode": "2on2"}}',
    200,
    1,
    false,
    false,
    1
) ON CONFLICT (key, kicker_id) DO NOTHING;

-- Season Champion 1on1
INSERT INTO public.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id
) VALUES (
    'season_champion_1on1', 
    'Season Champion (1on1)', 
    'Finish a 1on1 season in 1st place',
    (SELECT id FROM public.achievement_categories WHERE key = 'season' AND kicker_id = 1),
    'SEASON_ENDED',
    '{"type": "threshold", "metric": "season_rank", "target": 1, "filters": {"gamemode": "1on1"}}',
    500,
    1,
    false,
    false,
    1
) ON CONFLICT (key, kicker_id) DO NOTHING;

-- Season Champion 2on2
INSERT INTO public.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id
) VALUES (
    'season_champion_2on2', 
    'Season Champion (2on2)', 
    'Finish a 2on2 season in 1st place',
    (SELECT id FROM public.achievement_categories WHERE key = 'season' AND kicker_id = 1),
    'SEASON_ENDED',
    '{"type": "threshold", "metric": "season_rank", "target": 1, "filters": {"gamemode": "2on2"}}',
    500,
    1,
    false,
    false,
    1
) ON CONFLICT (key, kicker_id) DO NOTHING;


-- ============================================
-- PLAYTIME ACHIEVEMENTS
-- ============================================

-- Play at least 1 hour in a day
INSERT INTO public.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id
) VALUES (
    'playtime_1h_day', 
    'Dedicated Player', 
    'Play at least 1 hour in a single day',
    (SELECT id FROM public.achievement_categories WHERE key = 'playtime' AND kicker_id = 1),
    'MATCH_ENDED',
    '{"type": "threshold", "metric": "playtime_in_day", "target": 3600}',
    75,
    1,
    false,
    false,
    1
) ON CONFLICT (key, kicker_id) DO NOTHING;

-- Play at least 3 hours in a week
INSERT INTO public.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id
) VALUES (
    'playtime_3h_week', 
    'Weekly Warrior', 
    'Play at least 3 hours within a week',
    (SELECT id FROM public.achievement_categories WHERE key = 'playtime' AND kicker_id = 1),
    'MATCH_ENDED',
    '{"type": "threshold", "metric": "playtime_in_week", "target": 10800}',
    100,
    1,
    false,
    false,
    1
) ON CONFLICT (key, kicker_id) DO NOTHING;


-- ============================================
-- VICTORIES ACHIEVEMENTS
-- ============================================

-- Defeat 5 different players in 1on1
INSERT INTO public.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id
) VALUES (
    'beat_5_different_players_1on1', 
    'Variety is Key', 
    'Defeat 5 different players in 1on1 matches',
    (SELECT id FROM public.achievement_categories WHERE key = 'wins' AND kicker_id = 1),
    'MATCH_ENDED',
    '{"type": "counter", "metric": "unique_opponents_defeated", "target": 5, "filters": {"gamemode": "1on1", "result": "win"}}',
    75,
    5,
    false,
    false,
    1
) ON CONFLICT (key, kicker_id) DO NOTHING;

-- Win with 5 different teammates in 2on2
INSERT INTO public.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id
) VALUES (
    'win_5_different_teammates_2on2', 
    'Team Player', 
    'Win with 5 different teammates in 2on2 matches',
    (SELECT id FROM public.achievement_categories WHERE key = 'wins' AND kicker_id = 1),
    'MATCH_ENDED',
    '{"type": "counter", "metric": "unique_teammates_won_with", "target": 5, "filters": {"gamemode": "2on2", "result": "win"}}',
    75,
    5,
    false,
    false,
    1
) ON CONFLICT (key, kicker_id) DO NOTHING;

-- Win 5 matches in one day
INSERT INTO public.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id
) VALUES (
    'wins_5_in_day', 
    'Unstoppable Day', 
    'Win 5 matches in a single day',
    (SELECT id FROM public.achievement_categories WHERE key = 'wins' AND kicker_id = 1),
    'MATCH_ENDED',
    '{"type": "threshold", "metric": "wins_in_day", "target": 5, "filters": {"result": "win"}}',
    100,
    1,
    false,
    false,
    1
) ON CONFLICT (key, kicker_id) DO NOTHING;

-- Win a match 10-9
INSERT INTO public.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id
) VALUES (
    'win_10_9', 
    'Nail Biter', 
    'Win a match with the score 10-9',
    (SELECT id FROM public.achievement_categories WHERE key = 'wins' AND kicker_id = 1),
    'MATCH_ENDED',
    '{"type": "threshold", "metric": "close_win", "target": 1, "filters": {"result": "win", "final_score": "10-9"}}',
    75,
    1,
    false,
    false,
    1
) ON CONFLICT (key, kicker_id) DO NOTHING;


-- ============================================
-- MATCHES ACHIEVEMENTS
-- ============================================

-- Play 5 matches in one day
INSERT INTO public.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id
) VALUES (
    'matches_5_in_day', 
    'Marathon Session', 
    'Play 5 matches in a single day',
    (SELECT id FROM public.achievement_categories WHERE key = 'matches' AND kicker_id = 1),
    'MATCH_ENDED',
    '{"type": "threshold", "metric": "matches_in_day", "target": 5}',
    50,
    1,
    false,
    false,
    1
) ON CONFLICT (key, kicker_id) DO NOTHING;

-- Play 5 1on1 matches in one day
INSERT INTO public.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id
) VALUES (
    'matches_5_1on1_in_day', 
    'Solo Grinder', 
    'Play 5 1on1 matches in a single day',
    (SELECT id FROM public.achievement_categories WHERE key = 'matches' AND kicker_id = 1),
    'MATCH_ENDED',
    '{"type": "threshold", "metric": "matches_in_day", "target": 5, "filters": {"gamemode": "1on1"}}',
    50,
    1,
    false,
    false,
    1
) ON CONFLICT (key, kicker_id) DO NOTHING;

-- Play 5 2on2 matches in one day
INSERT INTO public.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id
) VALUES (
    'matches_5_2on2_in_day', 
    'Team Grinder', 
    'Play 5 2on2 matches in a single day',
    (SELECT id FROM public.achievement_categories WHERE key = 'matches' AND kicker_id = 1),
    'MATCH_ENDED',
    '{"type": "threshold", "metric": "matches_in_day", "target": 5, "filters": {"gamemode": "2on2"}}',
    50,
    1,
    false,
    false,
    1
) ON CONFLICT (key, kicker_id) DO NOTHING;

-- Play 2 1on1 and 2 2on2 in one day
INSERT INTO public.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id
) VALUES (
    'matches_mixed_day', 
    'All-Rounder', 
    'Play at least 2 1on1 and 2 2on2 matches in a single day',
    (SELECT id FROM public.achievement_categories WHERE key = 'matches' AND kicker_id = 1),
    'MATCH_ENDED',
    '{"type": "compound", "conditions": [{"metric": "matches_in_day", "target": 2, "filters": {"gamemode": "1on1"}}, {"metric": "matches_in_day", "target": 2, "filters": {"gamemode": "2on2"}}]}',
    75,
    1,
    false,
    false,
    1
) ON CONFLICT (key, kicker_id) DO NOTHING;


-- ============================================
-- STREAKS ACHIEVEMENTS (Extensions to Hot Streak)
-- ============================================

-- Win 10 in a row 1on1 (chain from win_streak_5_1on1)
INSERT INTO public.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id, parent_id
) VALUES (
    'win_streak_10_1on1', 
    'On Fire (1on1)', 
    'Win 10 matches in a row in 1on1 mode',
    (SELECT id FROM public.achievement_categories WHERE key = 'streaks' AND kicker_id = 1),
    'MATCH_ENDED',
    '{"type": "streak", "streak_condition": {"result": "win", "min_streak": 10}, "filters": {"gamemode": "1on1"}}',
    200,
    1,
    false,
    false,
    1,
    (SELECT id FROM public.achievement_definitions WHERE key = 'win_streak_5_1on1' AND kicker_id = 1)
) ON CONFLICT (key, kicker_id) DO NOTHING;

-- Win 15 in a row 1on1 (chain from win_streak_10_1on1)
INSERT INTO public.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id, parent_id
) VALUES (
    'win_streak_15_1on1', 
    'Unstoppable (1on1)', 
    'Win 15 matches in a row in 1on1 mode',
    (SELECT id FROM public.achievement_categories WHERE key = 'streaks' AND kicker_id = 1),
    'MATCH_ENDED',
    '{"type": "streak", "streak_condition": {"result": "win", "min_streak": 15}, "filters": {"gamemode": "1on1"}}',
    300,
    1,
    false,
    false,
    1,
    (SELECT id FROM public.achievement_definitions WHERE key = 'win_streak_10_1on1' AND kicker_id = 1)
) ON CONFLICT (key, kicker_id) DO NOTHING;

-- Win 10 in a row 2on2 (chain from win_streak_5_2on2)
INSERT INTO public.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id, parent_id
) VALUES (
    'win_streak_10_2on2', 
    'On Fire (2on2)', 
    'Win 10 matches in a row in 2on2 mode',
    (SELECT id FROM public.achievement_categories WHERE key = 'streaks' AND kicker_id = 1),
    'MATCH_ENDED',
    '{"type": "streak", "streak_condition": {"result": "win", "min_streak": 10}, "filters": {"gamemode": "2on2"}}',
    200,
    1,
    false,
    false,
    1,
    (SELECT id FROM public.achievement_definitions WHERE key = 'win_streak_5_2on2' AND kicker_id = 1)
) ON CONFLICT (key, kicker_id) DO NOTHING;

-- Win 15 in a row 2on2 (chain from win_streak_10_2on2)
INSERT INTO public.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id, parent_id
) VALUES (
    'win_streak_15_2on2', 
    'Unstoppable (2on2)', 
    'Win 15 matches in a row in 2on2 mode',
    (SELECT id FROM public.achievement_categories WHERE key = 'streaks' AND kicker_id = 1),
    'MATCH_ENDED',
    '{"type": "streak", "streak_condition": {"result": "win", "min_streak": 15}, "filters": {"gamemode": "2on2"}}',
    300,
    1,
    false,
    false,
    1,
    (SELECT id FROM public.achievement_definitions WHERE key = 'win_streak_10_2on2' AND kicker_id = 1)
) ON CONFLICT (key, kicker_id) DO NOTHING;

-- Beat a player on a hot streak (1on1)
INSERT INTO public.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id
) VALUES (
    'streak_breaker_1on1', 
    'Streak Breaker (1on1)', 
    'Defeat a player who has a win streak of at least 5 in 1on1',
    (SELECT id FROM public.achievement_categories WHERE key = 'streaks' AND kicker_id = 1),
    'MATCH_ENDED',
    '{"type": "threshold", "metric": "broke_opponent_streak", "target": 5, "filters": {"gamemode": "1on1", "result": "win"}}',
    100,
    1,
    false,
    false,
    1
) ON CONFLICT (key, kicker_id) DO NOTHING;

-- Beat a player on a hot streak (2on2)
INSERT INTO public.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id
) VALUES (
    'streak_breaker_2on2', 
    'Streak Breaker (2on2)', 
    'Defeat a player who has a win streak of at least 5 in 2on2',
    (SELECT id FROM public.achievement_categories WHERE key = 'streaks' AND kicker_id = 1),
    'MATCH_ENDED',
    '{"type": "threshold", "metric": "broke_opponent_streak", "target": 5, "filters": {"gamemode": "2on2", "result": "win"}}',
    100,
    1,
    false,
    false,
    1
) ON CONFLICT (key, kicker_id) DO NOTHING;


-- ============================================
-- GOALS ACHIEVEMENTS
-- ============================================

-- Score 25 goals in a day
INSERT INTO public.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id
) VALUES (
    'goals_25_in_day', 
    'Sharpshooter', 
    'Score 25 goals in a single day',
    (SELECT id FROM public.achievement_categories WHERE key = 'goals' AND kicker_id = 1),
    'GOAL_SCORED',
    '{"type": "threshold", "metric": "goals_in_day", "target": 25}',
    75,
    1,
    false,
    false,
    1
) ON CONFLICT (key, kicker_id) DO NOTHING;

-- Score 42 goals in a day (chain from 25)
INSERT INTO public.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id, parent_id
) VALUES (
    'goals_42_in_day', 
    'Goal Machine', 
    'Score 42 goals in a single day',
    (SELECT id FROM public.achievement_categories WHERE key = 'goals' AND kicker_id = 1),
    'GOAL_SCORED',
    '{"type": "threshold", "metric": "goals_in_day", "target": 42}',
    150,
    1,
    false,
    false,
    1,
    (SELECT id FROM public.achievement_definitions WHERE key = 'goals_25_in_day' AND kicker_id = 1)
) ON CONFLICT (key, kicker_id) DO NOTHING;

-- Score 50 goals in a day (chain from 42)
INSERT INTO public.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id, parent_id
) VALUES (
    'goals_50_in_day', 
    'Unstoppable Scorer', 
    'Score 50 goals in a single day',
    (SELECT id FROM public.achievement_categories WHERE key = 'goals' AND kicker_id = 1),
    'GOAL_SCORED',
    '{"type": "threshold", "metric": "goals_in_day", "target": 50}',
    250,
    1,
    false,
    false,
    1,
    (SELECT id FROM public.achievement_definitions WHERE key = 'goals_42_in_day' AND kicker_id = 1)
) ON CONFLICT (key, kicker_id) DO NOTHING;


-- ============================================
-- META ACHIEVEMENTS (Extensions to Achievement Hunter)
-- ============================================

-- Achievement Hunter 50 (chain from achievement_hunter_25)
INSERT INTO public.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id, parent_id
) VALUES (
    'achievement_hunter_50', 
    'Achievement Collector', 
    'Unlock 50 achievements',
    (SELECT id FROM public.achievement_categories WHERE key = 'meta' AND kicker_id = 1),
    'ACHIEVEMENT_UNLOCKED',
    '{"type": "counter", "metric": "achievements_unlocked", "target": 50}',
    200,
    50,
    false,
    false,
    1,
    (SELECT id FROM public.achievement_definitions WHERE key = 'achievement_hunter_25' AND kicker_id = 1)
) ON CONFLICT (key, kicker_id) DO NOTHING;

-- Update completionist to be child of achievement_hunter_50
UPDATE public.achievement_definitions 
SET parent_id = (SELECT id FROM public.achievement_definitions WHERE key = 'achievement_hunter_50' AND kicker_id = 1)
WHERE key = 'completionist' AND kicker_id = 1;

-- Unlock 3 secret achievements
INSERT INTO public.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id
) VALUES (
    'secret_finder', 
    'Secret Finder', 
    'Unlock 3 secret achievements',
    (SELECT id FROM public.achievement_categories WHERE key = 'meta' AND kicker_id = 1),
    'ACHIEVEMENT_UNLOCKED',
    '{"type": "counter", "metric": "secret_achievements_unlocked", "target": 3}',
    150,
    3,
    false,
    false,
    1
) ON CONFLICT (key, kicker_id) DO NOTHING;


-- ============================================
-- TEAMWORK ACHIEVEMENTS
-- ============================================

-- Score exactly 5 goals in a 2on2 match and win (perfect 50/50 split)
INSERT INTO public.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id
) VALUES (
    'perfect_teamwork', 
    'Perfect Teamwork', 
    'Score exactly 5 goals in a 2on2 match where you win 10-X',
    (SELECT id FROM public.achievement_categories WHERE key = 'teamwork' AND kicker_id = 1),
    'MATCH_ENDED',
    '{"type": "threshold", "metric": "goals_in_match", "target": 5, "comparison": "eq", "filters": {"gamemode": "2on2", "result": "win", "team_score": 10}}',
    100,
    1,
    false,
    false,
    1
) ON CONFLICT (key, kicker_id) DO NOTHING;

-- Score 9 goals in a 2on2 match and win
INSERT INTO public.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id
) VALUES (
    'carry_9_goals', 
    'Heavy Lifter', 
    'Score 9 goals in a 2on2 match and win 10-X',
    (SELECT id FROM public.achievement_categories WHERE key = 'teamwork' AND kicker_id = 1),
    'MATCH_ENDED',
    '{"type": "threshold", "metric": "goals_in_match", "target": 9, "comparison": "eq", "filters": {"gamemode": "2on2", "result": "win", "team_score": 10}}',
    150,
    1,
    false,
    false,
    1
) ON CONFLICT (key, kicker_id) DO NOTHING;


-- ============================================
-- HIDDEN/SECRET ACHIEVEMENTS
-- ============================================

-- Score an own goal at 9-X (1on1)
INSERT INTO public.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id
) VALUES (
    'own_goal_at_9_1on1', 
    'So Close... (1on1)', 
    'Score an own goal when you are at 9-X in a 1on1 match',
    (SELECT id FROM public.achievement_categories WHERE key = 'secret' AND kicker_id = 1),
    'GOAL_SCORED',
    '{"type": "threshold", "metric": "own_goal_at_score", "target": 9, "filters": {"gamemode": "1on1", "goal_type": "own_goal"}}',
    25,
    1,
    true,
    false,
    1
) ON CONFLICT (key, kicker_id) DO NOTHING;

-- Score an own goal at 9-X (2on2)
INSERT INTO public.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id
) VALUES (
    'own_goal_at_9_2on2', 
    'So Close... (2on2)', 
    'Score an own goal when your team is at 9-X in a 2on2 match',
    (SELECT id FROM public.achievement_categories WHERE key = 'secret' AND kicker_id = 1),
    'GOAL_SCORED',
    '{"type": "threshold", "metric": "own_goal_at_score", "target": 9, "filters": {"gamemode": "2on2", "goal_type": "own_goal"}}',
    25,
    1,
    true,
    false,
    1
) ON CONFLICT (key, kicker_id) DO NOTHING;

-- Score an own goal at 1-X (1on1)
INSERT INTO public.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id
) VALUES (
    'own_goal_at_1_1on1', 
    'Adding Insult to Injury (1on1)', 
    'Score an own goal when you are at 1-X in a 1on1 match',
    (SELECT id FROM public.achievement_categories WHERE key = 'secret' AND kicker_id = 1),
    'GOAL_SCORED',
    '{"type": "threshold", "metric": "own_goal_at_score", "target": 1, "filters": {"gamemode": "1on1", "goal_type": "own_goal"}}',
    25,
    1,
    true,
    false,
    1
) ON CONFLICT (key, kicker_id) DO NOTHING;

-- Score an own goal at 1-X (2on2)
INSERT INTO public.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id
) VALUES (
    'own_goal_at_1_2on2', 
    'Adding Insult to Injury (2on2)', 
    'Score an own goal when your team is at 1-X in a 2on2 match',
    (SELECT id FROM public.achievement_categories WHERE key = 'secret' AND kicker_id = 1),
    'GOAL_SCORED',
    '{"type": "threshold", "metric": "own_goal_at_score", "target": 1, "filters": {"gamemode": "2on2", "goal_type": "own_goal"}}',
    25,
    1,
    true,
    false,
    1
) ON CONFLICT (key, kicker_id) DO NOTHING;
