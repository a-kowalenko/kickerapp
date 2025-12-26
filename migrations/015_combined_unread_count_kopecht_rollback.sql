-- Rollback: Remove combined unread count functions

SET search_path TO kopecht;

DROP FUNCTION IF EXISTS kopecht.get_combined_unread_count_for_user(UUID);
DROP FUNCTION IF EXISTS kopecht.get_combined_unread_count();
