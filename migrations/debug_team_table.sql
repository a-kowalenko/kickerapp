-- Debug: Check team-related tables and functions

-- 1. Check if team table exists in kopecht schema
SELECT table_schema, table_name 
FROM information_schema.tables 
WHERE table_name = 'team';

-- 2. Check if create_team_with_invitation function exists
SELECT routine_schema, routine_name
FROM information_schema.routines
WHERE routine_name = 'create_team_with_invitation';

-- 3. List all tables in kopecht schema
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'kopecht'
ORDER BY table_name;
