-- Keep Speed Demon achievements triggered on GOAL_SCORED
-- The Edge Function now properly evaluates goals_in_timeframe by checking all goals in the match
-- This allows instant achievement unlock when the 3rd goal within 60s is scored

-- No trigger_event change needed - keep it as GOAL_SCORED for instant feedback

-- Reset any incorrectly awarded Speed Demon achievements (optional - can be run manually)
-- DELETE FROM kopecht.player_achievements 
-- WHERE achievement_id IN (
--     SELECT id FROM kopecht.achievement_definitions 
--     WHERE key IN ('hat_trick_speed_1on1', 'hat_trick_speed_2on2')
-- );
