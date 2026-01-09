-- Migration: Add RLS policies for kopecht.matches table
-- These policies allow users to interact with matches if they have a player in the same kicker

SET search_path TO kopecht;

-- Ensure RLS is enabled
ALTER TABLE kopecht.matches ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any (to avoid conflicts)
DROP POLICY IF EXISTS "access_control_on_matches" ON kopecht.matches;
DROP POLICY IF EXISTS "insert_control_on_matches" ON kopecht.matches;
DROP POLICY IF EXISTS "update_control_on_matches" ON kopecht.matches;
DROP POLICY IF EXISTS "delete_control_on_matches" ON kopecht.matches;

-- SELECT Policy - Allow users to read matches from their kicker
CREATE POLICY "access_control_on_matches"
ON kopecht.matches
AS PERMISSIVE
FOR SELECT
TO public
USING (
    EXISTS (
        SELECT 1
        FROM kopecht.player
        WHERE player.kicker_id = matches.kicker_id 
          AND player.user_id = auth.uid()
    )
);

-- INSERT Policy - Allow users to create matches in their kicker
CREATE POLICY "insert_control_on_matches"
ON kopecht.matches
AS PERMISSIVE
FOR INSERT
TO public
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM kopecht.player
        WHERE player.kicker_id = matches.kicker_id 
          AND player.user_id = auth.uid()
    )
);

-- UPDATE Policy - Allow users to update matches in their kicker
CREATE POLICY "update_control_on_matches"
ON kopecht.matches
AS PERMISSIVE
FOR UPDATE
TO public
USING (
    EXISTS (
        SELECT 1
        FROM kopecht.player
        WHERE player.kicker_id = matches.kicker_id 
          AND player.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM kopecht.player
        WHERE player.kicker_id = matches.kicker_id 
          AND player.user_id = auth.uid()
    )
);

-- DELETE Policy - Allow users to delete matches in their kicker
CREATE POLICY "delete_control_on_matches"
ON kopecht.matches
AS PERMISSIVE
FOR DELETE
TO public
USING (
    EXISTS (
        SELECT 1
        FROM kopecht.player
        WHERE player.kicker_id = matches.kicker_id 
          AND player.user_id = auth.uid()
    )
);

-- Grant table-level permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON kopecht.matches TO authenticated;
GRANT USAGE ON SEQUENCE kopecht.matches_id_seq TO authenticated;
