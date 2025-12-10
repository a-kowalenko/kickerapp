-- Trigger: before_match_insert
-- Table: public.matches
-- Event: BEFORE INSERT
-- Orientation: ROW
-- Function: assign_match_number()
-- Description: Auto-assigns incrementing match numbers per kicker

CREATE TRIGGER before_match_insert
    BEFORE INSERT ON public.matches
    FOR EACH ROW
    EXECUTE FUNCTION public.assign_match_number();
