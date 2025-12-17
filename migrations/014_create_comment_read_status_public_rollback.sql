-- Rollback: Remove comment_read_status table and related functions

SET search_path TO public;

-- Drop functions
DROP FUNCTION IF EXISTS update_comment_read_status(BIGINT);
DROP FUNCTION IF EXISTS get_unread_comment_count_per_kicker();
DROP FUNCTION IF EXISTS get_unread_comment_count(BIGINT);

-- Drop table (this will also drop indexes and policies)
DROP TABLE IF EXISTS comment_read_status;
