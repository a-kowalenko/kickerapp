-- Rollback: Remove match-specific comment read status tracking

-- Drop functions
DROP FUNCTION IF EXISTS update_match_comment_read_status(BIGINT);
DROP FUNCTION IF EXISTS get_unread_match_comment_count(BIGINT);

-- Drop table (this will also drop policies and indexes)
DROP TABLE IF EXISTS match_comment_read_status;
