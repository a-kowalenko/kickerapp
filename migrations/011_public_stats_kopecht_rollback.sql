-- Rollback: Remove public stats RPC function
-- Schema: kopecht (development)

SET search_path TO kopecht;

-- Revoke permissions first
REVOKE EXECUTE ON FUNCTION kopecht.get_public_global_stats() FROM anon;
REVOKE EXECUTE ON FUNCTION kopecht.get_public_global_stats() FROM authenticated;

-- Drop the function
DROP FUNCTION IF EXISTS kopecht.get_public_global_stats();
