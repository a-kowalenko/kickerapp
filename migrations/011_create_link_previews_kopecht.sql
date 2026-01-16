-- Migration: Create link_previews table for caching OpenGraph data
-- Schema: kopecht

SET search_path TO kopecht;

-- Link previews cache table
CREATE TABLE IF NOT EXISTS kopecht.link_previews (
    id SERIAL PRIMARY KEY,
    url TEXT UNIQUE NOT NULL,
    title TEXT,
    description TEXT,
    image TEXT,
    site_name TEXT,
    favicon TEXT,
    fetched_at TIMESTAMPTZ DEFAULT NOW(),
    error BOOLEAN DEFAULT FALSE,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast URL lookups
CREATE INDEX IF NOT EXISTS idx_link_previews_url ON kopecht.link_previews(url);

-- Index for cleanup of old entries
CREATE INDEX IF NOT EXISTS idx_link_previews_fetched_at ON kopecht.link_previews(fetched_at);

-- Enable RLS
ALTER TABLE kopecht.link_previews ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read link previews (public cache)
CREATE POLICY "Link previews are publicly readable"
    ON kopecht.link_previews
    FOR SELECT
    TO authenticated, anon
    USING (true);

-- Only service role can insert/update (edge function)
CREATE POLICY "Service role can manage link previews"
    ON kopecht.link_previews
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Function to clean up old link previews (older than 30 days)
CREATE OR REPLACE FUNCTION kopecht.cleanup_old_link_previews()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM kopecht.link_previews
    WHERE fetched_at < NOW() - INTERVAL '30 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE kopecht.link_previews IS 'Cache for OpenGraph link preview data';
