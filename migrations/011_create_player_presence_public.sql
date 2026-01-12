-- Migration: Create player_presence table for tracking online/offline status
-- This table stores the last_seen timestamp for each player to determine offline/inactive status

-- Create player_presence table
CREATE TABLE IF NOT EXISTS public.player_presence (
    player_id BIGINT PRIMARY KEY REFERENCES public.player(id) ON DELETE CASCADE,
    kicker_id BIGINT NOT NULL REFERENCES public.kicker(id) ON DELETE CASCADE,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for efficient queries by kicker
CREATE INDEX IF NOT EXISTS idx_player_presence_kicker_id ON public.player_presence(kicker_id);

-- Create index for efficient queries by last_seen (for inactive player queries)
CREATE INDEX IF NOT EXISTS idx_player_presence_last_seen ON public.player_presence(last_seen);

-- Enable RLS
ALTER TABLE public.player_presence ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to read all presence data
CREATE POLICY "Allow authenticated users to read presence"
    ON public.player_presence
    FOR SELECT
    TO authenticated
    USING (true);

-- Policy: Allow users to insert/update their own presence
CREATE POLICY "Allow users to upsert own presence"
    ON public.player_presence
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.player p
            WHERE p.id = player_id AND p.user_id = auth.uid()
        )
    );

CREATE POLICY "Allow users to update own presence"
    ON public.player_presence
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.player p
            WHERE p.id = player_id AND p.user_id = auth.uid()
        )
    );

-- Function to upsert player presence (called on disconnect/periodic update)
CREATE OR REPLACE FUNCTION public.upsert_player_presence(
    p_player_id BIGINT,
    p_kicker_id BIGINT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.player_presence (player_id, kicker_id, last_seen)
    VALUES (p_player_id, p_kicker_id, NOW())
    ON CONFLICT (player_id)
    DO UPDATE SET last_seen = NOW();
END;
$$;

-- Function to get players with their activity status for a kicker
-- Returns all players with their last_seen timestamp
CREATE OR REPLACE FUNCTION public.get_players_activity(p_kicker_id BIGINT)
RETURNS TABLE (
    player_id BIGINT,
    player_name TEXT,
    player_avatar TEXT,
    last_seen TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id as player_id,
        p.name as player_name,
        p.avatar as player_avatar,
        pp.last_seen
    FROM public.player p
    LEFT JOIN public.player_presence pp ON p.id = pp.player_id
    WHERE p.kicker_id = p_kicker_id
    ORDER BY pp.last_seen DESC NULLS LAST, p.name ASC;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.upsert_player_presence(BIGINT, BIGINT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_players_activity(BIGINT) TO authenticated;
