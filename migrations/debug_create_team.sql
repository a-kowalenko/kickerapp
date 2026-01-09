-- Debug: Check team table and create_team_with_invitation function

-- 1. Check if team table exists and in which schema
SELECT table_schema, table_name 
FROM information_schema.tables 
WHERE table_name = 'team'
ORDER BY table_schema;

-- 2. Check the create_team_with_invitation function definition
SELECT routine_schema, routine_name, routine_definition
FROM information_schema.routines
WHERE routine_name = 'create_team_with_invitation';

-- 3. Check search_path for functions
SELECT n.nspname as schema, p.proname as function, p.prosrc
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'create_team_with_invitation';
