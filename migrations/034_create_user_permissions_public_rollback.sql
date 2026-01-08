-- Rollback: Drop user_permissions table and related functions

SET search_path TO public;

-- Drop functions
DROP FUNCTION IF EXISTS public.revoke_permission(UUID, BIGINT, TEXT);
DROP FUNCTION IF EXISTS public.grant_permission(UUID, BIGINT, TEXT);
DROP FUNCTION IF EXISTS public.get_kicker_permissions(BIGINT);
DROP FUNCTION IF EXISTS public.get_user_permissions(UUID, BIGINT);
DROP FUNCTION IF EXISTS public.has_permission(UUID, BIGINT, TEXT);

-- Drop table (this will also drop policies and indexes)
DROP TABLE IF EXISTS public.user_permissions;
