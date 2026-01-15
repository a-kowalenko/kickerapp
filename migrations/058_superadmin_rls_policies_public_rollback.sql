-- Rollback: Remove SUPERADMIN RLS policies (public schema)

DROP POLICY IF EXISTS "Superadmins can insert achievement progress" ON public.player_achievement_progress;
DROP POLICY IF EXISTS "Superadmins can update achievement progress" ON public.player_achievement_progress;
DROP POLICY IF EXISTS "Superadmins can delete achievement progress" ON public.player_achievement_progress;

DROP POLICY IF EXISTS "Superadmins can insert achievement definitions" ON public.achievement_definitions;
DROP POLICY IF EXISTS "Superadmins can update achievement definitions" ON public.achievement_definitions;
DROP POLICY IF EXISTS "Superadmins can delete achievement definitions" ON public.achievement_definitions;

DROP POLICY IF EXISTS "Superadmins can insert achievement categories" ON public.achievement_categories;
DROP POLICY IF EXISTS "Superadmins can update achievement categories" ON public.achievement_categories;
DROP POLICY IF EXISTS "Superadmins can delete achievement categories" ON public.achievement_categories;

DROP POLICY IF EXISTS "Superadmins can insert reward definitions" ON public.reward_definitions;
DROP POLICY IF EXISTS "Superadmins can update reward definitions" ON public.reward_definitions;
DROP POLICY IF EXISTS "Superadmins can delete reward definitions" ON public.reward_definitions;

DROP POLICY IF EXISTS "Superadmins can insert player status" ON public.player_status;
DROP POLICY IF EXISTS "Superadmins can update player status" ON public.player_status;
DROP POLICY IF EXISTS "Superadmins can delete player status" ON public.player_status;

DROP POLICY IF EXISTS "Superadmins can insert team status" ON public.team_status;
DROP POLICY IF EXISTS "Superadmins can update team status" ON public.team_status;
DROP POLICY IF EXISTS "Superadmins can delete team status" ON public.team_status;

DROP POLICY IF EXISTS "Superadmins can update player achievements" ON public.player_achievements;
DROP POLICY IF EXISTS "Superadmins can delete player achievements" ON public.player_achievements;
