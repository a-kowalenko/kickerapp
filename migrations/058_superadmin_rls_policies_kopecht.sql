-- Migration: Add SUPERADMIN RLS policies for admin views (kopecht schema)

-- player_achievement_progress
CREATE POLICY "Superadmins can insert achievement progress"
ON kopecht.player_achievement_progress FOR INSERT TO public
WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'is_super_admin')::boolean = true);

CREATE POLICY "Superadmins can update achievement progress"
ON kopecht.player_achievement_progress FOR UPDATE TO public
USING ((auth.jwt() -> 'app_metadata' ->> 'is_super_admin')::boolean = true)
WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'is_super_admin')::boolean = true);

CREATE POLICY "Superadmins can delete achievement progress"
ON kopecht.player_achievement_progress FOR DELETE TO public
USING ((auth.jwt() -> 'app_metadata' ->> 'is_super_admin')::boolean = true);

-- achievement_definitions
CREATE POLICY "Superadmins can insert achievement definitions"
ON kopecht.achievement_definitions FOR INSERT TO public
WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'is_super_admin')::boolean = true);

CREATE POLICY "Superadmins can update achievement definitions"
ON kopecht.achievement_definitions FOR UPDATE TO public
USING ((auth.jwt() -> 'app_metadata' ->> 'is_super_admin')::boolean = true)
WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'is_super_admin')::boolean = true);

CREATE POLICY "Superadmins can delete achievement definitions"
ON kopecht.achievement_definitions FOR DELETE TO public
USING ((auth.jwt() -> 'app_metadata' ->> 'is_super_admin')::boolean = true);

-- achievement_categories
CREATE POLICY "Superadmins can insert achievement categories"
ON kopecht.achievement_categories FOR INSERT TO public
WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'is_super_admin')::boolean = true);

CREATE POLICY "Superadmins can update achievement categories"
ON kopecht.achievement_categories FOR UPDATE TO public
USING ((auth.jwt() -> 'app_metadata' ->> 'is_super_admin')::boolean = true)
WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'is_super_admin')::boolean = true);

CREATE POLICY "Superadmins can delete achievement categories"
ON kopecht.achievement_categories FOR DELETE TO public
USING ((auth.jwt() -> 'app_metadata' ->> 'is_super_admin')::boolean = true);

-- reward_definitions
CREATE POLICY "Superadmins can insert reward definitions"
ON kopecht.reward_definitions FOR INSERT TO public
WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'is_super_admin')::boolean = true);

CREATE POLICY "Superadmins can update reward definitions"
ON kopecht.reward_definitions FOR UPDATE TO public
USING ((auth.jwt() -> 'app_metadata' ->> 'is_super_admin')::boolean = true)
WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'is_super_admin')::boolean = true);

CREATE POLICY "Superadmins can delete reward definitions"
ON kopecht.reward_definitions FOR DELETE TO public
USING ((auth.jwt() -> 'app_metadata' ->> 'is_super_admin')::boolean = true);

-- player_status
CREATE POLICY "Superadmins can insert player status"
ON kopecht.player_status FOR INSERT TO public
WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'is_super_admin')::boolean = true);

CREATE POLICY "Superadmins can update player status"
ON kopecht.player_status FOR UPDATE TO public
USING ((auth.jwt() -> 'app_metadata' ->> 'is_super_admin')::boolean = true)
WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'is_super_admin')::boolean = true);

CREATE POLICY "Superadmins can delete player status"
ON kopecht.player_status FOR DELETE TO public
USING ((auth.jwt() -> 'app_metadata' ->> 'is_super_admin')::boolean = true);

-- team_status
CREATE POLICY "Superadmins can insert team status"
ON kopecht.team_status FOR INSERT TO public
WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'is_super_admin')::boolean = true);

CREATE POLICY "Superadmins can update team status"
ON kopecht.team_status FOR UPDATE TO public
USING ((auth.jwt() -> 'app_metadata' ->> 'is_super_admin')::boolean = true)
WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'is_super_admin')::boolean = true);

CREATE POLICY "Superadmins can delete team status"
ON kopecht.team_status FOR DELETE TO public
USING ((auth.jwt() -> 'app_metadata' ->> 'is_super_admin')::boolean = true);

-- player_achievements
CREATE POLICY "Superadmins can update player achievements"
ON kopecht.player_achievements FOR UPDATE TO public
USING ((auth.jwt() -> 'app_metadata' ->> 'is_super_admin')::boolean = true)
WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'is_super_admin')::boolean = true);

CREATE POLICY "Superadmins can delete player achievements"
ON kopecht.player_achievements FOR DELETE TO public
USING ((auth.jwt() -> 'app_metadata' ->> 'is_super_admin')::boolean = true);
