-- Migration 055: Update duplicate_schema_tables to copy all triggers dynamically
-- This replaces hardcoded triggers with a dynamic approach that copies all user-defined triggers

CREATE OR REPLACE FUNCTION "public"."duplicate_schema_tables"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$DECLARE
  table_record RECORD;
  fk_record RECORD;
  column_list TEXT;
  column_select_list TEXT;
  primary_key_exists BOOLEAN;

  rec RECORD;
  seq_name TEXT;
  max_id_query TEXT;
  max_id_result BIGINT;

BEGIN
  -- Lösche alle existierenden Tabellen im 'kopecht' Schema
  FOR table_record IN SELECT table_name FROM information_schema.tables WHERE table_schema = 'kopecht'
  LOOP
    EXECUTE 'DROP TABLE IF EXISTS kopecht.' || quote_ident(table_record.table_name) || ' CASCADE';
  END LOOP;

  -- Kopiere die 'users' Tabelle von 'auth' nach 'kopecht', ohne generierte Spalten
  EXECUTE 'CREATE TABLE kopecht.users (LIKE auth.users INCLUDING ALL)';
  EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE kopecht.users';

  -- Generiere die Liste der Spalten ohne generierte Spalten
  SELECT string_agg(column_name, ', '), string_agg('auth.users.' || column_name, ', ')
  INTO column_list, column_select_list
  FROM information_schema.columns
  WHERE table_schema = 'auth' AND table_name = 'users' AND is_generated = 'NEVER';

  -- Führe das Kopieren der Daten ohne generierte Spalten durch
  EXECUTE 'INSERT INTO kopecht.users (' || column_list || ') SELECT ' || column_select_list || ' FROM auth.users ON CONFLICT DO NOTHING';

  -- Kopiere Tabellen von 'public' nach 'kopecht', einschließlich Standardwerte und Primärschlüssel
  FOR table_record IN SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
  LOOP
    EXECUTE 'CREATE TABLE kopecht.' || quote_ident(table_record.table_name) ||
            ' (LIKE public.' || quote_ident(table_record.table_name) || ' INCLUDING ALL)';
    -- Füge die Tabelle zur Realtime-Publikation hinzu
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE kopecht.' || quote_ident(table_record.table_name);

    -- Überprüfe, ob die Tabelle bereits einen Primärschlüssel hat
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.table_constraints
      WHERE table_schema = 'kopecht' AND table_name = table_record.table_name AND constraint_type = 'PRIMARY KEY'
    ) INTO primary_key_exists;

    IF NOT primary_key_exists THEN
      -- Finde den Primärschlüssel der Tabelle im 'public' Schema
      EXECUTE 'ALTER TABLE kopecht.' || quote_ident(table_record.table_name) ||
              ' ADD PRIMARY KEY (' || quote_ident(primary_key) || ')';
    END IF;

    -- Kopiere die Daten in die neue Tabelle
    EXECUTE 'INSERT INTO kopecht.' || quote_ident(table_record.table_name) ||
            ' SELECT * FROM public.' || quote_ident(table_record.table_name);
  END LOOP;

  -- Aktualisiere Fremdschlüssel-Beziehungen für alle Tabellen
  FOR fk_record IN SELECT tc.table_name, kcu.column_name, ccu.table_schema AS foreign_table_schema, ccu.table_name AS foreign_table_name, ccu.column_name AS foreign_column_name
    FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
    WHERE constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'
  LOOP
    IF fk_record.foreign_table_schema = 'public' THEN
      EXECUTE 'ALTER TABLE kopecht.' || quote_ident(fk_record.table_name) ||
              ' ADD CONSTRAINT ' || quote_ident(fk_record.table_name || '_' || fk_record.column_name || '_fkey') ||
              ' FOREIGN KEY (' || quote_ident(fk_record.column_name) || ')' ||
              ' REFERENCES kopecht.' || quote_ident(fk_record.foreign_table_name) || '(' || quote_ident(fk_record.foreign_column_name) || ')';
    END IF;
  END LOOP;


  -- Iteration über alle Tabellen im Schema 'kopecht'
  FOR rec IN SELECT * FROM information_schema.tables WHERE table_schema = 'kopecht'
  LOOP
    -- Bauen des Standard-Sequenznamens
    seq_name := rec.table_name || '_id_seq';
    
    -- Prüfen, ob die Sequenz existiert
    IF EXISTS (SELECT FROM pg_class WHERE relname = seq_name AND relkind = 'S') THEN
      
      -- Bauen des Queries, um die höchste ID in der aktuellen Tabelle zu finden
      max_id_query := 'SELECT COALESCE(MAX(id), 0) FROM kopecht.' || rec.table_name;
      
      -- Ausführen des Queries und Speichern des Ergebnisses
      EXECUTE max_id_query INTO max_id_result;
      
      -- Sequenz aktualisieren; Wenn keine IDs vorhanden, auf 1 setzen (false = nächster Wert ist 1)
      IF max_id_result = 0 THEN
        EXECUTE 'SELECT setval(''' || 'kopecht.' || seq_name || ''', 1, false)';
      ELSE
        EXECUTE 'SELECT setval(''' || 'kopecht.' || seq_name || ''', ' || max_id_result || ', true)';
      END IF;
    END IF;
  END LOOP;

  -- Kopiere alle User-definierten Trigger von public nach kopecht
  FOR rec IN 
    SELECT 
      t.tgname AS trigger_name,
      c.relname AS table_name,
      p.proname AS function_name,
      CASE 
        WHEN (t.tgtype & 2) > 0 THEN 'BEFORE'
        WHEN (t.tgtype & 64) > 0 THEN 'INSTEAD OF'
        ELSE 'AFTER'
      END AS trigger_timing,
      CASE t.tgtype & 1
        WHEN 1 THEN 'FOR EACH ROW'
        ELSE 'FOR EACH STATEMENT'
      END AS trigger_level,
      -- Build event string for INSERT/UPDATE/DELETE combinations
      CONCAT_WS(' OR ',
        CASE WHEN (t.tgtype & 4) > 0 THEN 'INSERT' END,
        CASE WHEN (t.tgtype & 8) > 0 THEN 'DELETE' END,
        CASE WHEN (t.tgtype & 16) > 0 THEN 'UPDATE' END,
        CASE WHEN (t.tgtype & 32) > 0 THEN 'TRUNCATE' END
      ) AS trigger_events
    FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    JOIN pg_proc p ON t.tgfoid = p.oid
    JOIN pg_namespace pn ON p.pronamespace = pn.oid
    WHERE n.nspname = 'public'
      AND NOT t.tgisinternal  -- Exclude system triggers (FK constraints etc.)
      AND c.relkind = 'r'     -- Only regular tables
      AND pn.nspname = 'public'  -- Only triggers using public schema functions
  LOOP
    -- Check if the corresponding function exists in kopecht schema
    IF EXISTS (
      SELECT 1 FROM pg_proc p 
      JOIN pg_namespace n ON p.pronamespace = n.oid 
      WHERE n.nspname = 'kopecht' AND p.proname = rec.function_name
    ) THEN
      -- Drop existing trigger if exists, then create new one
      EXECUTE 'DROP TRIGGER IF EXISTS ' || quote_ident(rec.trigger_name) || ' ON kopecht.' || quote_ident(rec.table_name);
      EXECUTE 'CREATE TRIGGER ' || quote_ident(rec.trigger_name) ||
              ' ' || rec.trigger_timing || ' ' || rec.trigger_events ||
              ' ON kopecht.' || quote_ident(rec.table_name) ||
              ' ' || rec.trigger_level ||
              ' EXECUTE FUNCTION kopecht.' || quote_ident(rec.function_name) || '()';
    END IF;
  END LOOP;

END;$$;
