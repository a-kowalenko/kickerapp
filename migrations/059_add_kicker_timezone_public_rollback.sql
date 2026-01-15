-- Rollback: Remove timezone column from kicker table (public schema)

ALTER TABLE public.kicker DROP COLUMN IF EXISTS timezone;
