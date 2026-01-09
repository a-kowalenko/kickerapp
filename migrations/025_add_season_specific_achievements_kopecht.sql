-- Migration: Add season-specific achievement support
-- Schema: kopecht
-- This migration adds is_season_specific flag and season_id to progress table

SET search_path TO kopecht;

-- ============================================
-- 1. Add is_season_specific column to achievement_definitions
-- ============================================
ALTER TABLE kopecht.achievement_definitions 
ADD COLUMN IF NOT EXISTS is_season_specific BOOLEAN NOT NULL DEFAULT true;

-- ============================================
-- 2. Add season_id to player_achievement_progress
-- ============================================
ALTER TABLE kopecht.player_achievement_progress 
ADD COLUMN IF NOT EXISTS season_id BIGINT REFERENCES kopecht.seasons(id) ON DELETE SET NULL;

-- Drop old unique constraint and create new one with season_id
ALTER TABLE kopecht.player_achievement_progress 
DROP CONSTRAINT IF EXISTS player_achievement_progress_unique;

ALTER TABLE kopecht.player_achievement_progress 
ADD CONSTRAINT player_achievement_progress_unique 
UNIQUE (player_id, achievement_id, season_id);

-- Add index for season-based progress queries
CREATE INDEX IF NOT EXISTS idx_player_achievement_progress_season 
ON kopecht.player_achievement_progress(season_id);

-- ============================================
-- 3. Set is_season_specific = false for global achievements
-- Global achievements: Meta category, Season category
-- ============================================

-- Meta achievements are global (track all-time achievement count)
UPDATE kopecht.achievement_definitions 
SET is_season_specific = false 
WHERE category_id IN (
    SELECT id FROM kopecht.achievement_categories WHERE key = 'meta'
);

-- Season achievements are global (podium, champion - they're inherently season-based but tracked globally)
UPDATE kopecht.achievement_definitions 
SET is_season_specific = false 
WHERE category_id IN (
    SELECT id FROM kopecht.achievement_categories WHERE key = 'season'
);

-- ============================================
-- 4. Create all-time (global) versions of key achievements
-- These have higher targets and track across all seasons
-- ============================================

-- Helper function to get or create all-time category
DO $$
DECLARE
    kicker_rec RECORD;
    alltime_cat_id BIGINT;
BEGIN
    FOR kicker_rec IN SELECT id FROM kopecht.kicker LOOP
        -- Create 'alltime' category if not exists
        INSERT INTO kopecht.achievement_categories (key, name, description, icon, sort_order, kicker_id)
        VALUES ('alltime', 'All-Time', 'Achievements that track your entire career across all seasons', '🌟', 100, kicker_rec.id)
        ON CONFLICT (key, kicker_id) DO NOTHING;
        
        SELECT id INTO alltime_cat_id 
        FROM kopecht.achievement_categories 
        WHERE key = 'alltime' AND kicker_id = kicker_rec.id;

        -- ============================================
        -- ALL-TIME MATCHES ACHIEVEMENTS
        -- ============================================
        
        -- 500 Matches All-Time (1on1)
        INSERT INTO kopecht.achievement_definitions (
            key, name, description, category_id, trigger_event, condition,
            points, max_progress, is_hidden, is_repeatable, is_season_specific, kicker_id
        ) VALUES (
            'matches_500_alltime_1on1',
            'Veteran (1on1)',
            'Play 500 1on1 matches across all seasons',
            alltime_cat_id,
            'MATCH_ENDED',
            '{"type": "counter", "metric": "matches", "target": 500, "filters": {"gamemode": "1on1"}}',
            300,
            500,
            false,
            false,
            false,
            kicker_rec.id
        ) ON CONFLICT (key, kicker_id) DO NOTHING;

        -- 1000 Matches All-Time (1on1)
        INSERT INTO kopecht.achievement_definitions (
            key, name, description, category_id, trigger_event, condition,
            points, max_progress, is_hidden, is_repeatable, is_season_specific, kicker_id,
            parent_id
        ) VALUES (
            'matches_1000_alltime_1on1',
            'Legend (1on1)',
            'Play 1000 1on1 matches across all seasons',
            alltime_cat_id,
            'MATCH_ENDED',
            '{"type": "counter", "metric": "matches", "target": 1000, "filters": {"gamemode": "1on1"}}',
            500,
            1000,
            false,
            false,
            false,
            kicker_rec.id,
            (SELECT id FROM kopecht.achievement_definitions WHERE key = 'matches_500_alltime_1on1' AND kicker_id = kicker_rec.id)
        ) ON CONFLICT (key, kicker_id) DO NOTHING;

        -- 500 Matches All-Time (2on2)
        INSERT INTO kopecht.achievement_definitions (
            key, name, description, category_id, trigger_event, condition,
            points, max_progress, is_hidden, is_repeatable, is_season_specific, kicker_id
        ) VALUES (
            'matches_500_alltime_2on2',
            'Veteran (2on2)',
            'Play 500 2on2 matches across all seasons',
            alltime_cat_id,
            'MATCH_ENDED',
            '{"type": "counter", "metric": "matches", "target": 500, "filters": {"gamemode": "2on2"}}',
            300,
            500,
            false,
            false,
            false,
            kicker_rec.id
        ) ON CONFLICT (key, kicker_id) DO NOTHING;

        -- 1000 Matches All-Time (2on2)
        INSERT INTO kopecht.achievement_definitions (
            key, name, description, category_id, trigger_event, condition,
            points, max_progress, is_hidden, is_repeatable, is_season_specific, kicker_id,
            parent_id
        ) VALUES (
            'matches_1000_alltime_2on2',
            'Legend (2on2)',
            'Play 1000 2on2 matches across all seasons',
            alltime_cat_id,
            'MATCH_ENDED',
            '{"type": "counter", "metric": "matches", "target": 1000, "filters": {"gamemode": "2on2"}}',
            500,
            1000,
            false,
            false,
            false,
            kicker_rec.id,
            (SELECT id FROM kopecht.achievement_definitions WHERE key = 'matches_500_alltime_2on2' AND kicker_id = kicker_rec.id)
        ) ON CONFLICT (key, kicker_id) DO NOTHING;

        -- ============================================
        -- ALL-TIME WINS ACHIEVEMENTS
        -- ============================================

        -- 500 Wins All-Time (1on1)
        INSERT INTO kopecht.achievement_definitions (
            key, name, description, category_id, trigger_event, condition,
            points, max_progress, is_hidden, is_repeatable, is_season_specific, kicker_id
        ) VALUES (
            'wins_500_alltime_1on1',
            'Champion Soul (1on1)',
            'Win 500 1on1 matches across all seasons',
            alltime_cat_id,
            'MATCH_ENDED',
            '{"type": "counter", "metric": "wins", "target": 500, "filters": {"gamemode": "1on1"}}',
            400,
            500,
            false,
            false,
            false,
            kicker_rec.id
        ) ON CONFLICT (key, kicker_id) DO NOTHING;

        -- 1000 Wins All-Time (1on1)
        INSERT INTO kopecht.achievement_definitions (
            key, name, description, category_id, trigger_event, condition,
            points, max_progress, is_hidden, is_repeatable, is_season_specific, kicker_id,
            parent_id
        ) VALUES (
            'wins_1000_alltime_1on1',
            'Immortal (1on1)',
            'Win 1000 1on1 matches across all seasons',
            alltime_cat_id,
            'MATCH_ENDED',
            '{"type": "counter", "metric": "wins", "target": 1000, "filters": {"gamemode": "1on1"}}',
            750,
            1000,
            false,
            false,
            false,
            kicker_rec.id,
            (SELECT id FROM kopecht.achievement_definitions WHERE key = 'wins_500_alltime_1on1' AND kicker_id = kicker_rec.id)
        ) ON CONFLICT (key, kicker_id) DO NOTHING;

        -- 500 Wins All-Time (2on2)
        INSERT INTO kopecht.achievement_definitions (
            key, name, description, category_id, trigger_event, condition,
            points, max_progress, is_hidden, is_repeatable, is_season_specific, kicker_id
        ) VALUES (
            'wins_500_alltime_2on2',
            'Champion Soul (2on2)',
            'Win 500 2on2 matches across all seasons',
            alltime_cat_id,
            'MATCH_ENDED',
            '{"type": "counter", "metric": "wins", "target": 500, "filters": {"gamemode": "2on2"}}',
            400,
            500,
            false,
            false,
            false,
            kicker_rec.id
        ) ON CONFLICT (key, kicker_id) DO NOTHING;

        -- 1000 Wins All-Time (2on2)
        INSERT INTO kopecht.achievement_definitions (
            key, name, description, category_id, trigger_event, condition,
            points, max_progress, is_hidden, is_repeatable, is_season_specific, kicker_id,
            parent_id
        ) VALUES (
            'wins_1000_alltime_2on2',
            'Immortal (2on2)',
            'Win 1000 2on2 matches across all seasons',
            alltime_cat_id,
            'MATCH_ENDED',
            '{"type": "counter", "metric": "wins", "target": 1000, "filters": {"gamemode": "2on2"}}',
            750,
            1000,
            false,
            false,
            false,
            kicker_rec.id,
            (SELECT id FROM kopecht.achievement_definitions WHERE key = 'wins_500_alltime_2on2' AND kicker_id = kicker_rec.id)
        ) ON CONFLICT (key, kicker_id) DO NOTHING;

        -- ============================================
        -- ALL-TIME GOALS ACHIEVEMENTS
        -- ============================================

        -- 1000 Goals All-Time
        INSERT INTO kopecht.achievement_definitions (
            key, name, description, category_id, trigger_event, condition,
            points, max_progress, is_hidden, is_repeatable, is_season_specific, kicker_id
        ) VALUES (
            'goals_1000_alltime',
            'Thousand Strikes',
            'Score 1000 goals across all seasons',
            alltime_cat_id,
            'GOAL_SCORED',
            '{"type": "counter", "metric": "goals", "target": 1000}',
            500,
            1000,
            false,
            false,
            false,
            kicker_rec.id
        ) ON CONFLICT (key, kicker_id) DO NOTHING;

        -- 2500 Goals All-Time
        INSERT INTO kopecht.achievement_definitions (
            key, name, description, category_id, trigger_event, condition,
            points, max_progress, is_hidden, is_repeatable, is_season_specific, kicker_id,
            parent_id
        ) VALUES (
            'goals_2500_alltime',
            'Goal Machine',
            'Score 2500 goals across all seasons',
            alltime_cat_id,
            'GOAL_SCORED',
            '{"type": "counter", "metric": "goals", "target": 2500}',
            750,
            2500,
            false,
            false,
            false,
            kicker_rec.id,
            (SELECT id FROM kopecht.achievement_definitions WHERE key = 'goals_1000_alltime' AND kicker_id = kicker_rec.id)
        ) ON CONFLICT (key, kicker_id) DO NOTHING;

        -- 5000 Goals All-Time
        INSERT INTO kopecht.achievement_definitions (
            key, name, description, category_id, trigger_event, condition,
            points, max_progress, is_hidden, is_repeatable, is_season_specific, kicker_id,
            parent_id
        ) VALUES (
            'goals_5000_alltime',
            'Living Legend',
            'Score 5000 goals across all seasons',
            alltime_cat_id,
            'GOAL_SCORED',
            '{"type": "counter", "metric": "goals", "target": 5000}',
            1000,
            5000,
            false,
            false,
            false,
            kicker_rec.id,
            (SELECT id FROM kopecht.achievement_definitions WHERE key = 'goals_2500_alltime' AND kicker_id = kicker_rec.id)
        ) ON CONFLICT (key, kicker_id) DO NOTHING;

        -- ============================================
        -- ALL-TIME PLAYTIME ACHIEVEMENTS
        -- ============================================

        -- 100 Hours All-Time
        INSERT INTO kopecht.achievement_definitions (
            key, name, description, category_id, trigger_event, condition,
            points, max_progress, is_hidden, is_repeatable, is_season_specific, kicker_id
        ) VALUES (
            'playtime_100h_alltime',
            'Dedicated',
            'Play for 100 hours across all seasons',
            alltime_cat_id,
            'MATCH_ENDED',
            '{"type": "counter", "metric": "playtime_seconds", "target": 360000}',
            400,
            360000,
            false,
            false,
            false,
            kicker_rec.id
        ) ON CONFLICT (key, kicker_id) DO NOTHING;

        -- 250 Hours All-Time
        INSERT INTO kopecht.achievement_definitions (
            key, name, description, category_id, trigger_event, condition,
            points, max_progress, is_hidden, is_repeatable, is_season_specific, kicker_id,
            parent_id
        ) VALUES (
            'playtime_250h_alltime',
            'Obsessed',
            'Play for 250 hours across all seasons',
            alltime_cat_id,
            'MATCH_ENDED',
            '{"type": "counter", "metric": "playtime_seconds", "target": 900000}',
            600,
            900000,
            false,
            false,
            false,
            kicker_rec.id,
            (SELECT id FROM kopecht.achievement_definitions WHERE key = 'playtime_100h_alltime' AND kicker_id = kicker_rec.id)
        ) ON CONFLICT (key, kicker_id) DO NOTHING;

        -- 500 Hours All-Time
        INSERT INTO kopecht.achievement_definitions (
            key, name, description, category_id, trigger_event, condition,
            points, max_progress, is_hidden, is_repeatable, is_season_specific, kicker_id,
            parent_id
        ) VALUES (
            'playtime_500h_alltime',
            'No Life',
            'Play for 500 hours across all seasons',
            alltime_cat_id,
            'MATCH_ENDED',
            '{"type": "counter", "metric": "playtime_seconds", "target": 1800000}',
            1000,
            1800000,
            true,
            false,
            false,
            kicker_rec.id,
            (SELECT id FROM kopecht.achievement_definitions WHERE key = 'playtime_250h_alltime' AND kicker_id = kicker_rec.id)
        ) ON CONFLICT (key, kicker_id) DO NOTHING;

    END LOOP;
END $$;

-- ============================================
-- 5. Add index on matches.season_id for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_matches_season_id ON kopecht.matches(season_id);
