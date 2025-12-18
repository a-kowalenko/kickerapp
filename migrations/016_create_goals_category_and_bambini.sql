-- Goals Category + Bambini Achievement
-- Run this in Supabase SQL Editor for the appropriate schema

-- 1. Create Goals Category
INSERT INTO achievement_categories (key, name, description, icon, sort_order, kicker_id)
VALUES ('goals', 'Goals', 'Achievements for scoring goals', '⚽', 1, 1);

-- 2. Create Bambini Achievement
-- Score 10 goals in 1on1 matches
INSERT INTO achievement_definitions (
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
    'goals_1on1_10', 
    'Bambini', 
    'Score 10 goals in 1on1 matches',
    (SELECT id FROM achievement_categories WHERE key = 'goals' AND kicker_id = 1),
    'GOAL_SCORED',
    '{"type": "counter", "metric": "goals", "target": 10, "filters": {"gamemode": "1on1"}}',
    50,
    10,
    false,
    false,
    1
);
