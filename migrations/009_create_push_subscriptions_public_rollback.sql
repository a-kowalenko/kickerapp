-- Rollback: Drop push_subscriptions table

SET search_path TO public;

-- Remove from realtime publication
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS push_subscriptions;

-- Drop trigger
DROP TRIGGER IF EXISTS trigger_update_push_subscription_updated_at ON push_subscriptions;

-- Drop function
DROP FUNCTION IF EXISTS update_push_subscription_updated_at();

-- Drop policies
DROP POLICY IF EXISTS "Users can view own push subscriptions" ON push_subscriptions;
DROP POLICY IF EXISTS "Users can insert own push subscriptions" ON push_subscriptions;
DROP POLICY IF EXISTS "Users can update own push subscriptions" ON push_subscriptions;
DROP POLICY IF EXISTS "Users can delete own push subscriptions" ON push_subscriptions;

-- Drop table
DROP TABLE IF EXISTS push_subscriptions;
