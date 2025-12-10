-- Database Tables Index
-- This file lists all tables in dependency order for fresh database setup

-- 1. Base tables (no foreign key dependencies)
\i kicker.sql

-- 2. Tables with single FK dependency
\i player.sql

-- 3. Tables with multiple FK dependencies  
\i matches.sql
\i goals.sql
\i player_history.sql

-- Note: Run triggers after tables are created
-- See: ../triggers/
