-- Migration: Add timezone column to kicker table
-- Uses IANA timezone strings (e.g. 'Europe/Berlin') for automatic DST handling

-- Add timezone column to public.kicker
ALTER TABLE public.kicker 
ADD COLUMN IF NOT EXISTS timezone TEXT NOT NULL DEFAULT 'Europe/Berlin';

-- Add comment explaining the column
COMMENT ON COLUMN public.kicker.timezone IS 'IANA timezone string (e.g. Europe/Berlin) for time-based achievement calculations';
