-- Rollback: Drop chat_read_status table and functions

SET search_path TO kopecht;

-- Remove from realtime publication
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS kopecht.chat_read_status;

-- Drop functions
DROP FUNCTION IF EXISTS kopecht.get_unread_count_for_user(UUID);
DROP FUNCTION IF EXISTS kopecht.get_total_unread_count();
DROP FUNCTION IF EXISTS kopecht.get_unread_count_per_kicker();
DROP FUNCTION IF EXISTS kopecht.update_chat_read_status(BIGINT);

-- Drop table
DROP TABLE IF EXISTS kopecht.chat_read_status;
