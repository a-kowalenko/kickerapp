-- Additional Achievements Migration (public schema)
-- Run this in Supabase SQL Editor

-- ============================================
-- GOALS ACHIEVEMENTS - First Blood Series
-- ============================================

-- Score 10 first goals (1-0) in 1on1
INSERT INTO public.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id
) VALUES (
    'first_blood_10_1on1', 
    'First Blood Initiate (1on1)', 
    'Score 10 opening goals (1-0) in 1on1 matches',
    (SELECT id FROM public.achievement_categories WHERE key = 'goals' AND kicker_id = 1),
    'GOAL_SCORED',
    '{"type": "counter", "metric": "first_blood_goals", "target": 10, "filters": {"gamemode": "1on1"}}',
    50,
    10,
    false,
    false,
    1
) ON CONFLICT (key, kicker_id) DO NOTHING;

-- Score 25 first goals (1-0) in 1on1 (chain from 10)
INSERT INTO public.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id, parent_id
) VALUES (
    'first_blood_25_1on1', 
    'First Blood Apprentice (1on1)', 
    'Score 25 opening goals (1-0) in 1on1 matches',
    (SELECT id FROM public.achievement_categories WHERE key = 'goals' AND kicker_id = 1),
    'GOAL_SCORED',
    '{"type": "counter", "metric": "first_blood_goals", "target": 25, "filters": {"gamemode": "1on1"}}',
    100,
    25,
    false,
    false,
    1,
    (SELECT id FROM public.achievement_definitions WHERE key = 'first_blood_10_1on1' AND kicker_id = 1)
) ON CONFLICT (key, kicker_id) DO NOTHING;

-- Score 100 first goals (1-0) in 1on1 (chain from 25)
INSERT INTO public.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id, parent_id
) VALUES (
    'first_blood_100_1on1', 
    'First Blood Expert (1on1)', 
    'Score 100 opening goals (1-0) in 1on1 matches',
    (SELECT id FROM public.achievement_categories WHERE key = 'goals' AND kicker_id = 1),
    'GOAL_SCORED',
    '{"type": "counter", "metric": "first_blood_goals", "target": 100, "filters": {"gamemode": "1on1"}}',
    200,
    100,
    false,
    false,
    1,
    (SELECT id FROM public.achievement_definitions WHERE key = 'first_blood_25_1on1' AND kicker_id = 1)
) ON CONFLICT (key, kicker_id) DO NOTHING;

-- Score 250 first goals (1-0) in 1on1 (chain from 100)
INSERT INTO public.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id, parent_id
) VALUES (
    'first_blood_250_1on1', 
    'First Blood Master (1on1)', 
    'Score 250 opening goals (1-0) in 1on1 matches',
    (SELECT id FROM public.achievement_categories WHERE key = 'goals' AND kicker_id = 1),
    'GOAL_SCORED',
    '{"type": "counter", "metric": "first_blood_goals", "target": 250, "filters": {"gamemode": "1on1"}}',
    350,
    250,
    false,
    false,
    1,
    (SELECT id FROM public.achievement_definitions WHERE key = 'first_blood_100_1on1' AND kicker_id = 1)
) ON CONFLICT (key, kicker_id) DO NOTHING;

-- Score 500 first goals (1-0) in 1on1 (chain from 250)
INSERT INTO public.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id, parent_id
) VALUES (
    'first_blood_500_1on1', 
    'First Blood Legend (1on1)', 
    'Score 500 opening goals (1-0) in 1on1 matches',
    (SELECT id FROM public.achievement_categories WHERE key = 'goals' AND kicker_id = 1),
    'GOAL_SCORED',
    '{"type": "counter", "metric": "first_blood_goals", "target": 500, "filters": {"gamemode": "1on1"}}',
    500,
    500,
    false,
    false,
    1,
    (SELECT id FROM public.achievement_definitions WHERE key = 'first_blood_250_1on1' AND kicker_id = 1)
) ON CONFLICT (key, kicker_id) DO NOTHING;

-- Score 10 first goals (1-0) in 2on2
INSERT INTO public.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id
) VALUES (
    'first_blood_10_2on2', 
    'First Blood Initiate (2on2)', 
    'Score 10 opening goals (1-0) in 2on2 matches',
    (SELECT id FROM public.achievement_categories WHERE key = 'goals' AND kicker_id = 1),
    'GOAL_SCORED',
    '{"type": "counter", "metric": "first_blood_goals", "target": 10, "filters": {"gamemode": "2on2"}}',
    50,
    10,
    false,
    false,
    1
) ON CONFLICT (key, kicker_id) DO NOTHING;

-- Score 25 first goals (1-0) in 2on2 (chain from 10)
INSERT INTO public.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id, parent_id
) VALUES (
    'first_blood_25_2on2', 
    'First Blood Apprentice (2on2)', 
    'Score 25 opening goals (1-0) in 2on2 matches',
    (SELECT id FROM public.achievement_categories WHERE key = 'goals' AND kicker_id = 1),
    'GOAL_SCORED',
    '{"type": "counter", "metric": "first_blood_goals", "target": 25, "filters": {"gamemode": "2on2"}}',
    100,
    25,
    false,
    false,
    1,
    (SELECT id FROM public.achievement_definitions WHERE key = 'first_blood_10_2on2' AND kicker_id = 1)
) ON CONFLICT (key, kicker_id) DO NOTHING;

-- Score 100 first goals (1-0) in 2on2 (chain from 25)
INSERT INTO public.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id, parent_id
) VALUES (
    'first_blood_100_2on2', 
    'First Blood Expert (2on2)', 
    'Score 100 opening goals (1-0) in 2on2 matches',
    (SELECT id FROM public.achievement_categories WHERE key = 'goals' AND kicker_id = 1),
    'GOAL_SCORED',
    '{"type": "counter", "metric": "first_blood_goals", "target": 100, "filters": {"gamemode": "2on2"}}',
    200,
    100,
    false,
    false,
    1,
    (SELECT id FROM public.achievement_definitions WHERE key = 'first_blood_25_2on2' AND kicker_id = 1)
) ON CONFLICT (key, kicker_id) DO NOTHING;

-- Score 250 first goals (1-0) in 2on2 (chain from 100)
INSERT INTO public.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id, parent_id
) VALUES (
    'first_blood_250_2on2', 
    'First Blood Master (2on2)', 
    'Score 250 opening goals (1-0) in 2on2 matches',
    (SELECT id FROM public.achievement_categories WHERE key = 'goals' AND kicker_id = 1),
    'GOAL_SCORED',
    '{"type": "counter", "metric": "first_blood_goals", "target": 250, "filters": {"gamemode": "2on2"}}',
    350,
    250,
    false,
    false,
    1,
    (SELECT id FROM public.achievement_definitions WHERE key = 'first_blood_100_2on2' AND kicker_id = 1)
) ON CONFLICT (key, kicker_id) DO NOTHING;

-- Score 500 first goals (1-0) in 2on2 (chain from 250)
INSERT INTO public.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id, parent_id
) VALUES (
    'first_blood_500_2on2', 
    'First Blood Legend (2on2)', 
    'Score 500 opening goals (1-0) in 2on2 matches',
    (SELECT id FROM public.achievement_categories WHERE key = 'goals' AND kicker_id = 1),
    'GOAL_SCORED',
    '{"type": "counter", "metric": "first_blood_goals", "target": 500, "filters": {"gamemode": "2on2"}}',
    500,
    500,
    false,
    false,
    1,
    (SELECT id FROM public.achievement_definitions WHERE key = 'first_blood_250_2on2' AND kicker_id = 1)
) ON CONFLICT (key, kicker_id) DO NOTHING;


-- ============================================
-- GOALS ACHIEVEMENTS - Own Goal Hidden
-- ============================================

-- Score an own goal at 0-0 (1on1)
INSERT INTO public.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id
) VALUES (
    'own_goal_at_0_1on1', 
    'False Start (1on1)', 
    'Score an own goal when the score is 0-0 in a 1on1 match',
    (SELECT id FROM public.achievement_categories WHERE key = 'hidden' AND kicker_id = 1),
    'GOAL_SCORED',
    '{"type": "threshold", "metric": "own_goal_at_score", "target": 0, "filters": {"gamemode": "1on1", "goal_type": "own_goal", "both_scores": 0}}',
    25,
    1,
    true,
    false,
    1
) ON CONFLICT (key, kicker_id) DO NOTHING;

-- Score an own goal at 0-0 (2on2)
INSERT INTO public.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id
) VALUES (
    'own_goal_at_0_2on2', 
    'False Start (2on2)', 
    'Score an own goal when the score is 0-0 in a 2on2 match',
    (SELECT id FROM public.achievement_categories WHERE key = 'hidden' AND kicker_id = 1),
    'GOAL_SCORED',
    '{"type": "threshold", "metric": "own_goal_at_score", "target": 0, "filters": {"gamemode": "2on2", "goal_type": "own_goal", "both_scores": 0}}',
    25,
    1,
    true,
    false,
    1
) ON CONFLICT (key, kicker_id) DO NOTHING;

-- Score 5 own goals in a day
INSERT INTO public.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id
) VALUES (
    'own_goals_5_in_day', 
    'Wrong Direction Day', 
    'Score 5 own goals in a single day',
    (SELECT id FROM public.achievement_categories WHERE key = 'hidden' AND kicker_id = 1),
    'GOAL_SCORED',
    '{"type": "counter", "metric": "own_goals_in_day", "target": 5, "filters": {"goal_type": "own_goal"}}',
    50,
    5,
    true,
    false,
    1
) ON CONFLICT (key, kicker_id) DO NOTHING;


-- ============================================
-- VICTORIES ACHIEVEMENTS - Perfect Games
-- ============================================

-- Win 5 matches 10-0
INSERT INTO public.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id
) VALUES (
    'perfect_wins_5', 
    'Flawless Victory', 
    'Win 5 matches with the score 10-0',
    (SELECT id FROM public.achievement_categories WHERE key = 'wins' AND kicker_id = 1),
    'MATCH_ENDED',
    '{"type": "counter", "metric": "perfect_wins", "target": 5, "filters": {"result": "win", "final_score": "10-0"}}',
    150,
    5,
    false,
    false,
    1
) ON CONFLICT (key, kicker_id) DO NOTHING;

-- Win 10 matches 10-0 (chain from 5)
INSERT INTO public.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id, parent_id
) VALUES (
    'perfect_wins_10', 
    'Domination Expert', 
    'Win 10 matches with the score 10-0',
    (SELECT id FROM public.achievement_categories WHERE key = 'wins' AND kicker_id = 1),
    'MATCH_ENDED',
    '{"type": "counter", "metric": "perfect_wins", "target": 10, "filters": {"result": "win", "final_score": "10-0"}}',
    300,
    10,
    false,
    false,
    1,
    (SELECT id FROM public.achievement_definitions WHERE key = 'perfect_wins_5' AND kicker_id = 1)
) ON CONFLICT (key, kicker_id) DO NOTHING;


-- ============================================
-- PLAYTIME ACHIEVEMENTS - Early Bird & Night Owl
-- ============================================

-- Play 1 match before 09:00
INSERT INTO public.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id
) VALUES (
    'early_bird_1', 
    'Early Bird', 
    'Play a match before 09:00',
    (SELECT id FROM public.achievement_categories WHERE key = 'playtime' AND kicker_id = 1),
    'MATCH_ENDED',
    '{"type": "counter", "metric": "matches_before_time", "target": 1, "filters": {"time_before": "09:00"}}',
    25,
    1,
    false,
    false,
    1
) ON CONFLICT (key, kicker_id) DO NOTHING;

-- Play 10 matches before 09:00 (chain from 1)
INSERT INTO public.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id, parent_id
) VALUES (
    'early_bird_10', 
    'Morning Enthusiast', 
    'Play 10 matches before 09:00',
    (SELECT id FROM public.achievement_categories WHERE key = 'playtime' AND kicker_id = 1),
    'MATCH_ENDED',
    '{"type": "counter", "metric": "matches_before_time", "target": 10, "filters": {"time_before": "09:00"}}',
    75,
    10,
    false,
    false,
    1,
    (SELECT id FROM public.achievement_definitions WHERE key = 'early_bird_1' AND kicker_id = 1)
) ON CONFLICT (key, kicker_id) DO NOTHING;

-- Play 25 matches before 09:00 (chain from 10)
INSERT INTO public.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id, parent_id
) VALUES (
    'early_bird_25', 
    'Dawn Champion', 
    'Play 25 matches before 09:00',
    (SELECT id FROM public.achievement_categories WHERE key = 'playtime' AND kicker_id = 1),
    'MATCH_ENDED',
    '{"type": "counter", "metric": "matches_before_time", "target": 25, "filters": {"time_before": "09:00"}}',
    150,
    25,
    false,
    false,
    1,
    (SELECT id FROM public.achievement_definitions WHERE key = 'early_bird_10' AND kicker_id = 1)
) ON CONFLICT (key, kicker_id) DO NOTHING;

-- Play 1 match after 17:00
INSERT INTO public.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id
) VALUES (
    'night_owl_1', 
    'Evening Player', 
    'Play a match after 17:00',
    (SELECT id FROM public.achievement_categories WHERE key = 'playtime' AND kicker_id = 1),
    'MATCH_ENDED',
    '{"type": "counter", "metric": "matches_after_time", "target": 1, "filters": {"time_after": "17:00"}}',
    25,
    1,
    false,
    false,
    1
) ON CONFLICT (key, kicker_id) DO NOTHING;

-- Play 10 matches after 17:00 (chain from 1)
INSERT INTO public.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id, parent_id
) VALUES (
    'night_owl_10', 
    'Night Owl', 
    'Play 10 matches after 17:00',
    (SELECT id FROM public.achievement_categories WHERE key = 'playtime' AND kicker_id = 1),
    'MATCH_ENDED',
    '{"type": "counter", "metric": "matches_after_time", "target": 10, "filters": {"time_after": "17:00"}}',
    75,
    10,
    false,
    false,
    1,
    (SELECT id FROM public.achievement_definitions WHERE key = 'night_owl_1' AND kicker_id = 1)
) ON CONFLICT (key, kicker_id) DO NOTHING;

-- Play 25 matches after 17:00 (chain from 10)
INSERT INTO public.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id, parent_id
) VALUES (
    'night_owl_25', 
    'Twilight Master', 
    'Play 25 matches after 17:00',
    (SELECT id FROM public.achievement_categories WHERE key = 'playtime' AND kicker_id = 1),
    'MATCH_ENDED',
    '{"type": "counter", "metric": "matches_after_time", "target": 25, "filters": {"time_after": "17:00"}}',
    150,
    25,
    false,
    false,
    1,
    (SELECT id FROM public.achievement_definitions WHERE key = 'night_owl_10' AND kicker_id = 1)
) ON CONFLICT (key, kicker_id) DO NOTHING;


-- ============================================
-- MATCHES ACHIEVEMENTS - After Meeting Party
-- ============================================

-- Play 10 matches on Wednesday between 15:00 and 18:00
INSERT INTO public.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id
) VALUES (
    'after_meeting_party_10', 
    'After Meeting Rookie', 
    'Play 10 matches on Wednesdays between 15:00 and 18:00',
    (SELECT id FROM public.achievement_categories WHERE key = 'matches' AND kicker_id = 1),
    'MATCH_ENDED',
    '{"type": "counter", "metric": "matches_in_time_window", "target": 10, "filters": {"day_of_week": "wednesday", "time_after": "15:00", "time_before": "18:00"}}',
    75,
    10,
    false,
    false,
    1
) ON CONFLICT (key, kicker_id) DO NOTHING;

-- Play 25 matches on Wednesday between 15:00 and 18:00 (chain from 10)
INSERT INTO public.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id, parent_id
) VALUES (
    'after_meeting_party_25', 
    'After Meeting Regular', 
    'Play 25 matches on Wednesdays between 15:00 and 18:00',
    (SELECT id FROM public.achievement_categories WHERE key = 'matches' AND kicker_id = 1),
    'MATCH_ENDED',
    '{"type": "counter", "metric": "matches_in_time_window", "target": 25, "filters": {"day_of_week": "wednesday", "time_after": "15:00", "time_before": "18:00"}}',
    150,
    25,
    false,
    false,
    1,
    (SELECT id FROM public.achievement_definitions WHERE key = 'after_meeting_party_10' AND kicker_id = 1)
) ON CONFLICT (key, kicker_id) DO NOTHING;

-- Play 50 matches on Wednesday between 15:00 and 18:00 (chain from 25)
INSERT INTO public.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id, parent_id
) VALUES (
    'after_meeting_party_50', 
    'After Meeting Legend', 
    'Play 50 matches on Wednesdays between 15:00 and 18:00',
    (SELECT id FROM public.achievement_categories WHERE key = 'matches' AND kicker_id = 1),
    'MATCH_ENDED',
    '{"type": "counter", "metric": "matches_in_time_window", "target": 50, "filters": {"day_of_week": "wednesday", "time_after": "15:00", "time_before": "18:00"}}',
    300,
    50,
    false,
    false,
    1,
    (SELECT id FROM public.achievement_definitions WHERE key = 'after_meeting_party_25' AND kicker_id = 1)
) ON CONFLICT (key, kicker_id) DO NOTHING;
