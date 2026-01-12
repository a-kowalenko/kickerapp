-- Rollback Migration 054: Remove fatality notification trigger (kopecht schema)

SET search_path TO kopecht;

-- 1. Drop trigger
DROP TRIGGER IF EXISTS trigger_fatality_notification ON kopecht.matches;

-- 2. Drop trigger function
DROP FUNCTION IF EXISTS kopecht.trigger_create_fatality_notifications();
