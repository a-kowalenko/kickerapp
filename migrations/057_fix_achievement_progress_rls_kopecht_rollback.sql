-- Rollback: Revert to restrictive policy that only allows viewing own achievement progress

-- Drop the kicker-wide policy
DROP POLICY IF EXISTS "Users can view achievement progress for players in their kickers" ON kopecht.player_achievement_progress;

-- Restore the original restrictive policy
CREATE POLICY "Users can view their own achievement progress" 
    ON kopecht.player_achievement_progress FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM kopecht.player p
            WHERE p.id = player_achievement_progress.player_id
            AND p.user_id = auth.uid()
        )
    );
