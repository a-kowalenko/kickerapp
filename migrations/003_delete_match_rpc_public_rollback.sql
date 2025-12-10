-- Rollback: 003_delete_match_rpc_public.sql
-- This script reverts the delete_match_with_recalculation RPC function for public schema (PRODUCTION)
-- This is a simple rollback since the migration only added a new function

SET search_path TO public;

-- Drop the delete_match_with_recalculation function
DROP FUNCTION IF EXISTS public.delete_match_with_recalculation(BIGINT, BIGINT, UUID);
