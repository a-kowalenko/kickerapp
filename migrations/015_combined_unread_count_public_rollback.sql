-- Rollback: Remove combined unread count functions

DROP FUNCTION IF EXISTS get_combined_unread_count_for_user(UUID);
DROP FUNCTION IF EXISTS get_combined_unread_count();
