-- RLS Policies for public.matches
-- All policies check if user has a player in the same kicker

-- Enable RLS
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

-- SELECT Policy
CREATE POLICY "access_control_on_matches"
ON public.matches
AS PERMISSIVE
FOR SELECT
TO public
USING (
    EXISTS (
        SELECT 1
        FROM player
        WHERE player.kicker_id = matches.kicker_id 
          AND player.user_id = auth.uid()
    )
);

-- INSERT Policy
CREATE POLICY "insert_control_on_matches"
ON public.matches
AS PERMISSIVE
FOR INSERT
TO public
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM player
        WHERE player.kicker_id = matches.kicker_id 
          AND player.user_id = auth.uid()
    )
);

-- UPDATE Policy
CREATE POLICY "update_control_on_matches"
ON public.matches
AS PERMISSIVE
FOR UPDATE
TO public
USING (
    EXISTS (
        SELECT 1
        FROM player
        WHERE player.kicker_id = matches.kicker_id 
          AND player.user_id = auth.uid()
    )
);
