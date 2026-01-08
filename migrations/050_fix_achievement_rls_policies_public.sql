-- Migration 050: Fix RLS policies for achievement tables (public schema)
-- The policies were using auth.role() = 'authenticated' which doesn't work correctly
-- Changed to use TRUE for select (public read) since achievements are not sensitive

SET search_path TO public;

-- ============================================
-- FIX achievement_categories RLS policies
-- ============================================
DROP POLICY IF EXISTS "Authenticated users can view achievement categories" ON public.achievement_categories;

CREATE POLICY "Anyone can view achievement categories"
    ON public.achievement_categories FOR SELECT
    USING (TRUE);

-- ============================================
-- FIX achievement_definitions RLS policies  
-- ============================================
DROP POLICY IF EXISTS "Authenticated users can view achievement definitions" ON public.achievement_definitions;

CREATE POLICY "Authenticated users can view achievement definitions"
    ON public.achievement_definitions FOR SELECT
    USING (
        auth.uid() IS NOT NULL
        AND (
            is_hidden = FALSE
            OR EXISTS (
                SELECT 1 FROM public.player_achievements pa
                JOIN public.player p ON pa.player_id = p.id
                WHERE pa.achievement_id = achievement_definitions.id
                AND p.user_id = auth.uid()
            )
        )
    );

-- ============================================
-- GRANT permissions to ensure access
-- ============================================
GRANT SELECT ON public.achievement_categories TO authenticated;
GRANT SELECT ON public.achievement_categories TO anon;
GRANT SELECT ON public.achievement_definitions TO authenticated;
GRANT SELECT ON public.achievement_definitions TO anon;
