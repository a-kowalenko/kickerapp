-- Rollback: Remove timezone column from kicker table (kopecht schema)

ALTER TABLE kopecht.kicker DROP COLUMN IF EXISTS timezone;
