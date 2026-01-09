-- Rollback: Remove match-specific comment read status tracking

SET search_path TO kopecht;

-- Drop functions
DROP FUNCTION IF EXISTS kopecht.update_match_comment_read_status(BIGINT);
DROP FUNCTION IF EXISTS kopecht.get_unread_match_comment_count(BIGINT);

-- Drop table (this will also drop policies and indexes)
DROP TABLE IF EXISTS kopecht.match_comment_read_status;
