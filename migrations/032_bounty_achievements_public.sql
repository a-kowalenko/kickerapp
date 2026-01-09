-- Migration: Add bounty-related achievements and secret achievements
-- Schema: public
-- Note: Bounty achievements are placed under 'streaks' category

SET search_path TO public;

-- ============================================
-- BOUNTY HUNTER ACHIEVEMENTS (under streaks category)
-- Beat players who have a bounty on their head
-- ============================================

-- Bounty Hunter I - Beat 1 player with bounty
INSERT INTO public.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable
) VALUES (
    'bounty_hunter_1', 
    'Bounty Hunter', 
    'Defeat a player with a bounty on their head', 
    (SELECT id FROM public.achievement_categories WHERE key = 'streaks'),
    'bounty_claimed',
    '{"min_count": 1}',
    10,
    1,
    false,
    false
) ON CONFLICT (key) DO NOTHING;

-- Bounty Hunter II - Beat 5 players with bounty
INSERT INTO public.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, parent_id
) VALUES (
    'bounty_hunter_5', 
    'Bounty Hunter II', 
    'Defeat 5 players with a bounty on their head', 
    (SELECT id FROM public.achievement_categories WHERE key = 'streaks'),
    'bounty_claimed',
    '{"min_count": 5}',
    25,
    5,
    false,
    false,
    (SELECT id FROM public.achievement_definitions WHERE key = 'bounty_hunter_1')
) ON CONFLICT (key) DO NOTHING;

-- Bounty Hunter III - Beat 25 players with bounty
INSERT INTO public.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, parent_id
) VALUES (
    'bounty_hunter_25', 
    'Bounty Hunter III', 
    'Defeat 25 players with a bounty on their head', 
    (SELECT id FROM public.achievement_categories WHERE key = 'streaks'),
    'bounty_claimed',
    '{"min_count": 25}',
    50,
    25,
    false,
    false,
    (SELECT id FROM public.achievement_definitions WHERE key = 'bounty_hunter_5')
) ON CONFLICT (key) DO NOTHING;

-- ============================================
-- WANTED ACHIEVEMENT
-- Become wanted (reach 3 win streak)
-- ============================================

INSERT INTO public.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable
) VALUES (
    'wanted_1', 
    'Wanted!', 
    'Reach a 3 win streak and become a target', 
    (SELECT id FROM public.achievement_categories WHERE key = 'streaks'),
    'win_streak',
    '{"min_streak": 3}',
    10,
    1,
    false,
    false
) ON CONFLICT (key) DO NOTHING;

-- ============================================
-- BOUNTY COLLECTED (cumulative)
-- Collect bounty from other players
-- ============================================

-- Collect 50 bounty total
INSERT INTO public.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable
) VALUES (
    'bounty_collected_50', 
    'Small Catch', 
    'Collect a total of 50 bounty', 
    (SELECT id FROM public.achievement_categories WHERE key = 'streaks'),
    'bounty_claimed',
    '{"cumulative_bounty": 50}',
    15,
    50,
    false,
    false
) ON CONFLICT (key) DO NOTHING;

-- Collect 100 bounty total
INSERT INTO public.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, parent_id
) VALUES (
    'bounty_collected_100', 
    'Big Catch', 
    'Collect a total of 100 bounty', 
    (SELECT id FROM public.achievement_categories WHERE key = 'streaks'),
    'bounty_claimed',
    '{"cumulative_bounty": 100}',
    30,
    100,
    false,
    false,
    (SELECT id FROM public.achievement_definitions WHERE key = 'bounty_collected_50')
) ON CONFLICT (key) DO NOTHING;

-- Collect 250 bounty total
INSERT INTO public.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, parent_id
) VALUES (
    'bounty_collected_250', 
    'Legendary Hunter', 
    'Collect a total of 250 bounty', 
    (SELECT id FROM public.achievement_categories WHERE key = 'streaks'),
    'bounty_claimed',
    '{"cumulative_bounty": 250}',
    50,
    250,
    false,
    false,
    (SELECT id FROM public.achievement_definitions WHERE key = 'bounty_collected_100')
) ON CONFLICT (key) DO NOTHING;

-- ============================================
-- BOUNTY ACCUMULATED (cumulative)
-- Track total bounty value accumulated on your head over time
-- ============================================

-- Accumulate 25 bounty total
INSERT INTO public.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable
) VALUES (
    'bounty_earned_25', 
    'Prize Winner', 
    'Accumulate a total of 25 bounty on your head', 
    (SELECT id FROM public.achievement_categories WHERE key = 'streaks'),
    'bounty_gained',
    '{"cumulative_bounty": 25}',
    10,
    25,
    false,
    false
) ON CONFLICT (key) DO NOTHING;

-- Accumulate 75 bounty total
INSERT INTO public.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, parent_id
) VALUES (
    'bounty_earned_75', 
    'Most Wanted', 
    'Accumulate a total of 75 bounty on your head', 
    (SELECT id FROM public.achievement_categories WHERE key = 'streaks'),
    'bounty_gained',
    '{"cumulative_bounty": 75}',
    25,
    75,
    false,
    false,
    (SELECT id FROM public.achievement_definitions WHERE key = 'bounty_earned_25')
) ON CONFLICT (key) DO NOTHING;

-- Accumulate 150 bounty total
INSERT INTO public.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, parent_id
) VALUES (
    'bounty_earned_150', 
    'Public Enemy', 
    'Accumulate a total of 150 bounty on your head', 
    (SELECT id FROM public.achievement_categories WHERE key = 'streaks'),
    'bounty_gained',
    '{"cumulative_bounty": 150}',
    50,
    150,
    false,
    false,
    (SELECT id FROM public.achievement_definitions WHERE key = 'bounty_earned_75')
) ON CONFLICT (key) DO NOTHING;

-- ============================================
-- SECRET ACHIEVEMENTS (is_hidden = true)
-- ============================================

-- Humiliation 1on1 - Lose 0-10
INSERT INTO public.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable
) VALUES (
    'humiliation_1on1', 
    'Totally Embarrassed', 
    'Lose a 1on1 match 0-10', 
    (SELECT id FROM public.achievement_categories WHERE key = 'secret'),
    'match_end',
    '{"gamemode": "1on1", "score_self": 0, "score_opponent": 10, "is_winner": false}',
    5,
    1,
    true,
    false
) ON CONFLICT (key) DO NOTHING;

-- Humiliation 2on2 - Lose 0-10
INSERT INTO public.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable
) VALUES (
    'humiliation_2on2', 
    'Team Embarrassment', 
    'Lose a 2on2 match 0-10', 
    (SELECT id FROM public.achievement_categories WHERE key = 'secret'),
    'match_end',
    '{"gamemode": "2on2", "score_self": 0, "score_opponent": 10, "is_winner": false}',
    5,
    1,
    true,
    false
) ON CONFLICT (key) DO NOTHING;
