-- Rollback: Drop match_comments, match_reactions, and comment_reactions tables (kopecht schema)

SET search_path TO kopecht;

-- 1. Remove from realtime publication
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS kopecht.match_comments;
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS kopecht.match_reactions;
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS kopecht.comment_reactions;

-- 2. Drop RLS policies for comment_reactions
DROP POLICY IF EXISTS "Users can delete own comment reactions" ON kopecht.comment_reactions;
DROP POLICY IF EXISTS "Users can insert comment reactions" ON kopecht.comment_reactions;
DROP POLICY IF EXISTS "Users can view comment reactions" ON kopecht.comment_reactions;

-- 3. Drop RLS policies for match_reactions
DROP POLICY IF EXISTS "Users can delete own match reactions" ON kopecht.match_reactions;
DROP POLICY IF EXISTS "Users can insert match reactions" ON kopecht.match_reactions;
DROP POLICY IF EXISTS "Users can view match reactions" ON kopecht.match_reactions;

-- 4. Drop RLS policies for match_comments
DROP POLICY IF EXISTS "Admins can delete comments" ON kopecht.match_comments;
DROP POLICY IF EXISTS "Users can update own comments" ON kopecht.match_comments;
DROP POLICY IF EXISTS "Users can insert comments" ON kopecht.match_comments;
DROP POLICY IF EXISTS "Users can view comments for their kickers" ON kopecht.match_comments;

-- 5. Drop indexes
DROP INDEX IF EXISTS kopecht.idx_comment_reactions_player_id;
DROP INDEX IF EXISTS kopecht.idx_comment_reactions_comment_id;
DROP INDEX IF EXISTS kopecht.idx_match_reactions_player_id;
DROP INDEX IF EXISTS kopecht.idx_match_reactions_match_id;
DROP INDEX IF EXISTS kopecht.idx_match_comments_created_at;
DROP INDEX IF EXISTS kopecht.idx_match_comments_kicker_id;
DROP INDEX IF EXISTS kopecht.idx_match_comments_player_id;
DROP INDEX IF EXISTS kopecht.idx_match_comments_match_id;

-- 6. Drop tables (order matters due to foreign keys)
DROP TABLE IF EXISTS kopecht.comment_reactions;
DROP TABLE IF EXISTS kopecht.match_reactions;
DROP TABLE IF EXISTS kopecht.match_comments;
