-- Migration: Remove legacy duplicate mention triggers (public schema)
-- These triggers cause push notifications to be sent twice

-- Drop legacy triggers that directly call the edge function
DROP TRIGGER IF EXISTS notify_chat_mention ON public.chat_messages;
DROP TRIGGER IF EXISTS notify_comment_mention ON public.match_comments;

-- Drop the legacy function (no longer needed)
DROP FUNCTION IF EXISTS public.notify_mention();
