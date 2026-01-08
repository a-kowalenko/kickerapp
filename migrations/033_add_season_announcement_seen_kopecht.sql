-- ============================================
-- Migration: Add Season Announcement Seen Column
-- Tracks whether a player has seen the new season announcement
-- ============================================

ALTER TABLE kopecht.season_rankings
ADD COLUMN IF NOT EXISTS season_announcement_seen BOOLEAN DEFAULT FALSE;
