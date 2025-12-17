-- Rollback: Remove comment_read_status table and related functions

SET search_path TO kopecht;

-- Drop functions
DROP FUNCTION IF EXISTS kopecht.update_comment_read_status(BIGINT);
DROP FUNCTION IF EXISTS kopecht.get_unread_comment_count_per_kicker();
DROP FUNCTION IF EXISTS kopecht.get_unread_comment_count(BIGINT);

-- Drop table (this will also drop indexes and policies)
DROP TABLE IF EXISTS kopecht.comment_read_status;
