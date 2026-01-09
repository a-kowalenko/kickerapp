-- Debug Script: Check why push notifications are not working
-- Run this in the Supabase SQL Editor

-- 1. Check if trigger exists
SELECT 'TRIGGER CHECK' as check_type, 
       trigger_name, 
       event_object_schema, 
       event_object_table
FROM information_schema.triggers
WHERE event_object_schema = 'kopecht'
AND event_object_table = 'mention_notifications';

-- 2. Check if pg_net extension is enabled
SELECT 'PG_NET EXTENSION' as check_type, extname, extversion 
FROM pg_extension 
WHERE extname = 'pg_net';

-- 3. Check if vault secrets exist (without showing values)
SELECT 'VAULT SECRETS' as check_type, name, 
       CASE WHEN decrypted_secret IS NOT NULL THEN 'EXISTS' ELSE 'MISSING' END as status
FROM vault.decrypted_secrets 
WHERE name IN ('supabase_url', 'service_role_key');

-- 4. Check recent HTTP requests made by pg_net (last 10)
SELECT 'HTTP REQUESTS' as check_type, id, status_code, created 
FROM net._http_response 
ORDER BY created DESC 
LIMIT 10;

-- 5. Check if the trigger function exists
SELECT 'TRIGGER FUNCTION' as check_type, 
       routine_schema, 
       routine_name
FROM information_schema.routines
WHERE routine_schema = 'kopecht'
AND routine_name = 'trigger_send_push_notification';

-- 6. Check recent mention_notifications (to confirm data is being inserted)
SELECT 'RECENT NOTIFICATIONS' as check_type, id, type, user_id, created_at
FROM kopecht.mention_notifications
ORDER BY created_at DESC
LIMIT 5;
