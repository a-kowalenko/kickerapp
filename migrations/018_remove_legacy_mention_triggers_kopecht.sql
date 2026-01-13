-- Migration: Remove legacy duplicate mention triggers (kopecht schema)
-- These triggers cause push notifications to be sent twice

-- Drop legacy triggers that directly call the edge function
DROP TRIGGER IF EXISTS notify_chat_mention ON kopecht.chat_messages;
DROP TRIGGER IF EXISTS notify_comment_mention ON kopecht.match_comments;

-- Drop the legacy function (no longer needed)
DROP FUNCTION IF EXISTS kopecht.notify_mention();
