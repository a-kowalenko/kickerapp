-- Migration: Add timezone column to kicker table (kopecht schema)
-- Uses IANA timezone strings (e.g. 'Europe/Berlin') for automatic DST handling

-- Add timezone column to kopecht.kicker
ALTER TABLE kopecht.kicker 
ADD COLUMN IF NOT EXISTS timezone TEXT NOT NULL DEFAULT 'Europe/Berlin';

-- Add comment explaining the column
COMMENT ON COLUMN kopecht.kicker.timezone IS 'IANA timezone string (e.g. Europe/Berlin) for time-based achievement calculations';
