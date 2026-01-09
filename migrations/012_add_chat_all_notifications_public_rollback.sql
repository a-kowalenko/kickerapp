-- Rollback: Remove chat_all notification type

SET search_path TO public;

-- 1. Drop the trigger
DROP TRIGGER IF EXISTS trigger_chat_all ON public.chat_messages;

-- 2. Drop the trigger function
DROP FUNCTION IF EXISTS public.trigger_create_chat_all_notifications();

-- 3. Delete existing chat_all notifications
DELETE FROM public.mention_notifications WHERE type = 'chat_all';

-- 4. Restore original type constraint
ALTER TABLE public.mention_notifications 
DROP CONSTRAINT IF EXISTS mention_notifications_type_check;

ALTER TABLE public.mention_notifications 
ADD CONSTRAINT mention_notifications_type_check 
CHECK (type IN ('comment', 'chat'));
