-- Comprehensive Achievement System Migration (kopecht schema)
-- Run this in Supabase SQL Editor

-- ============================================
-- CATEGORIES
-- ============================================

-- Speed Category (for time-based achievements)
INSERT INTO kopecht.achievement_categories (key, name, description, icon, sort_order, kicker_id)
VALUES ('speed', 'Speed', 'Achievements for fast plays', '⚡', 2, 1)
ON CONFLICT (key, kicker_id) DO NOTHING;

-- Matches Category (for match count achievements)
INSERT INTO kopecht.achievement_categories (key, name, description, icon, sort_order, kicker_id)
VALUES ('matches', 'Matches', 'Achievements for playing matches', '🎮', 3, 1)
ON CONFLICT (key, kicker_id) DO NOTHING;

-- Wins Category (for winning achievements)
INSERT INTO kopecht.achievement_categories (key, name, description, icon, sort_order, kicker_id)
VALUES ('wins', 'Victories', 'Achievements for winning matches', '🏆', 4, 1)
ON CONFLICT (key, kicker_id) DO NOTHING;

-- Skill Category (for skill-based achievements like MMR)
INSERT INTO kopecht.achievement_categories (key, name, description, icon, sort_order, kicker_id)
VALUES ('skill', 'Skill', 'Achievements for skill milestones', '📈', 5, 1)
ON CONFLICT (key, kicker_id) DO NOTHING;

-- Comeback Category (for comeback achievements)
INSERT INTO kopecht.achievement_categories (key, name, description, icon, sort_order, kicker_id)
VALUES ('comeback', 'Comebacks', 'Achievements for epic comebacks', '🔥', 6, 1)
ON CONFLICT (key, kicker_id) DO NOTHING;

-- Playtime Category (for time played achievements)
INSERT INTO kopecht.achievement_categories (key, name, description, icon, sort_order, kicker_id)
VALUES ('playtime', 'Playtime', 'Achievements for time played', '⏱️', 7, 1)
ON CONFLICT (key, kicker_id) DO NOTHING;

-- Teamwork Category (for 2on2 specific achievements)
INSERT INTO kopecht.achievement_categories (key, name, description, icon, sort_order, kicker_id)
VALUES ('teamwork', 'Teamwork', 'Achievements for team play', '🤝', 8, 1)
ON CONFLICT (key, kicker_id) DO NOTHING;

-- Streaks Category (for streak achievements)
INSERT INTO kopecht.achievement_categories (key, name, description, icon, sort_order, kicker_id)
VALUES ('streaks', 'Streaks', 'Achievements for win/loss streaks', '🔗', 9, 1)
ON CONFLICT (key, kicker_id) DO NOTHING;

-- Season Category (for season achievements)
INSERT INTO kopecht.achievement_categories (key, name, description, icon, sort_order, kicker_id)
VALUES ('season', 'Season', 'Seasonal achievements', '🏅', 10, 1)
ON CONFLICT (key, kicker_id) DO NOTHING;

-- Meta Category (for meta achievements)
INSERT INTO kopecht.achievement_categories (key, name, description, icon, sort_order, kicker_id)
VALUES ('meta', 'Meta', 'Achievements about achievements', '🎯', 11, 1)
ON CONFLICT (key, kicker_id) DO NOTHING;

-- Hidden Category (for hidden/joke achievements)
INSERT INTO kopecht.achievement_categories (key, name, description, icon, sort_order, kicker_id)
VALUES ('hidden', 'Hidden', 'Secret achievements', '🔮', 99, 1)
ON CONFLICT (key, kicker_id) DO NOTHING;


-- ============================================
-- SPEED ACHIEVEMENTS (1on1 and 2on2)
-- ============================================

-- Quick Start 1on1 - Score in first 10 seconds
INSERT INTO kopecht.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id
) VALUES (
    'quick_start_1on1', 
    'Quick Start (1on1)', 
    'Score a goal in the first 10 seconds of a 1on1 match',
    (SELECT id FROM kopecht.achievement_categories WHERE key = 'speed' AND kicker_id = 1),
    'GOAL_SCORED',
    '{"type": "threshold", "metric": "early_goal", "target": 10, "filters": {"gamemode": "1on1"}}',
    50,
    1,
    false,
    false,
    1
) ON CONFLICT (key, kicker_id) DO NOTHING;

-- Quick Start 2on2
INSERT INTO kopecht.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id
) VALUES (
    'quick_start_2on2', 
    'Quick Start (2on2)', 
    'Score a goal in the first 10 seconds of a 2on2 match',
    (SELECT id FROM kopecht.achievement_categories WHERE key = 'speed' AND kicker_id = 1),
    'GOAL_SCORED',
    '{"type": "threshold", "metric": "early_goal", "target": 10, "filters": {"gamemode": "2on2"}}',
    50,
    1,
    false,
    false,
    1
) ON CONFLICT (key, kicker_id) DO NOTHING;

-- Hat Trick Speed 1on1 - 3 goals in 60 seconds
INSERT INTO kopecht.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id
) VALUES (
    'hat_trick_speed_1on1', 
    'Speed Demon (1on1)', 
    'Score 3 goals within 60 seconds in a 1on1 match',
    (SELECT id FROM kopecht.achievement_categories WHERE key = 'speed' AND kicker_id = 1),
    'GOAL_SCORED',
    '{"type": "threshold", "metric": "goals_in_timeframe", "target": 3, "timeframe_seconds": 60, "filters": {"gamemode": "1on1"}}',
    100,
    1,
    false,
    false,
    1
) ON CONFLICT (key, kicker_id) DO NOTHING;

-- Hat Trick Speed 2on2
INSERT INTO kopecht.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id
) VALUES (
    'hat_trick_speed_2on2', 
    'Speed Demon (2on2)', 
    'Score 3 goals within 60 seconds in a 2on2 match',
    (SELECT id FROM kopecht.achievement_categories WHERE key = 'speed' AND kicker_id = 1),
    'GOAL_SCORED',
    '{"type": "threshold", "metric": "goals_in_timeframe", "target": 3, "timeframe_seconds": 60, "filters": {"gamemode": "2on2"}}',
    100,
    1,
    false,
    false,
    1
) ON CONFLICT (key, kicker_id) DO NOTHING;

-- Blitz Victory 1on1 - Win under 4 minutes
INSERT INTO kopecht.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id
) VALUES (
    'blitzkrieg_1on1', 
    'Blitzkrieg (1on1)', 
    'Win a 1on1 match in under 4 minutes',
    (SELECT id FROM kopecht.achievement_categories WHERE key = 'speed' AND kicker_id = 1),
    'MATCH_ENDED',
    '{"type": "threshold", "metric": "fast_win", "target": 240, "filters": {"gamemode": "1on1", "result": "win"}}',
    75,
    1,
    false,
    false,
    1
) ON CONFLICT (key, kicker_id) DO NOTHING;

-- Blitz Victory 2on2
INSERT INTO kopecht.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id
) VALUES (
    'blitzkrieg_2on2', 
    'Blitzkrieg (2on2)', 
    'Win a 2on2 match in under 4 minutes',
    (SELECT id FROM kopecht.achievement_categories WHERE key = 'speed' AND kicker_id = 1),
    'MATCH_ENDED',
    '{"type": "threshold", "metric": "fast_win", "target": 240, "filters": {"gamemode": "2on2", "result": "win"}}',
    75,
    1,
    false,
    false,
    1
) ON CONFLICT (key, kicker_id) DO NOTHING;


-- ============================================
-- MATCHES PLAYED ACHIEVEMENTS (1on1)
-- ============================================

-- Matches 1on1 Chain: 10 -> 50 -> 100 -> 250 -> 500 -> 1000
INSERT INTO kopecht.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id
) VALUES (
    'matches_1on1_10', 
    'Getting Started (1on1)', 
    'Play 10 matches in 1on1 mode',
    (SELECT id FROM kopecht.achievement_categories WHERE key = 'matches' AND kicker_id = 1),
    'MATCH_ENDED',
    '{"type": "counter", "metric": "matches", "target": 10, "filters": {"gamemode": "1on1"}}',
    25,
    10,
    false,
    false,
    1
) ON CONFLICT (key, kicker_id) DO NOTHING;

INSERT INTO kopecht.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id, parent_id
) VALUES (
    'matches_1on1_50', 
    'Regular Player (1on1)', 
    'Play 50 matches in 1on1 mode',
    (SELECT id FROM kopecht.achievement_categories WHERE key = 'matches' AND kicker_id = 1),
    'MATCH_ENDED',
    '{"type": "counter", "metric": "matches", "target": 50, "filters": {"gamemode": "1on1"}}',
    50,
    50,
    false,
    false,
    1,
    (SELECT id FROM kopecht.achievement_definitions WHERE key = 'matches_1on1_10' AND kicker_id = 1)
) ON CONFLICT (key, kicker_id) DO NOTHING;

INSERT INTO kopecht.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id, parent_id
) VALUES (
    'matches_1on1_100', 
    'Centurion (1on1)', 
    'Play 100 matches in 1on1 mode',
    (SELECT id FROM kopecht.achievement_categories WHERE key = 'matches' AND kicker_id = 1),
    'MATCH_ENDED',
    '{"type": "counter", "metric": "matches", "target": 100, "filters": {"gamemode": "1on1"}}',
    100,
    100,
    false,
    false,
    1,
    (SELECT id FROM kopecht.achievement_definitions WHERE key = 'matches_1on1_50' AND kicker_id = 1)
) ON CONFLICT (key, kicker_id) DO NOTHING;

INSERT INTO kopecht.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id, parent_id
) VALUES (
    'matches_1on1_250', 
    'Veteran (1on1)', 
    'Play 250 matches in 1on1 mode',
    (SELECT id FROM kopecht.achievement_categories WHERE key = 'matches' AND kicker_id = 1),
    'MATCH_ENDED',
    '{"type": "counter", "metric": "matches", "target": 250, "filters": {"gamemode": "1on1"}}',
    200,
    250,
    false,
    false,
    1,
    (SELECT id FROM kopecht.achievement_definitions WHERE key = 'matches_1on1_100' AND kicker_id = 1)
) ON CONFLICT (key, kicker_id) DO NOTHING;

INSERT INTO kopecht.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id, parent_id
) VALUES (
    'matches_1on1_500', 
    'Dedicated (1on1)', 
    'Play 500 matches in 1on1 mode',
    (SELECT id FROM kopecht.achievement_categories WHERE key = 'matches' AND kicker_id = 1),
    'MATCH_ENDED',
    '{"type": "counter", "metric": "matches", "target": 500, "filters": {"gamemode": "1on1"}}',
    400,
    500,
    false,
    false,
    1,
    (SELECT id FROM kopecht.achievement_definitions WHERE key = 'matches_1on1_250' AND kicker_id = 1)
) ON CONFLICT (key, kicker_id) DO NOTHING;

INSERT INTO kopecht.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id, parent_id
) VALUES (
    'matches_1on1_1000', 
    'Legend (1on1)', 
    'Play 1000 matches in 1on1 mode',
    (SELECT id FROM kopecht.achievement_categories WHERE key = 'matches' AND kicker_id = 1),
    'MATCH_ENDED',
    '{"type": "counter", "metric": "matches", "target": 1000, "filters": {"gamemode": "1on1"}}',
    1000,
    1000,
    false,
    false,
    1,
    (SELECT id FROM kopecht.achievement_definitions WHERE key = 'matches_1on1_500' AND kicker_id = 1)
) ON CONFLICT (key, kicker_id) DO NOTHING;


-- ============================================
-- MATCHES PLAYED ACHIEVEMENTS (2on2)
-- ============================================

INSERT INTO kopecht.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id
) VALUES (
    'matches_2on2_10', 
    'Getting Started (2on2)', 
    'Play 10 matches in 2on2 mode',
    (SELECT id FROM kopecht.achievement_categories WHERE key = 'matches' AND kicker_id = 1),
    'MATCH_ENDED',
    '{"type": "counter", "metric": "matches", "target": 10, "filters": {"gamemode": "2on2"}}',
    25,
    10,
    false,
    false,
    1
) ON CONFLICT (key, kicker_id) DO NOTHING;

INSERT INTO kopecht.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id, parent_id
) VALUES (
    'matches_2on2_50', 
    'Regular Player (2on2)', 
    'Play 50 matches in 2on2 mode',
    (SELECT id FROM kopecht.achievement_categories WHERE key = 'matches' AND kicker_id = 1),
    'MATCH_ENDED',
    '{"type": "counter", "metric": "matches", "target": 50, "filters": {"gamemode": "2on2"}}',
    50,
    50,
    false,
    false,
    1,
    (SELECT id FROM kopecht.achievement_definitions WHERE key = 'matches_2on2_10' AND kicker_id = 1)
) ON CONFLICT (key, kicker_id) DO NOTHING;

INSERT INTO kopecht.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id, parent_id
) VALUES (
    'matches_2on2_100', 
    'Centurion (2on2)', 
    'Play 100 matches in 2on2 mode',
    (SELECT id FROM kopecht.achievement_categories WHERE key = 'matches' AND kicker_id = 1),
    'MATCH_ENDED',
    '{"type": "counter", "metric": "matches", "target": 100, "filters": {"gamemode": "2on2"}}',
    100,
    100,
    false,
    false,
    1,
    (SELECT id FROM kopecht.achievement_definitions WHERE key = 'matches_2on2_50' AND kicker_id = 1)
) ON CONFLICT (key, kicker_id) DO NOTHING;

INSERT INTO kopecht.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id, parent_id
) VALUES (
    'matches_2on2_250', 
    'Veteran (2on2)', 
    'Play 250 matches in 2on2 mode',
    (SELECT id FROM kopecht.achievement_categories WHERE key = 'matches' AND kicker_id = 1),
    'MATCH_ENDED',
    '{"type": "counter", "metric": "matches", "target": 250, "filters": {"gamemode": "2on2"}}',
    200,
    250,
    false,
    false,
    1,
    (SELECT id FROM kopecht.achievement_definitions WHERE key = 'matches_2on2_100' AND kicker_id = 1)
) ON CONFLICT (key, kicker_id) DO NOTHING;

INSERT INTO kopecht.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id, parent_id
) VALUES (
    'matches_2on2_500', 
    'Dedicated (2on2)', 
    'Play 500 matches in 2on2 mode',
    (SELECT id FROM kopecht.achievement_categories WHERE key = 'matches' AND kicker_id = 1),
    'MATCH_ENDED',
    '{"type": "counter", "metric": "matches", "target": 500, "filters": {"gamemode": "2on2"}}',
    400,
    500,
    false,
    false,
    1,
    (SELECT id FROM kopecht.achievement_definitions WHERE key = 'matches_2on2_250' AND kicker_id = 1)
) ON CONFLICT (key, kicker_id) DO NOTHING;

INSERT INTO kopecht.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id, parent_id
) VALUES (
    'matches_2on2_1000', 
    'Legend (2on2)', 
    'Play 1000 matches in 2on2 mode',
    (SELECT id FROM kopecht.achievement_categories WHERE key = 'matches' AND kicker_id = 1),
    'MATCH_ENDED',
    '{"type": "counter", "metric": "matches", "target": 1000, "filters": {"gamemode": "2on2"}}',
    1000,
    1000,
    false,
    false,
    1,
    (SELECT id FROM kopecht.achievement_definitions WHERE key = 'matches_2on2_500' AND kicker_id = 1)
) ON CONFLICT (key, kicker_id) DO NOTHING;


-- ============================================
-- WINS ACHIEVEMENTS (1on1)
-- ============================================

INSERT INTO kopecht.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id
) VALUES (
    'wins_1on1_10', 
    'First Victories (1on1)', 
    'Win 10 matches in 1on1 mode',
    (SELECT id FROM kopecht.achievement_categories WHERE key = 'wins' AND kicker_id = 1),
    'MATCH_ENDED',
    '{"type": "counter", "metric": "wins", "target": 10, "filters": {"gamemode": "1on1", "result": "win"}}',
    25,
    10,
    false,
    false,
    1
) ON CONFLICT (key, kicker_id) DO NOTHING;

INSERT INTO kopecht.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id, parent_id
) VALUES (
    'wins_1on1_25', 
    'Rising Star (1on1)', 
    'Win 25 matches in 1on1 mode',
    (SELECT id FROM kopecht.achievement_categories WHERE key = 'wins' AND kicker_id = 1),
    'MATCH_ENDED',
    '{"type": "counter", "metric": "wins", "target": 25, "filters": {"gamemode": "1on1", "result": "win"}}',
    50,
    25,
    false,
    false,
    1,
    (SELECT id FROM kopecht.achievement_definitions WHERE key = 'wins_1on1_10' AND kicker_id = 1)
) ON CONFLICT (key, kicker_id) DO NOTHING;

INSERT INTO kopecht.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id, parent_id
) VALUES (
    'wins_1on1_50', 
    'Winner (1on1)', 
    'Win 50 matches in 1on1 mode',
    (SELECT id FROM kopecht.achievement_categories WHERE key = 'wins' AND kicker_id = 1),
    'MATCH_ENDED',
    '{"type": "counter", "metric": "wins", "target": 50, "filters": {"gamemode": "1on1", "result": "win"}}',
    75,
    50,
    false,
    false,
    1,
    (SELECT id FROM kopecht.achievement_definitions WHERE key = 'wins_1on1_25' AND kicker_id = 1)
) ON CONFLICT (key, kicker_id) DO NOTHING;

INSERT INTO kopecht.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id, parent_id
) VALUES (
    'wins_1on1_100', 
    'Champion (1on1)', 
    'Win 100 matches in 1on1 mode',
    (SELECT id FROM kopecht.achievement_categories WHERE key = 'wins' AND kicker_id = 1),
    'MATCH_ENDED',
    '{"type": "counter", "metric": "wins", "target": 100, "filters": {"gamemode": "1on1", "result": "win"}}',
    150,
    100,
    false,
    false,
    1,
    (SELECT id FROM kopecht.achievement_definitions WHERE key = 'wins_1on1_50' AND kicker_id = 1)
) ON CONFLICT (key, kicker_id) DO NOTHING;

INSERT INTO kopecht.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id, parent_id
) VALUES (
    'wins_1on1_250', 
    'Dominator (1on1)', 
    'Win 250 matches in 1on1 mode',
    (SELECT id FROM kopecht.achievement_categories WHERE key = 'wins' AND kicker_id = 1),
    'MATCH_ENDED',
    '{"type": "counter", "metric": "wins", "target": 250, "filters": {"gamemode": "1on1", "result": "win"}}',
    300,
    250,
    false,
    false,
    1,
    (SELECT id FROM kopecht.achievement_definitions WHERE key = 'wins_1on1_100' AND kicker_id = 1)
) ON CONFLICT (key, kicker_id) DO NOTHING;

INSERT INTO kopecht.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id, parent_id
) VALUES (
    'wins_1on1_500', 
    'Master (1on1)', 
    'Win 500 matches in 1on1 mode',
    (SELECT id FROM kopecht.achievement_categories WHERE key = 'wins' AND kicker_id = 1),
    'MATCH_ENDED',
    '{"type": "counter", "metric": "wins", "target": 500, "filters": {"gamemode": "1on1", "result": "win"}}',
    500,
    500,
    false,
    false,
    1,
    (SELECT id FROM kopecht.achievement_definitions WHERE key = 'wins_1on1_250' AND kicker_id = 1)
) ON CONFLICT (key, kicker_id) DO NOTHING;

INSERT INTO kopecht.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id, parent_id
) VALUES (
    'wins_1on1_1000', 
    'Unstoppable (1on1)', 
    'Win 1000 matches in 1on1 mode',
    (SELECT id FROM kopecht.achievement_categories WHERE key = 'wins' AND kicker_id = 1),
    'MATCH_ENDED',
    '{"type": "counter", "metric": "wins", "target": 1000, "filters": {"gamemode": "1on1", "result": "win"}}',
    1500,
    1000,
    false,
    false,
    1,
    (SELECT id FROM kopecht.achievement_definitions WHERE key = 'wins_1on1_500' AND kicker_id = 1)
) ON CONFLICT (key, kicker_id) DO NOTHING;


-- ============================================
-- WINS ACHIEVEMENTS (2on2)
-- ============================================

INSERT INTO kopecht.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id
) VALUES (
    'wins_2on2_10', 
    'First Victories (2on2)', 
    'Win 10 matches in 2on2 mode',
    (SELECT id FROM kopecht.achievement_categories WHERE key = 'wins' AND kicker_id = 1),
    'MATCH_ENDED',
    '{"type": "counter", "metric": "wins", "target": 10, "filters": {"gamemode": "2on2", "result": "win"}}',
    25,
    10,
    false,
    false,
    1
) ON CONFLICT (key, kicker_id) DO NOTHING;

INSERT INTO kopecht.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id, parent_id
) VALUES (
    'wins_2on2_25', 
    'Rising Star (2on2)', 
    'Win 25 matches in 2on2 mode',
    (SELECT id FROM kopecht.achievement_categories WHERE key = 'wins' AND kicker_id = 1),
    'MATCH_ENDED',
    '{"type": "counter", "metric": "wins", "target": 25, "filters": {"gamemode": "2on2", "result": "win"}}',
    50,
    25,
    false,
    false,
    1,
    (SELECT id FROM kopecht.achievement_definitions WHERE key = 'wins_2on2_10' AND kicker_id = 1)
) ON CONFLICT (key, kicker_id) DO NOTHING;

INSERT INTO kopecht.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id, parent_id
) VALUES (
    'wins_2on2_50', 
    'Winner (2on2)', 
    'Win 50 matches in 2on2 mode',
    (SELECT id FROM kopecht.achievement_categories WHERE key = 'wins' AND kicker_id = 1),
    'MATCH_ENDED',
    '{"type": "counter", "metric": "wins", "target": 50, "filters": {"gamemode": "2on2", "result": "win"}}',
    75,
    50,
    false,
    false,
    1,
    (SELECT id FROM kopecht.achievement_definitions WHERE key = 'wins_2on2_25' AND kicker_id = 1)
) ON CONFLICT (key, kicker_id) DO NOTHING;

INSERT INTO kopecht.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id, parent_id
) VALUES (
    'wins_2on2_100', 
    'Champion (2on2)', 
    'Win 100 matches in 2on2 mode',
    (SELECT id FROM kopecht.achievement_categories WHERE key = 'wins' AND kicker_id = 1),
    'MATCH_ENDED',
    '{"type": "counter", "metric": "wins", "target": 100, "filters": {"gamemode": "2on2", "result": "win"}}',
    150,
    100,
    false,
    false,
    1,
    (SELECT id FROM kopecht.achievement_definitions WHERE key = 'wins_2on2_50' AND kicker_id = 1)
) ON CONFLICT (key, kicker_id) DO NOTHING;

INSERT INTO kopecht.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id, parent_id
) VALUES (
    'wins_2on2_250', 
    'Dominator (2on2)', 
    'Win 250 matches in 2on2 mode',
    (SELECT id FROM kopecht.achievement_categories WHERE key = 'wins' AND kicker_id = 1),
    'MATCH_ENDED',
    '{"type": "counter", "metric": "wins", "target": 250, "filters": {"gamemode": "2on2", "result": "win"}}',
    300,
    250,
    false,
    false,
    1,
    (SELECT id FROM kopecht.achievement_definitions WHERE key = 'wins_2on2_100' AND kicker_id = 1)
) ON CONFLICT (key, kicker_id) DO NOTHING;

INSERT INTO kopecht.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id, parent_id
) VALUES (
    'wins_2on2_500', 
    'Master (2on2)', 
    'Win 500 matches in 2on2 mode',
    (SELECT id FROM kopecht.achievement_categories WHERE key = 'wins' AND kicker_id = 1),
    'MATCH_ENDED',
    '{"type": "counter", "metric": "wins", "target": 500, "filters": {"gamemode": "2on2", "result": "win"}}',
    500,
    500,
    false,
    false,
    1,
    (SELECT id FROM kopecht.achievement_definitions WHERE key = 'wins_2on2_250' AND kicker_id = 1)
) ON CONFLICT (key, kicker_id) DO NOTHING;

INSERT INTO kopecht.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id, parent_id
) VALUES (
    'wins_2on2_1000', 
    'Unstoppable (2on2)', 
    'Win 1000 matches in 2on2 mode',
    (SELECT id FROM kopecht.achievement_categories WHERE key = 'wins' AND kicker_id = 1),
    'MATCH_ENDED',
    '{"type": "counter", "metric": "wins", "target": 1000, "filters": {"gamemode": "2on2", "result": "win"}}',
    1500,
    1000,
    false,
    false,
    1,
    (SELECT id FROM kopecht.achievement_definitions WHERE key = 'wins_2on2_500' AND kicker_id = 1)
) ON CONFLICT (key, kicker_id) DO NOTHING;


-- ============================================
-- PERFECT WIN (10:0)
-- ============================================

INSERT INTO kopecht.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id
) VALUES (
    'perfect_win_1on1', 
    'Flawless Victory (1on1)', 
    'Win a 1on1 match 10:0',
    (SELECT id FROM kopecht.achievement_categories WHERE key = 'wins' AND kicker_id = 1),
    'MATCH_ENDED',
    '{"type": "threshold", "metric": "perfect_win", "filters": {"gamemode": "1on1", "result": "win", "score_diff": {"min": 10}}}',
    100,
    1,
    false,
    false,
    1
) ON CONFLICT (key, kicker_id) DO NOTHING;

INSERT INTO kopecht.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id
) VALUES (
    'perfect_win_2on2', 
    'Flawless Victory (2on2)', 
    'Win a 2on2 match 10:0',
    (SELECT id FROM kopecht.achievement_categories WHERE key = 'wins' AND kicker_id = 1),
    'MATCH_ENDED',
    '{"type": "threshold", "metric": "perfect_win", "filters": {"gamemode": "2on2", "result": "win", "score_diff": {"min": 10}}}',
    100,
    1,
    false,
    false,
    1
) ON CONFLICT (key, kicker_id) DO NOTHING;


-- ============================================
-- WIN STREAKS
-- ============================================

INSERT INTO kopecht.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id
) VALUES (
    'win_streak_5_1on1', 
    'Hot Streak (1on1)', 
    'Win 5 matches in a row in 1on1 mode',
    (SELECT id FROM kopecht.achievement_categories WHERE key = 'streaks' AND kicker_id = 1),
    'MATCH_ENDED',
    '{"type": "streak", "streak_condition": {"result": "win", "min_streak": 5}, "filters": {"gamemode": "1on1"}}',
    100,
    1,
    false,
    false,
    1
) ON CONFLICT (key, kicker_id) DO NOTHING;

INSERT INTO kopecht.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id
) VALUES (
    'win_streak_5_2on2', 
    'Hot Streak (2on2)', 
    'Win 5 matches in a row in 2on2 mode',
    (SELECT id FROM kopecht.achievement_categories WHERE key = 'streaks' AND kicker_id = 1),
    'MATCH_ENDED',
    '{"type": "streak", "streak_condition": {"result": "win", "min_streak": 5}, "filters": {"gamemode": "2on2"}}',
    100,
    1,
    false,
    false,
    1
) ON CONFLICT (key, kicker_id) DO NOTHING;


-- ============================================
-- COMEBACK ACHIEVEMENTS
-- ============================================

INSERT INTO kopecht.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id
) VALUES (
    'comeback_5_1on1', 
    'Never Give Up (1on1)', 
    'Win a 1on1 match after being down 0:5',
    (SELECT id FROM kopecht.achievement_categories WHERE key = 'comeback' AND kicker_id = 1),
    'MATCH_ENDED',
    '{"type": "threshold", "metric": "comeback", "target": 5, "filters": {"gamemode": "1on1", "result": "win"}}',
    150,
    1,
    false,
    false,
    1
) ON CONFLICT (key, kicker_id) DO NOTHING;

INSERT INTO kopecht.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id
) VALUES (
    'comeback_5_2on2', 
    'Never Give Up (2on2)', 
    'Win a 2on2 match after being down 0:5',
    (SELECT id FROM kopecht.achievement_categories WHERE key = 'comeback' AND kicker_id = 1),
    'MATCH_ENDED',
    '{"type": "threshold", "metric": "comeback", "target": 5, "filters": {"gamemode": "2on2", "result": "win"}}',
    150,
    1,
    false,
    false,
    1
) ON CONFLICT (key, kicker_id) DO NOTHING;


-- ============================================
-- MMR ACHIEVEMENTS (1on1)
-- ============================================

INSERT INTO kopecht.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id
) VALUES (
    'mmr_1on1_1200', 
    'Rising Talent (1on1)', 
    'Reach 1200 MMR in 1on1 mode',
    (SELECT id FROM kopecht.achievement_categories WHERE key = 'skill' AND kicker_id = 1),
    'MATCH_ENDED',
    '{"type": "threshold", "metric": "mmr", "target": 1200, "filters": {"gamemode": "1on1"}}',
    50,
    1,
    false,
    false,
    1
) ON CONFLICT (key, kicker_id) DO NOTHING;

INSERT INTO kopecht.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id, parent_id
) VALUES (
    'mmr_1on1_1300', 
    'Skilled Player (1on1)', 
    'Reach 1300 MMR in 1on1 mode',
    (SELECT id FROM kopecht.achievement_categories WHERE key = 'skill' AND kicker_id = 1),
    'MATCH_ENDED',
    '{"type": "threshold", "metric": "mmr", "target": 1300, "filters": {"gamemode": "1on1"}}',
    100,
    1,
    false,
    false,
    1,
    (SELECT id FROM kopecht.achievement_definitions WHERE key = 'mmr_1on1_1200' AND kicker_id = 1)
) ON CONFLICT (key, kicker_id) DO NOTHING;

INSERT INTO kopecht.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id, parent_id
) VALUES (
    'mmr_1on1_1500', 
    'Expert (1on1)', 
    'Reach 1500 MMR in 1on1 mode',
    (SELECT id FROM kopecht.achievement_categories WHERE key = 'skill' AND kicker_id = 1),
    'MATCH_ENDED',
    '{"type": "threshold", "metric": "mmr", "target": 1500, "filters": {"gamemode": "1on1"}}',
    200,
    1,
    false,
    false,
    1,
    (SELECT id FROM kopecht.achievement_definitions WHERE key = 'mmr_1on1_1300' AND kicker_id = 1)
) ON CONFLICT (key, kicker_id) DO NOTHING;

INSERT INTO kopecht.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id, parent_id
) VALUES (
    'mmr_1on1_1750', 
    'Elite (1on1)', 
    'Reach 1750 MMR in 1on1 mode',
    (SELECT id FROM kopecht.achievement_categories WHERE key = 'skill' AND kicker_id = 1),
    'MATCH_ENDED',
    '{"type": "threshold", "metric": "mmr", "target": 1750, "filters": {"gamemode": "1on1"}}',
    400,
    1,
    false,
    false,
    1,
    (SELECT id FROM kopecht.achievement_definitions WHERE key = 'mmr_1on1_1500' AND kicker_id = 1)
) ON CONFLICT (key, kicker_id) DO NOTHING;

INSERT INTO kopecht.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id, parent_id
) VALUES (
    'mmr_1on1_2000', 
    'Grandmaster (1on1)', 
    'Reach 2000 MMR in 1on1 mode',
    (SELECT id FROM kopecht.achievement_categories WHERE key = 'skill' AND kicker_id = 1),
    'MATCH_ENDED',
    '{"type": "threshold", "metric": "mmr", "target": 2000, "filters": {"gamemode": "1on1"}}',
    1000,
    1,
    false,
    false,
    1,
    (SELECT id FROM kopecht.achievement_definitions WHERE key = 'mmr_1on1_1750' AND kicker_id = 1)
) ON CONFLICT (key, kicker_id) DO NOTHING;


-- ============================================
-- MMR ACHIEVEMENTS (2on2)
-- ============================================

INSERT INTO kopecht.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id
) VALUES (
    'mmr_2on2_1200', 
    'Rising Talent (2on2)', 
    'Reach 1200 MMR in 2on2 mode',
    (SELECT id FROM kopecht.achievement_categories WHERE key = 'skill' AND kicker_id = 1),
    'MATCH_ENDED',
    '{"type": "threshold", "metric": "mmr", "target": 1200, "filters": {"gamemode": "2on2"}}',
    50,
    1,
    false,
    false,
    1
) ON CONFLICT (key, kicker_id) DO NOTHING;

INSERT INTO kopecht.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id, parent_id
) VALUES (
    'mmr_2on2_1300', 
    'Skilled Player (2on2)', 
    'Reach 1300 MMR in 2on2 mode',
    (SELECT id FROM kopecht.achievement_categories WHERE key = 'skill' AND kicker_id = 1),
    'MATCH_ENDED',
    '{"type": "threshold", "metric": "mmr", "target": 1300, "filters": {"gamemode": "2on2"}}',
    100,
    1,
    false,
    false,
    1,
    (SELECT id FROM kopecht.achievement_definitions WHERE key = 'mmr_2on2_1200' AND kicker_id = 1)
) ON CONFLICT (key, kicker_id) DO NOTHING;

INSERT INTO kopecht.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id, parent_id
) VALUES (
    'mmr_2on2_1500', 
    'Expert (2on2)', 
    'Reach 1500 MMR in 2on2 mode',
    (SELECT id FROM kopecht.achievement_categories WHERE key = 'skill' AND kicker_id = 1),
    'MATCH_ENDED',
    '{"type": "threshold", "metric": "mmr", "target": 1500, "filters": {"gamemode": "2on2"}}',
    200,
    1,
    false,
    false,
    1,
    (SELECT id FROM kopecht.achievement_definitions WHERE key = 'mmr_2on2_1300' AND kicker_id = 1)
) ON CONFLICT (key, kicker_id) DO NOTHING;

INSERT INTO kopecht.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id, parent_id
) VALUES (
    'mmr_2on2_1750', 
    'Elite (2on2)', 
    'Reach 1750 MMR in 2on2 mode',
    (SELECT id FROM kopecht.achievement_categories WHERE key = 'skill' AND kicker_id = 1),
    'MATCH_ENDED',
    '{"type": "threshold", "metric": "mmr", "target": 1750, "filters": {"gamemode": "2on2"}}',
    400,
    1,
    false,
    false,
    1,
    (SELECT id FROM kopecht.achievement_definitions WHERE key = 'mmr_2on2_1500' AND kicker_id = 1)
) ON CONFLICT (key, kicker_id) DO NOTHING;

INSERT INTO kopecht.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id, parent_id
) VALUES (
    'mmr_2on2_2000', 
    'Grandmaster (2on2)', 
    'Reach 2000 MMR in 2on2 mode',
    (SELECT id FROM kopecht.achievement_categories WHERE key = 'skill' AND kicker_id = 1),
    'MATCH_ENDED',
    '{"type": "threshold", "metric": "mmr", "target": 2000, "filters": {"gamemode": "2on2"}}',
    1000,
    1,
    false,
    false,
    1,
    (SELECT id FROM kopecht.achievement_definitions WHERE key = 'mmr_2on2_1750' AND kicker_id = 1)
) ON CONFLICT (key, kicker_id) DO NOTHING;


-- ============================================
-- GIANT SLAYER (Beat +200 MMR opponent)
-- ============================================

INSERT INTO kopecht.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id
) VALUES (
    'giant_slayer_1on1', 
    'Giant Slayer (1on1)', 
    'Beat an opponent with 200+ higher MMR in 1on1 mode',
    (SELECT id FROM kopecht.achievement_categories WHERE key = 'skill' AND kicker_id = 1),
    'MATCH_ENDED',
    '{"type": "threshold", "metric": "mmr_diff_win", "target": 200, "filters": {"gamemode": "1on1", "result": "win"}}',
    100,
    1,
    false,
    false,
    1
) ON CONFLICT (key, kicker_id) DO NOTHING;

INSERT INTO kopecht.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id
) VALUES (
    'giant_slayer_2on2', 
    'Giant Slayer (2on2)', 
    'Beat opponents with 200+ higher average MMR in 2on2 mode',
    (SELECT id FROM kopecht.achievement_categories WHERE key = 'skill' AND kicker_id = 1),
    'MATCH_ENDED',
    '{"type": "threshold", "metric": "mmr_diff_win", "target": 200, "filters": {"gamemode": "2on2", "result": "win"}}',
    100,
    1,
    false,
    false,
    1
) ON CONFLICT (key, kicker_id) DO NOTHING;


-- ============================================
-- PLAYTIME ACHIEVEMENTS
-- ============================================

INSERT INTO kopecht.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id
) VALUES (
    'playtime_8h', 
    'Time Flies', 
    'Play for a total of 8 hours',
    (SELECT id FROM kopecht.achievement_categories WHERE key = 'playtime' AND kicker_id = 1),
    'MATCH_ENDED',
    '{"type": "counter", "metric": "playtime_seconds", "target": 28800}',
    50,
    28800,
    false,
    false,
    1
) ON CONFLICT (key, kicker_id) DO NOTHING;

INSERT INTO kopecht.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id, parent_id
) VALUES (
    'playtime_16h', 
    'Dedicated Player', 
    'Play for a total of 16 hours',
    (SELECT id FROM kopecht.achievement_categories WHERE key = 'playtime' AND kicker_id = 1),
    'MATCH_ENDED',
    '{"type": "counter", "metric": "playtime_seconds", "target": 57600}',
    100,
    57600,
    false,
    false,
    1,
    (SELECT id FROM kopecht.achievement_definitions WHERE key = 'playtime_8h' AND kicker_id = 1)
) ON CONFLICT (key, kicker_id) DO NOTHING;

INSERT INTO kopecht.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id, parent_id
) VALUES (
    'playtime_24h', 
    'Full Day', 
    'Play for a total of 24 hours',
    (SELECT id FROM kopecht.achievement_categories WHERE key = 'playtime' AND kicker_id = 1),
    'MATCH_ENDED',
    '{"type": "counter", "metric": "playtime_seconds", "target": 86400}',
    200,
    86400,
    false,
    false,
    1,
    (SELECT id FROM kopecht.achievement_definitions WHERE key = 'playtime_16h' AND kicker_id = 1)
) ON CONFLICT (key, kicker_id) DO NOTHING;


-- ============================================
-- TEAMWORK (2on2 only)
-- ============================================

INSERT INTO kopecht.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id
) VALUES (
    'carry_2on2', 
    'The Carry', 
    'Score all goals for your team and win the 2on2 match',
    (SELECT id FROM kopecht.achievement_categories WHERE key = 'teamwork' AND kicker_id = 1),
    'MATCH_ENDED',
    '{"type": "threshold", "metric": "carry_win", "filters": {"gamemode": "2on2", "result": "win"}}',
    150,
    1,
    false,
    false,
    1
) ON CONFLICT (key, kicker_id) DO NOTHING;


-- ============================================
-- HIDDEN ACHIEVEMENTS
-- ============================================

-- Silent Partner - Win 2on2 without scoring
INSERT INTO kopecht.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id
) VALUES (
    'silent_partner', 
    'Silent Partner', 
    'Win a 2on2 match without scoring a single goal',
    (SELECT id FROM kopecht.achievement_categories WHERE key = 'hidden' AND kicker_id = 1),
    'MATCH_ENDED',
    '{"type": "threshold", "metric": "silent_win", "filters": {"gamemode": "2on2", "result": "win"}}',
    100,
    1,
    true,
    false,
    1
) ON CONFLICT (key, kicker_id) DO NOTHING;

-- Losing Streak
INSERT INTO kopecht.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id
) VALUES (
    'losing_streak_10', 
    'Persistence', 
    'Lose 10 matches in a row',
    (SELECT id FROM kopecht.achievement_categories WHERE key = 'hidden' AND kicker_id = 1),
    'MATCH_ENDED',
    '{"type": "streak", "streak_condition": {"result": "loss", "min_streak": 10}}',
    50,
    1,
    true,
    false,
    1
) ON CONFLICT (key, kicker_id) DO NOTHING;

-- Season Champion
INSERT INTO kopecht.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id
) VALUES (
    'season_champion', 
    'Season Champion', 
    'Finish a season in 1st place',
    (SELECT id FROM kopecht.achievement_categories WHERE key = 'season' AND kicker_id = 1),
    'SEASON_ENDED',
    '{"type": "threshold", "metric": "season_rank", "target": 1}',
    500,
    1,
    true,
    false,
    1
) ON CONFLICT (key, kicker_id) DO NOTHING;

-- Undefeated Season
INSERT INTO kopecht.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id
) VALUES (
    'undefeated_season', 
    'Undefeated', 
    'Finish a season without losing a single match',
    (SELECT id FROM kopecht.achievement_categories WHERE key = 'season' AND kicker_id = 1),
    'SEASON_ENDED',
    '{"type": "threshold", "metric": "losses", "target": 0}',
    1000,
    1,
    true,
    false,
    1
) ON CONFLICT (key, kicker_id) DO NOTHING;

-- Miracle Comeback (0:9)
INSERT INTO kopecht.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id
) VALUES (
    'miracle_comeback', 
    'Miracle Comeback', 
    'Win a match after being down 0:9',
    (SELECT id FROM kopecht.achievement_categories WHERE key = 'hidden' AND kicker_id = 1),
    'MATCH_ENDED',
    '{"type": "threshold", "metric": "comeback", "target": 9, "filters": {"result": "win"}}',
    500,
    1,
    true,
    false,
    1
) ON CONFLICT (key, kicker_id) DO NOTHING;

-- Own Goal Hat Trick
INSERT INTO kopecht.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id
) VALUES (
    'own_goal_hat_trick', 
    'Oops...', 
    'Score 3 own goals in a single match',
    (SELECT id FROM kopecht.achievement_categories WHERE key = 'hidden' AND kicker_id = 1),
    'MATCH_ENDED',
    '{"type": "threshold", "metric": "own_goals_in_match", "target": 3}',
    25,
    1,
    true,
    false,
    1
) ON CONFLICT (key, kicker_id) DO NOTHING;


-- ============================================
-- META ACHIEVEMENTS
-- ============================================

INSERT INTO kopecht.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id
) VALUES (
    'achievement_hunter_25', 
    'Achievement Hunter', 
    'Unlock 25 achievements',
    (SELECT id FROM kopecht.achievement_categories WHERE key = 'meta' AND kicker_id = 1),
    'ACHIEVEMENT_UNLOCKED',
    '{"type": "counter", "metric": "achievements_unlocked", "target": 25}',
    100,
    25,
    false,
    false,
    1
) ON CONFLICT (key, kicker_id) DO NOTHING;

INSERT INTO kopecht.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id, parent_id
) VALUES (
    'completionist', 
    'Completionist', 
    'Unlock all achievements',
    (SELECT id FROM kopecht.achievement_categories WHERE key = 'meta' AND kicker_id = 1),
    'ACHIEVEMENT_UNLOCKED',
    '{"type": "threshold", "metric": "all_achievements"}',
    1000,
    1,
    false,
    false,
    1,
    (SELECT id FROM kopecht.achievement_definitions WHERE key = 'achievement_hunter_25' AND kicker_id = 1)
) ON CONFLICT (key, kicker_id) DO NOTHING;
