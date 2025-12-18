-- Goals Category + Bambini Achievement (kopecht schema)
-- Run this in Supabase SQL Editor

-- 1. Create Goals Category
INSERT INTO kopecht.achievement_categories (key, name, description, icon, sort_order, kicker_id)
VALUES ('goals', 'Goals', 'Achievements for scoring goals', '⚽', 1, 1);

-- 2. Create Bambini Achievement
-- Score 10 goals in 1on1 matches
INSERT INTO kopecht.achievement_definitions (
    key, 
    name, 
    description, 
    category_id, 
    trigger_event, 
    condition, 
    points, 
    max_progress, 
    is_hidden,
    is_repeatable,
    kicker_id
) VALUES (
    'bambini', 
    'Bambini', 
    'Score 10 goals in 1on1 matches',
    (SELECT id FROM kopecht.achievement_categories WHERE key = 'goals' AND kicker_id = 1),
    'GOAL_SCORED',
    '{"type": "counter", "metric": "goals", "target": 10, "filters": {"gamemode": "1on1"}}',
    50,
    10,
    false,
    false,
    1
);
