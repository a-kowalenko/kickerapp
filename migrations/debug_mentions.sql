-- Debug: Check why mentions and team_invites are not in mention_notifications

-- 1. Check all notification types in the table
SELECT type, COUNT(*) as count
FROM kopecht.mention_notifications
GROUP BY type
ORDER BY count DESC;

-- 2. Check if the trigger for chat mentions exists
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE event_object_schema = 'kopecht'
AND trigger_name LIKE '%mention%';

-- 3. Check if the trigger function for chat mentions exists
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'kopecht'
AND routine_name LIKE '%mention%';

-- 4. Check recent chat messages with @ mentions
SELECT id, content, player_id, kicker_id, created_at
FROM kopecht.chat_messages
WHERE content LIKE '%@%'
ORDER BY created_at DESC
LIMIT 5;

-- 5. Check recent match comments with @ mentions
SELECT id, content, player_id, match_id, kicker_id, created_at
FROM kopecht.match_comments
WHERE content LIKE '%@%'
ORDER BY created_at DESC
LIMIT 5;

-- 6. Check if team_invitations trigger exists
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE event_object_schema = 'kopecht'
AND event_object_table = 'team_invitations';

-- 7. Check recent team invitations
SELECT id, team_id, inviting_player_id, invited_player_id, status, created_at
FROM kopecht.team_invitations
ORDER BY created_at DESC
LIMIT 5;
