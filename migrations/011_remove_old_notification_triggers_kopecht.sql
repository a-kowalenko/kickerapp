-- Migration: Remove old pg_net notification triggers
-- Run this if you have old triggers that cause errors

-- Drop triggers if they exist
DROP TRIGGER IF EXISTS on_comment_insert_notify ON kopecht.match_comments;
DROP TRIGGER IF EXISTS on_chat_message_insert_notify ON kopecht.chat_messages;

-- Drop functions if they exist
DROP FUNCTION IF EXISTS kopecht.notify_comment_mention();
DROP FUNCTION IF EXISTS kopecht.notify_chat_mention();
DROP FUNCTION IF EXISTS kopecht.handle_comment_notification();
DROP FUNCTION IF EXISTS kopecht.handle_chat_notification();
