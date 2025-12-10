-- Function: public.assign_match_number()
-- Description: Trigger function to auto-increment match numbers per kicker
-- Type: Trigger Function
-- Security: Invoker

CREATE OR REPLACE FUNCTION public.assign_match_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.nr := (
        SELECT COALESCE(MAX(nr), 0) + 1 
        FROM matches 
        WHERE kicker_id = NEW.kicker_id
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
