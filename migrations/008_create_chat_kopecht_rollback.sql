-- Rollback: Drop chat tables

SET search_path TO kopecht;

-- Remove from realtime publication
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS kopecht.chat_messages;
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS kopecht.chat_reactions;
ALTER PUBLICATION supabase_realtime DROP TABLE IF EXISTS kopecht.chat_typing;

-- Drop tables (order matters due to foreign keys)
DROP TABLE IF EXISTS kopecht.chat_typing;
DROP TABLE IF EXISTS kopecht.chat_reactions;
DROP TABLE IF EXISTS kopecht.chat_messages;
