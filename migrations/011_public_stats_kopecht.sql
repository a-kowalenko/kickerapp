-- Migration: Create secure public stats RPC function
-- Schema: kopecht (development)
-- 
-- This function returns only aggregated statistics with NO personally identifiable information.
-- Security considerations:
-- - No input parameters (prevents SQL injection)
-- - Only returns COUNT aggregates (no individual records)
-- - No user IDs, names, emails, or kicker IDs exposed
-- - SECURITY DEFINER allows bypassing RLS for aggregate queries
-- - Granted to 'anon' role for unauthenticated access

SET search_path TO kopecht;

-- Create the function
CREATE OR REPLACE FUNCTION kopecht.get_public_global_stats()
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
        (SELECT COUNT(*) FROM kopecht.matches) AS total_matches,
        (SELECT COUNT(*) FROM kopecht.player) AS total_players,
        (SELECT COUNT(*) FROM kopecht.goals) AS total_goals,
        (SELECT COUNT(*) FROM kopecht.kicker) AS total_kickers;
$$;

-- Add function comment for documentation
COMMENT ON FUNCTION kopecht.get_public_global_stats() IS 
'Returns aggregated platform statistics for public display on landing page. 
No authentication required. Returns only counts, no PII exposed.';

-- Grant execute permission to anonymous users (unauthenticated)
GRANT EXECUTE ON FUNCTION kopecht.get_public_global_stats() TO anon;

-- Grant execute permission to authenticated users as well
GRANT EXECUTE ON FUNCTION kopecht.get_public_global_stats() TO authenticated;
