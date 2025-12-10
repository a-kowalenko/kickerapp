-- Rollback: 003_delete_match_rpc_kopecht.sql
-- This script reverts the delete_match_with_recalculation RPC function for kopecht schema
-- This is a simple rollback since the migration only added a new function

SET search_path TO kopecht;

-- Drop the delete_match_with_recalculation function
DROP FUNCTION IF EXISTS kopecht.delete_match_with_recalculation(BIGINT, BIGINT, UUID);
