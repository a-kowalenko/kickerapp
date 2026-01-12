-- Rollback Migration 054: Remove fatality notification trigger (public schema)

SET search_path TO public;

-- 1. Drop trigger
DROP TRIGGER IF EXISTS trigger_fatality_notification ON public.matches;

-- 2. Drop trigger function
DROP FUNCTION IF EXISTS public.trigger_create_fatality_notifications();
