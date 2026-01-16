-- Migration: Create secure public stats RPC function
-- Schema: public (production)
-- 
-- This function returns only aggregated statistics with NO personally identifiable information.
-- Security considerations:
-- - No input parameters (prevents SQL injection)
-- - Only returns COUNT aggregates (no individual records)
-- - No user IDs, names, emails, or kicker IDs exposed
-- - SECURITY DEFINER allows bypassing RLS for aggregate queries
-- - Granted to 'anon' role for unauthenticated access

SET search_path TO public;

-- Create the function
CREATE OR REPLACE FUNCTION public.get_public_global_stats()
RETURNS TABLE (
    total_matches BIGINT,
    total_players BIGINT,
    total_goals BIGINT,
    total_kickers BIGINT
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT 
        (SELECT COUNT(*) FROM public.matches) AS total_matches,
        (SELECT COUNT(*) FROM public.player) AS total_players,
        (SELECT COUNT(*) FROM public.goals) AS total_goals,
        (SELECT COUNT(*) FROM public.kicker) AS total_kickers;
$$;

-- Add function comment for documentation
COMMENT ON FUNCTION public.get_public_global_stats() IS 
'Returns aggregated platform statistics for public display on landing page. 
No authentication required. Returns only counts, no PII exposed.';

-- Grant execute permission to anonymous users (unauthenticated)
GRANT EXECUTE ON FUNCTION public.get_public_global_stats() TO anon;

-- Grant execute permission to authenticated users as well
GRANT EXECUTE ON FUNCTION public.get_public_global_stats() TO authenticated;
