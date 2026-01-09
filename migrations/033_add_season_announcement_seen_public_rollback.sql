-- ============================================
-- Rollback: Remove Season Announcement Seen Column
-- ============================================

ALTER TABLE public.season_rankings
DROP COLUMN IF EXISTS season_announcement_seen;
