-- ============================================
-- Rollback: Remove Season Announcement Seen Column
-- ============================================

ALTER TABLE kopecht.season_rankings
DROP COLUMN IF EXISTS season_announcement_seen;
