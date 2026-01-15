-- Rollback: Remove public stats RPC function
-- Schema: public (production)

SET search_path TO public;

-- Revoke permissions first
REVOKE EXECUTE ON FUNCTION public.get_public_global_stats() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_public_global_stats() FROM authenticated;

-- Drop the function
DROP FUNCTION IF EXISTS public.get_public_global_stats();
