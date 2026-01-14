-- Migration: Add SUPERADMIN RLS policies for admin views
-- Tables: player_achievement_progress, achievement_definitions, achievement_categories, 
--         reward_definitions, player_status, team_status, player_achievements

-- ============================================
-- player_achievement_progress - INSERT, UPDATE, DELETE for SUPERADMIN
-- ============================================

CREATE POLICY "Superadmins can insert achievement progress"
ON public.player_achievement_progress
FOR INSERT
TO public
WITH CHECK (
  (auth.jwt() -> 'app_metadata' ->> 'is_super_admin')::boolean = true
);

CREATE POLICY "Superadmins can update achievement progress"
ON public.player_achievement_progress
FOR UPDATE
TO public
USING (
  (auth.jwt() -> 'app_metadata' ->> 'is_super_admin')::boolean = true
)
WITH CHECK (
  (auth.jwt() -> 'app_metadata' ->> 'is_super_admin')::boolean = true
);

CREATE POLICY "Superadmins can delete achievement progress"
ON public.player_achievement_progress
FOR DELETE
TO public
USING (
  (auth.jwt() -> 'app_metadata' ->> 'is_super_admin')::boolean = true
);

-- ============================================
-- achievement_definitions - Full CRUD for SUPERADMIN
-- ============================================

CREATE POLICY "Superadmins can insert achievement definitions"
ON public.achievement_definitions
FOR INSERT
TO public
WITH CHECK (
  (auth.jwt() -> 'app_metadata' ->> 'is_super_admin')::boolean = true
);

CREATE POLICY "Superadmins can update achievement definitions"
ON public.achievement_definitions
FOR UPDATE
TO public
USING (
  (auth.jwt() -> 'app_metadata' ->> 'is_super_admin')::boolean = true
)
WITH CHECK (
  (auth.jwt() -> 'app_metadata' ->> 'is_super_admin')::boolean = true
);

CREATE POLICY "Superadmins can delete achievement definitions"
ON public.achievement_definitions
FOR DELETE
TO public
USING (
  (auth.jwt() -> 'app_metadata' ->> 'is_super_admin')::boolean = true
);

-- ============================================
-- achievement_categories - Full CRUD for SUPERADMIN
-- ============================================

CREATE POLICY "Superadmins can insert achievement categories"
ON public.achievement_categories
FOR INSERT
TO public
WITH CHECK (
  (auth.jwt() -> 'app_metadata' ->> 'is_super_admin')::boolean = true
);

CREATE POLICY "Superadmins can update achievement categories"
ON public.achievement_categories
FOR UPDATE
TO public
USING (
  (auth.jwt() -> 'app_metadata' ->> 'is_super_admin')::boolean = true
)
WITH CHECK (
  (auth.jwt() -> 'app_metadata' ->> 'is_super_admin')::boolean = true
);

CREATE POLICY "Superadmins can delete achievement categories"
ON public.achievement_categories
FOR DELETE
TO public
USING (
  (auth.jwt() -> 'app_metadata' ->> 'is_super_admin')::boolean = true
);

-- ============================================
-- reward_definitions - Full CRUD for SUPERADMIN
-- ============================================

CREATE POLICY "Superadmins can insert reward definitions"
ON public.reward_definitions
FOR INSERT
TO public
WITH CHECK (
  (auth.jwt() -> 'app_metadata' ->> 'is_super_admin')::boolean = true
);

CREATE POLICY "Superadmins can update reward definitions"
ON public.reward_definitions
FOR UPDATE
TO public
USING (
  (auth.jwt() -> 'app_metadata' ->> 'is_super_admin')::boolean = true
)
WITH CHECK (
  (auth.jwt() -> 'app_metadata' ->> 'is_super_admin')::boolean = true
);

CREATE POLICY "Superadmins can delete reward definitions"
ON public.reward_definitions
FOR DELETE
TO public
USING (
  (auth.jwt() -> 'app_metadata' ->> 'is_super_admin')::boolean = true
);

-- ============================================
-- player_status - Full CRUD for SUPERADMIN
-- ============================================

CREATE POLICY "Superadmins can insert player status"
ON public.player_status
FOR INSERT
TO public
WITH CHECK (
  (auth.jwt() -> 'app_metadata' ->> 'is_super_admin')::boolean = true
);

CREATE POLICY "Superadmins can update player status"
ON public.player_status
FOR UPDATE
TO public
USING (
  (auth.jwt() -> 'app_metadata' ->> 'is_super_admin')::boolean = true
)
WITH CHECK (
  (auth.jwt() -> 'app_metadata' ->> 'is_super_admin')::boolean = true
);

CREATE POLICY "Superadmins can delete player status"
ON public.player_status
FOR DELETE
TO public
USING (
  (auth.jwt() -> 'app_metadata' ->> 'is_super_admin')::boolean = true
);

-- ============================================
-- team_status - Full CRUD for SUPERADMIN
-- ============================================

CREATE POLICY "Superadmins can insert team status"
ON public.team_status
FOR INSERT
TO public
WITH CHECK (
  (auth.jwt() -> 'app_metadata' ->> 'is_super_admin')::boolean = true
);

CREATE POLICY "Superadmins can update team status"
ON public.team_status
FOR UPDATE
TO public
USING (
  (auth.jwt() -> 'app_metadata' ->> 'is_super_admin')::boolean = true
)
WITH CHECK (
  (auth.jwt() -> 'app_metadata' ->> 'is_super_admin')::boolean = true
);

CREATE POLICY "Superadmins can delete team status"
ON public.team_status
FOR DELETE
TO public
USING (
  (auth.jwt() -> 'app_metadata' ->> 'is_super_admin')::boolean = true
);

-- ============================================
-- player_achievements - UPDATE, DELETE for SUPERADMIN (SELECT already exists)
-- ============================================

CREATE POLICY "Superadmins can update player achievements"
ON public.player_achievements
FOR UPDATE
TO public
USING (
  (auth.jwt() -> 'app_metadata' ->> 'is_super_admin')::boolean = true
)
WITH CHECK (
  (auth.jwt() -> 'app_metadata' ->> 'is_super_admin')::boolean = true
);

CREATE POLICY "Superadmins can delete player achievements"
ON public.player_achievements
FOR DELETE
TO public
USING (
  (auth.jwt() -> 'app_metadata' ->> 'is_super_admin')::boolean = true
);
