-- Rollback: Remove chat_all notification type

SET search_path TO kopecht;

-- 1. Drop the trigger
DROP TRIGGER IF EXISTS trigger_chat_all ON kopecht.chat_messages;

-- 2. Drop the trigger function
DROP FUNCTION IF EXISTS kopecht.trigger_create_chat_all_notifications();

-- 3. Delete existing chat_all notifications
DELETE FROM kopecht.mention_notifications WHERE type = 'chat_all';

-- 4. Restore original type constraint
ALTER TABLE kopecht.mention_notifications 
DROP CONSTRAINT IF EXISTS mention_notifications_type_check;

ALTER TABLE kopecht.mention_notifications 
ADD CONSTRAINT mention_notifications_type_check 
CHECK (type IN ('comment', 'chat'));
