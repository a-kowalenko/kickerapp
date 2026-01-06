-- Migration 050: Fix RLS policies for achievement tables (kopecht schema)
-- The policies were using auth.role() = 'authenticated' which doesn't work correctly
-- Changed to use TRUE for select (public read) since achievements are not sensitive

SET search_path TO kopecht;

-- ============================================
-- FIX achievement_categories RLS policies
-- ============================================
DROP POLICY IF EXISTS "Authenticated users can view achievement categories" ON kopecht.achievement_categories;

CREATE POLICY "Anyone can view achievement categories"
    ON kopecht.achievement_categories FOR SELECT
    USING (TRUE);

-- ============================================
-- FIX achievement_definitions RLS policies  
-- ============================================
DROP POLICY IF EXISTS "Authenticated users can view achievement definitions" ON kopecht.achievement_definitions;

CREATE POLICY "Authenticated users can view achievement definitions"
    ON kopecht.achievement_definitions FOR SELECT
    USING (
        auth.uid() IS NOT NULL
        AND (
            is_hidden = FALSE
            OR EXISTS (
                SELECT 1 FROM kopecht.player_achievements pa
                JOIN kopecht.player p ON pa.player_id = p.id
                WHERE pa.achievement_id = achievement_definitions.id
                AND p.user_id = auth.uid()
            )
        )
    );

-- ============================================
-- GRANT permissions to ensure access
-- ============================================
GRANT SELECT ON kopecht.achievement_categories TO authenticated;
GRANT SELECT ON kopecht.achievement_categories TO anon;
GRANT SELECT ON kopecht.achievement_definitions TO authenticated;
GRANT SELECT ON kopecht.achievement_definitions TO anon;
