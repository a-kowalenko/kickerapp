-- Rollback: Drop user_permissions table and related functions

SET search_path TO kopecht;

-- Drop functions
DROP FUNCTION IF EXISTS kopecht.revoke_permission(UUID, BIGINT, TEXT);
DROP FUNCTION IF EXISTS kopecht.grant_permission(UUID, BIGINT, TEXT);
DROP FUNCTION IF EXISTS kopecht.get_kicker_permissions(BIGINT);
DROP FUNCTION IF EXISTS kopecht.get_user_permissions(UUID, BIGINT);
DROP FUNCTION IF EXISTS kopecht.has_permission(UUID, BIGINT, TEXT);

-- Drop table (this will also drop policies and indexes)
DROP TABLE IF EXISTS kopecht.user_permissions;
