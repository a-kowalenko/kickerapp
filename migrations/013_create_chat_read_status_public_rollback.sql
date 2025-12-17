-- Rollback: Drop chat_read_status table and functions

SET search_path TO public;

-- Remove from realtime publication
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS chat_read_status;

-- Drop functions
DROP FUNCTION IF EXISTS get_unread_count_for_user(UUID);
DROP FUNCTION IF EXISTS get_total_unread_count();
DROP FUNCTION IF EXISTS get_unread_count_per_kicker();
DROP FUNCTION IF EXISTS update_chat_read_status(BIGINT);

-- Drop table
DROP TABLE IF EXISTS chat_read_status;
