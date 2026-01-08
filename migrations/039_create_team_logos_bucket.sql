-- Migration: Create team-logos storage bucket
-- This bucket stores team logo images

-- Create the bucket (run this in the Supabase SQL Editor)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'team-logos',
    'team-logos',
    true,  -- public bucket
    5242880,  -- 5MB file size limit
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Authenticated users can upload team logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update team logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete team logos" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for team logos" ON storage.objects;
DROP POLICY IF EXISTS "team-logos insert" ON storage.objects;
DROP POLICY IF EXISTS "team-logos update" ON storage.objects;
DROP POLICY IF EXISTS "team-logos delete" ON storage.objects;
DROP POLICY IF EXISTS "team-logos select" ON storage.objects;

-- Allow authenticated users to upload team logos
CREATE POLICY "team-logos insert"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'team-logos');

-- Allow authenticated users to update their team logos
CREATE POLICY "team-logos update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'team-logos')
WITH CHECK (bucket_id = 'team-logos');

-- Allow authenticated users to delete team logos
CREATE POLICY "team-logos delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'team-logos');

-- Allow public read access to team logos
CREATE POLICY "team-logos select"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'team-logos');
