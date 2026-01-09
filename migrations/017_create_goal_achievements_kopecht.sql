-- Goal Achievements for 1on1 and 2on2 (kopecht schema)
-- Run this in Supabase SQL Editor

-- ============================================
-- 1ON1 GOAL ACHIEVEMENTS
-- ============================================

-- Bambini already exists (10 goals in 1on1)

-- Torjäger - 100 goals in 1on1
INSERT INTO kopecht.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id, parent_id
) VALUES (
    'goals_1on1_100', 
    'Tryharder', 
    'Score 100 goals in 1on1 matches',
    (SELECT id FROM kopecht.achievement_categories WHERE key = 'goals' AND kicker_id = 1),
    'GOAL_SCORED',
    '{"type": "counter", "metric": "goals", "target": 100, "filters": {"gamemode": "1on1"}}',
    100,
    100,
    false,
    false,
    1,
    (SELECT id FROM kopecht.achievement_definitions WHERE key = 'goals_1on1_10' AND kicker_id = 1)
);

-- Scharfschütze - 500 goals in 1on1
INSERT INTO kopecht.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id, parent_id
) VALUES (
    'goals_1on1_500', 
    'Sniper', 
    'Score 500 goals in 1on1 matches',
    (SELECT id FROM kopecht.achievement_categories WHERE key = 'goals' AND kicker_id = 1),
    'GOAL_SCORED',
    '{"type": "counter", "metric": "goals", "target": 500, "filters": {"gamemode": "1on1"}}',
    250,
    500,
    false,
    false,
    1,
    (SELECT id FROM kopecht.achievement_definitions WHERE key = 'goals_1on1_100' AND kicker_id = 1)
);

-- Tormaschine - 1000 goals in 1on1
INSERT INTO kopecht.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id, parent_id
) VALUES (
    'goals_1on1_1000', 
    'Goal Machine', 
    'Score 1000 goals in 1on1 matches',
    (SELECT id FROM kopecht.achievement_categories WHERE key = 'goals' AND kicker_id = 1),
    'GOAL_SCORED',
    '{"type": "counter", "metric": "goals", "target": 1000, "filters": {"gamemode": "1on1"}}',
    500,
    1000,
    false,
    false,
    1,
    (SELECT id FROM kopecht.achievement_definitions WHERE key = 'goals_1on1_500' AND kicker_id = 1)
);

-- Solo-Legende - 2500 goals in 1on1
INSERT INTO kopecht.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id, parent_id
) VALUES (
    'goals_1on1_2500', 
    'Solo Legend', 
    'Score 2500 goals in 1on1 matches',
    (SELECT id FROM kopecht.achievement_categories WHERE key = 'goals' AND kicker_id = 1),
    'GOAL_SCORED',
    '{"type": "counter", "metric": "goals", "target": 2500, "filters": {"gamemode": "1on1"}}',
    1000,
    2500,
    false,
    false,
    1,
    (SELECT id FROM kopecht.achievement_definitions WHERE key = 'goals_1on1_1000' AND kicker_id = 1)
);

-- Einzelkämpfer - 5000 goals in 1on1
INSERT INTO kopecht.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id, parent_id
) VALUES (
    'goals_1on1_5000', 
    'Einzelkämpfer', 
    'Score 5000 goals in 1on1 matches',
    (SELECT id FROM kopecht.achievement_categories WHERE key = 'goals' AND kicker_id = 1),
    'GOAL_SCORED',
    '{"type": "counter", "metric": "goals", "target": 5000, "filters": {"gamemode": "1on1"}}',
    2000,
    5000,
    false,
    false,
    1,
    (SELECT id FROM kopecht.achievement_definitions WHERE key = 'goals_1on1_2500' AND kicker_id = 1)
);

-- ============================================
-- 2ON2 GOAL ACHIEVEMENTS
-- ============================================

-- Teamplayer - 10 goals in 2on2
INSERT INTO kopecht.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id
) VALUES (
    'goals_2on2_10', 
    'Teamplayer', 
    'Score 10 goals in 2on2 matches',
    (SELECT id FROM kopecht.achievement_categories WHERE key = 'goals' AND kicker_id = 1),
    'GOAL_SCORED',
    '{"type": "counter", "metric": "goals", "target": 10, "filters": {"gamemode": "2on2"}}',
    50,
    10,
    false,
    false,
    1
);

-- Doppelpacker - 100 goals in 2on2
INSERT INTO kopecht.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id, parent_id
) VALUES (
    'goals_2on2_100', 
    'Double Striker', 
    'Score 100 goals in 2on2 matches',
    (SELECT id FROM kopecht.achievement_categories WHERE key = 'goals' AND kicker_id = 1),
    'GOAL_SCORED',
    '{"type": "counter", "metric": "goals", "target": 100, "filters": {"gamemode": "2on2"}}',
    100,
    100,
    false,
    false,
    1,
    (SELECT id FROM kopecht.achievement_definitions WHERE key = 'goals_2on2_10' AND kicker_id = 1)
);

-- Team-Kanone - 500 goals in 2on2
INSERT INTO kopecht.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id, parent_id
) VALUES (
    'goals_2on2_500', 
    'Team Cannon', 
    'Score 500 goals in 2on2 matches',
    (SELECT id FROM kopecht.achievement_categories WHERE key = 'goals' AND kicker_id = 1),
    'GOAL_SCORED',
    '{"type": "counter", "metric": "goals", "target": 500, "filters": {"gamemode": "2on2"}}',
    250,
    500,
    false,
    false,
    1,
    (SELECT id FROM kopecht.achievement_definitions WHERE key = 'goals_2on2_100' AND kicker_id = 1)
);

-- Duo-Dynamo - 1000 goals in 2on2
INSERT INTO kopecht.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id, parent_id
) VALUES (
    'goals_2on2_1000', 
    'Duo Dynamo', 
    'Score 1000 goals in 2on2 matches',
    (SELECT id FROM kopecht.achievement_categories WHERE key = 'goals' AND kicker_id = 1),
    'GOAL_SCORED',
    '{"type": "counter", "metric": "goals", "target": 1000, "filters": {"gamemode": "2on2"}}',
    500,
    1000,
    false,
    false,
    1,
    (SELECT id FROM kopecht.achievement_definitions WHERE key = 'goals_2on2_500' AND kicker_id = 1)
);

-- Team-Legende - 2500 goals in 2on2
INSERT INTO kopecht.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id, parent_id
) VALUES (
    'goals_2on2_2500', 
    'Team Legend', 
    'Score 2500 goals in 2on2 matches',
    (SELECT id FROM kopecht.achievement_categories WHERE key = 'goals' AND kicker_id = 1),
    'GOAL_SCORED',
    '{"type": "counter", "metric": "goals", "target": 2500, "filters": {"gamemode": "2on2"}}',
    1000,
    2500,
    false,
    false,
    1,
    (SELECT id FROM kopecht.achievement_definitions WHERE key = 'goals_2on2_1000' AND kicker_id = 1)
);

-- Duo-Gott - 5000 goals in 2on2
INSERT INTO kopecht.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id, parent_id
) VALUES (
    'goals_2on2_5000', 
    'Duo God', 
    'Score 5000 goals in 2on2 matches',
    (SELECT id FROM kopecht.achievement_categories WHERE key = 'goals' AND kicker_id = 1),
    'GOAL_SCORED',
    '{"type": "counter", "metric": "goals", "target": 5000, "filters": {"gamemode": "2on2"}}',
    2000,
    5000,
    false,
    false,
    1,
    (SELECT id FROM kopecht.achievement_definitions WHERE key = 'goals_2on2_2500' AND kicker_id = 1)
);
