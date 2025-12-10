-- Function: public.increment_nr()
-- Description: Trigger function to auto-increment season numbers per kicker
-- Type: Trigger Function
-- Security: Invoker
--
-- ⚠️ DEPRECATED: This function references the old 'season' table which has been deleted.
-- Will be replaced by new seasons functionality in migration 001_create_seasons.
-- TODO: Remove this function after seasons migration is complete.

CREATE OR REPLACE FUNCTION public.increment_nr()
RETURNS TRIGGER AS $$
BEGIN
    NEW.nr := COALESCE(
        (SELECT MAX(nr) FROM season WHERE kicker_id = NEW.kicker_id) + 1,
        1
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
