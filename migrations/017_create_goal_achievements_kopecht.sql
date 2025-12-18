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
    'torjaeger_1on1', 
    'Torjäger', 
    'Score 100 goals in 1on1 matches',
    (SELECT id FROM kopecht.achievement_categories WHERE key = 'goals' AND kicker_id = 1),
    'GOAL_SCORED',
    '{"type": "counter", "metric": "goals", "target": 100, "filters": {"gamemode": "1on1"}}',
    100,
    100,
    false,
    false,
    1,
    (SELECT id FROM kopecht.achievement_definitions WHERE key = 'bambini' AND kicker_id = 1)
);

-- Scharfschütze - 500 goals in 1on1
INSERT INTO kopecht.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id, parent_id
) VALUES (
    'scharfschuetze_1on1', 
    'Scharfschütze', 
    'Score 500 goals in 1on1 matches',
    (SELECT id FROM kopecht.achievement_categories WHERE key = 'goals' AND kicker_id = 1),
    'GOAL_SCORED',
    '{"type": "counter", "metric": "goals", "target": 500, "filters": {"gamemode": "1on1"}}',
    250,
    500,
    false,
    false,
    1,
    (SELECT id FROM kopecht.achievement_definitions WHERE key = 'torjaeger_1on1' AND kicker_id = 1)
);

-- Tormaschine - 1000 goals in 1on1
INSERT INTO kopecht.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id, parent_id
) VALUES (
    'tormaschine_1on1', 
    'Tormaschine', 
    'Score 1000 goals in 1on1 matches',
    (SELECT id FROM kopecht.achievement_categories WHERE key = 'goals' AND kicker_id = 1),
    'GOAL_SCORED',
    '{"type": "counter", "metric": "goals", "target": 1000, "filters": {"gamemode": "1on1"}}',
    500,
    1000,
    false,
    false,
    1,
    (SELECT id FROM kopecht.achievement_definitions WHERE key = 'scharfschuetze_1on1' AND kicker_id = 1)
);

-- Solo-Legende - 2500 goals in 1on1
INSERT INTO kopecht.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id, parent_id
) VALUES (
    'solo_legende', 
    'Solo-Legende', 
    'Score 2500 goals in 1on1 matches',
    (SELECT id FROM kopecht.achievement_categories WHERE key = 'goals' AND kicker_id = 1),
    'GOAL_SCORED',
    '{"type": "counter", "metric": "goals", "target": 2500, "filters": {"gamemode": "1on1"}}',
    1000,
    2500,
    false,
    false,
    1,
    (SELECT id FROM kopecht.achievement_definitions WHERE key = 'tormaschine_1on1' AND kicker_id = 1)
);

-- Einzelkämpfer - 5000 goals in 1on1
INSERT INTO kopecht.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id, parent_id
) VALUES (
    'einzelkaempfer', 
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
    (SELECT id FROM kopecht.achievement_definitions WHERE key = 'solo_legende' AND kicker_id = 1)
);

-- ============================================
-- 2ON2 GOAL ACHIEVEMENTS
-- ============================================

-- Teamplayer - 10 goals in 2on2
INSERT INTO kopecht.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id
) VALUES (
    'teamplayer', 
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
    'doppelpacker', 
    'Doppelpacker', 
    'Score 100 goals in 2on2 matches',
    (SELECT id FROM kopecht.achievement_categories WHERE key = 'goals' AND kicker_id = 1),
    'GOAL_SCORED',
    '{"type": "counter", "metric": "goals", "target": 100, "filters": {"gamemode": "2on2"}}',
    100,
    100,
    false,
    false,
    1,
    (SELECT id FROM kopecht.achievement_definitions WHERE key = 'teamplayer' AND kicker_id = 1)
);

-- Team-Kanone - 500 goals in 2on2
INSERT INTO kopecht.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id, parent_id
) VALUES (
    'team_kanone', 
    'Team-Kanone', 
    'Score 500 goals in 2on2 matches',
    (SELECT id FROM kopecht.achievement_categories WHERE key = 'goals' AND kicker_id = 1),
    'GOAL_SCORED',
    '{"type": "counter", "metric": "goals", "target": 500, "filters": {"gamemode": "2on2"}}',
    250,
    500,
    false,
    false,
    1,
    (SELECT id FROM kopecht.achievement_definitions WHERE key = 'doppelpacker' AND kicker_id = 1)
);

-- Duo-Dynamo - 1000 goals in 2on2
INSERT INTO kopecht.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id, parent_id
) VALUES (
    'duo_dynamo', 
    'Duo-Dynamo', 
    'Score 1000 goals in 2on2 matches',
    (SELECT id FROM kopecht.achievement_categories WHERE key = 'goals' AND kicker_id = 1),
    'GOAL_SCORED',
    '{"type": "counter", "metric": "goals", "target": 1000, "filters": {"gamemode": "2on2"}}',
    500,
    1000,
    false,
    false,
    1,
    (SELECT id FROM kopecht.achievement_definitions WHERE key = 'team_kanone' AND kicker_id = 1)
);

-- Team-Legende - 2500 goals in 2on2
INSERT INTO kopecht.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id, parent_id
) VALUES (
    'team_legende', 
    'Team-Legende', 
    'Score 2500 goals in 2on2 matches',
    (SELECT id FROM kopecht.achievement_categories WHERE key = 'goals' AND kicker_id = 1),
    'GOAL_SCORED',
    '{"type": "counter", "metric": "goals", "target": 2500, "filters": {"gamemode": "2on2"}}',
    1000,
    2500,
    false,
    false,
    1,
    (SELECT id FROM kopecht.achievement_definitions WHERE key = 'duo_dynamo' AND kicker_id = 1)
);

-- Duo-Gott - 5000 goals in 2on2
INSERT INTO kopecht.achievement_definitions (
    key, name, description, category_id, trigger_event, condition, 
    points, max_progress, is_hidden, is_repeatable, kicker_id, parent_id
) VALUES (
    'duo_gott', 
    'Duo-Gott', 
    'Score 5000 goals in 2on2 matches',
    (SELECT id FROM kopecht.achievement_categories WHERE key = 'goals' AND kicker_id = 1),
    'GOAL_SCORED',
    '{"type": "counter", "metric": "goals", "target": 5000, "filters": {"gamemode": "2on2"}}',
    2000,
    5000,
    false,
    false,
    1,
    (SELECT id FROM kopecht.achievement_definitions WHERE key = 'team_legende' AND kicker_id = 1)
);
