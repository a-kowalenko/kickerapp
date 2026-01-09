-- Rollback: Remove rewards system tables
-- Schema: kopecht

-- Remove RPC functions
DROP FUNCTION IF EXISTS kopecht.update_player_selected_reward(BIGINT, TEXT, BIGINT);
DROP FUNCTION IF EXISTS kopecht.get_player_unlocked_rewards(BIGINT);
DROP FUNCTION IF EXISTS kopecht.get_player_with_rewards(BIGINT);

-- Remove policies
DROP POLICY IF EXISTS "player_selected_rewards_delete_policy" ON kopecht.player_selected_rewards;
DROP POLICY IF EXISTS "player_selected_rewards_update_policy" ON kopecht.player_selected_rewards;
DROP POLICY IF EXISTS "player_selected_rewards_insert_policy" ON kopecht.player_selected_rewards;
DROP POLICY IF EXISTS "player_selected_rewards_select_policy" ON kopecht.player_selected_rewards;
DROP POLICY IF EXISTS "reward_definitions_delete_policy" ON kopecht.reward_definitions;
DROP POLICY IF EXISTS "reward_definitions_update_policy" ON kopecht.reward_definitions;
DROP POLICY IF EXISTS "reward_definitions_insert_policy" ON kopecht.reward_definitions;
DROP POLICY IF EXISTS "reward_definitions_select_policy" ON kopecht.reward_definitions;

-- Remove indexes
DROP INDEX IF EXISTS kopecht.idx_player_selected_rewards_player;
DROP INDEX IF EXISTS kopecht.idx_reward_definitions_achievement;
DROP INDEX IF EXISTS kopecht.idx_reward_definitions_type;

-- Remove tables (order matters for foreign keys)
DROP TABLE IF EXISTS kopecht.player_selected_rewards;
DROP TABLE IF EXISTS kopecht.reward_definitions;
