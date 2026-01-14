-- Rollback: Remove SUPERADMIN RLS policies (kopecht schema)

DROP POLICY IF EXISTS "Superadmins can insert achievement progress" ON kopecht.player_achievement_progress;
DROP POLICY IF EXISTS "Superadmins can update achievement progress" ON kopecht.player_achievement_progress;
DROP POLICY IF EXISTS "Superadmins can delete achievement progress" ON kopecht.player_achievement_progress;

DROP POLICY IF EXISTS "Superadmins can insert achievement definitions" ON kopecht.achievement_definitions;
DROP POLICY IF EXISTS "Superadmins can update achievement definitions" ON kopecht.achievement_definitions;
DROP POLICY IF EXISTS "Superadmins can delete achievement definitions" ON kopecht.achievement_definitions;

DROP POLICY IF EXISTS "Superadmins can insert achievement categories" ON kopecht.achievement_categories;
DROP POLICY IF EXISTS "Superadmins can update achievement categories" ON kopecht.achievement_categories;
DROP POLICY IF EXISTS "Superadmins can delete achievement categories" ON kopecht.achievement_categories;

DROP POLICY IF EXISTS "Superadmins can insert reward definitions" ON kopecht.reward_definitions;
DROP POLICY IF EXISTS "Superadmins can update reward definitions" ON kopecht.reward_definitions;
DROP POLICY IF EXISTS "Superadmins can delete reward definitions" ON kopecht.reward_definitions;

DROP POLICY IF EXISTS "Superadmins can insert player status" ON kopecht.player_status;
DROP POLICY IF EXISTS "Superadmins can update player status" ON kopecht.player_status;
DROP POLICY IF EXISTS "Superadmins can delete player status" ON kopecht.player_status;

DROP POLICY IF EXISTS "Superadmins can insert team status" ON kopecht.team_status;
DROP POLICY IF EXISTS "Superadmins can update team status" ON kopecht.team_status;
DROP POLICY IF EXISTS "Superadmins can delete team status" ON kopecht.team_status;

DROP POLICY IF EXISTS "Superadmins can update player achievements" ON kopecht.player_achievements;
DROP POLICY IF EXISTS "Superadmins can delete player achievements" ON kopecht.player_achievements;
