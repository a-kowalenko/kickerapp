-- Migration: Allow users to view achievement progress for all players in their kickers
-- This aligns with the policy on player_achievements table

-- Drop the restrictive policy that only allows viewing own progress
DROP POLICY IF EXISTS "Users can view their own achievement progress" ON kopecht.player_achievement_progress;

-- Create new policy that allows viewing progress for all players in the same kicker
CREATE POLICY "Users can view achievement progress for players in their kickers"
    ON kopecht.player_achievement_progress FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM kopecht.player p
            JOIN kopecht.player p2 ON p.kicker_id = p2.kicker_id
            WHERE p2.id = player_achievement_progress.player_id
            AND p.user_id = auth.uid()
        )
    );
