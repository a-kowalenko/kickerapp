-- Rollback: Drop chat tables

SET search_path TO public;

-- Remove from realtime publication
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS chat_messages;
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS chat_reactions;
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS chat_typing;

-- Drop tables (order matters due to foreign keys)
DROP TABLE IF EXISTS chat_typing;
DROP TABLE IF EXISTS chat_reactions;
DROP TABLE IF EXISTS chat_messages;
