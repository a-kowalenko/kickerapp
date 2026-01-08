-- Migration: Add RLS policies for kopecht.team_history table
-- These policies allow users to interact with team_history if they have a player in the same kicker

SET search_path TO kopecht;

-- Ensure RLS is enabled
ALTER TABLE kopecht.team_history ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any (to avoid conflicts)
DROP POLICY IF EXISTS "Team history is viewable by everyone" ON kopecht.team_history;
DROP POLICY IF EXISTS "access_control_on_team_history" ON kopecht.team_history;
DROP POLICY IF EXISTS "insert_control_on_team_history" ON kopecht.team_history;
DROP POLICY IF EXISTS "update_control_on_team_history" ON kopecht.team_history;
DROP POLICY IF EXISTS "delete_control_on_team_history" ON kopecht.team_history;

-- SELECT Policy - Allow users to read team_history from their kicker
CREATE POLICY "access_control_on_team_history"
ON kopecht.team_history
AS PERMISSIVE
FOR SELECT
TO public
USING (
    EXISTS (
        SELECT 1
        FROM kopecht.teams t
        JOIN kopecht.player p ON p.kicker_id = t.kicker_id
        WHERE t.id = team_history.team_id 
          AND p.user_id = auth.uid()
    )
);

-- INSERT Policy - Allow users to create team_history in their kicker
CREATE POLICY "insert_control_on_team_history"
ON kopecht.team_history
AS PERMISSIVE
FOR INSERT
TO public
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM kopecht.teams t
        JOIN kopecht.player p ON p.kicker_id = t.kicker_id
        WHERE t.id = team_history.team_id 
          AND p.user_id = auth.uid()
    )
);

-- UPDATE Policy - Allow users to update team_history in their kicker
CREATE POLICY "update_control_on_team_history"
ON kopecht.team_history
AS PERMISSIVE
FOR UPDATE
TO public
USING (
    EXISTS (
        SELECT 1
        FROM kopecht.teams t
        JOIN kopecht.player p ON p.kicker_id = t.kicker_id
        WHERE t.id = team_history.team_id 
          AND p.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM kopecht.teams t
        JOIN kopecht.player p ON p.kicker_id = t.kicker_id
        WHERE t.id = team_history.team_id 
          AND p.user_id = auth.uid()
    )
);

-- DELETE Policy - Allow users to delete team_history in their kicker
CREATE POLICY "delete_control_on_team_history"
ON kopecht.team_history
AS PERMISSIVE
FOR DELETE
TO public
USING (
    EXISTS (
        SELECT 1
        FROM kopecht.teams t
        JOIN kopecht.player p ON p.kicker_id = t.kicker_id
        WHERE t.id = team_history.team_id 
          AND p.user_id = auth.uid()
    )
);

-- Grant table-level permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON kopecht.team_history TO authenticated;
GRANT USAGE ON SEQUENCE kopecht.team_history_id_seq TO authenticated;
