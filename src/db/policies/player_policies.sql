-- RLS Policies for public.player
-- Open read access for all users

-- Enable RLS
ALTER TABLE public.player ENABLE ROW LEVEL SECURITY;

-- SELECT/ALL Policy - Open access
CREATE POLICY "Enable read access for all users"
ON public.player
AS PERMISSIVE
FOR ALL
TO public
USING (true)
WITH CHECK (true);
