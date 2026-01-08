-- Rollback: Remove mention notifications system

-- 1. Drop triggers
DROP TRIGGER IF EXISTS trigger_comment_mentions ON match_comments;
DROP TRIGGER IF EXISTS trigger_chat_mentions ON chat_messages;

-- 2. Drop functions
DROP FUNCTION IF EXISTS trigger_create_comment_mention_notifications();
DROP FUNCTION IF EXISTS trigger_create_chat_mention_notifications();
DROP FUNCTION IF EXISTS create_mention_notifications(TEXT, VARCHAR, BIGINT, BIGINT, BIGINT, BIGINT);
DROP FUNCTION IF EXISTS mark_all_mentions_as_read();
DROP FUNCTION IF EXISTS mark_mention_as_read(BIGINT);
DROP FUNCTION IF EXISTS get_unread_mention_count();
DROP FUNCTION IF EXISTS get_mention_notifications(INT, INT);

-- 3. Drop RLS policies
DROP POLICY IF EXISTS "Users can delete own mention notifications" ON mention_notifications;
DROP POLICY IF EXISTS "Users can update own mention notifications" ON mention_notifications;
DROP POLICY IF EXISTS "Users can view own mention notifications" ON mention_notifications;

-- 4. Drop indexes
DROP INDEX IF EXISTS idx_mention_notifications_kicker_id;
DROP INDEX IF EXISTS idx_mention_notifications_created_at;
DROP INDEX IF EXISTS idx_mention_notifications_user_unread;
DROP INDEX IF EXISTS idx_mention_notifications_user_id;

-- 5. Drop table
DROP TABLE IF EXISTS mention_notifications;
