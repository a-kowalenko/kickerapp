-- Migration: Fix grants for match_comment_read_status table
-- Adds missing table-level grants that were not included in the original migration

SET search_path TO kopecht;

-- Grant table-level permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON kopecht.match_comment_read_status TO authenticated;
GRANT USAGE ON SEQUENCE kopecht.match_comment_read_status_id_seq TO authenticated;
