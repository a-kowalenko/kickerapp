-- Rollback: Remove notification preferences from push_subscriptions table

SET search_path TO public;

-- 1. Drop RPC functions
DROP FUNCTION IF EXISTS public.update_notification_preferences(BIGINT, BOOLEAN, BOOLEAN, BOOLEAN);
DROP FUNCTION IF EXISTS public.delete_push_subscription(BIGINT);

-- 2. Remove notification preference columns
ALTER TABLE public.push_subscriptions
DROP COLUMN IF EXISTS notify_all_chat,
DROP COLUMN IF EXISTS notify_mentions,
DROP COLUMN IF EXISTS notify_team_invites;
