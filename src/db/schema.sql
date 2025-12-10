

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';


SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."player" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" "text" DEFAULT '""'::"text" NOT NULL,
    "wins" bigint DEFAULT '0'::bigint NOT NULL,
    "losses" bigint DEFAULT '0'::bigint NOT NULL,
    "mmr" bigint DEFAULT '1000'::bigint NOT NULL,
    "avatar" "text",
    "user_id" "uuid" NOT NULL,
    "mmr2on2" bigint DEFAULT '1000'::bigint NOT NULL,
    "wins2on2" bigint DEFAULT '0'::bigint NOT NULL,
    "losses2on2" bigint DEFAULT '0'::bigint NOT NULL,
    "kicker_id" bigint NOT NULL
);


ALTER TABLE "public"."player" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."assign_match_number"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.nr := (
        SELECT COALESCE(MAX(nr), 0) + 1 
        FROM matches 
        WHERE kicker_id = NEW.kicker_id
    );
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."assign_match_number"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."duplicate_schema_tables"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
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
      
      -- Sequenz aktualisieren; Wenn keine IDs vorhanden, auf 1 setzen
      EXECUTE 'SELECT setval(''' || 'kopecht.' || seq_name || ''', ' || max_id_result || ', true)';
    END IF;
  END LOOP;

  -- Erstellt einen Trigger, der vor dem Einfügen in die Tabelle 'matches' im Schema 'kopecht'
  -- die Funktion 'assign_match_number' ausführt. Dieser Trigger wird für jede eingefügte Zeile aktiviert.
  CREATE TRIGGER before_insert_matches
  BEFORE INSERT ON kopecht.matches
  FOR EACH ROW
  EXECUTE FUNCTION kopecht.assign_match_number();

  CREATE TRIGGER trigger_increment_nr
  BEFORE INSERT ON kopecht.season
  FOR EACH ROW 
  EXECUTE FUNCTION kopecht.increment_nr();

END;
$$;


ALTER FUNCTION "public"."duplicate_schema_tables"() OWNER TO "postgres";


CREATE PROCEDURE "public"."fillgoalsfrommatches"()
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    cur_record RECORD;
    i INT;
BEGIN
    FOR cur_record IN SELECT m.id, m.player1, m.player2, m.kicker_id, m."scoreTeam1", m."scoreTeam2"
                      FROM public.matches m
                      LEFT JOIN public.goals g ON m.id = g.match_id
                      WHERE g.match_id IS NULL AND m.gamemode = '1on1'
                      ORDER BY m.created_at DESC
    LOOP
        -- Für Team 1
        FOR i IN 1..cur_record."scoreTeam1"
        LOOP
            INSERT INTO public.goals (match_id, player_id, kicker_id, team, goal_type, amount)
            VALUES (cur_record.id, cur_record.player1, cur_record.kicker_id, 1, 'generated_goal', 1);
        END LOOP;

        -- Für Team 2
        FOR i IN 1..cur_record."scoreTeam2"
        LOOP
            INSERT INTO public.goals (match_id, player_id, kicker_id, team, goal_type, amount)
            VALUES (cur_record.id, cur_record.player2, cur_record.kicker_id, 2, 'generated_goal', 1);
        END LOOP;
    END LOOP;
END;
$$;


ALTER PROCEDURE "public"."fillgoalsfrommatches"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_player_match_count"("matchestable" "regclass", "playertable" "regclass") RETURNS TABLE("id" integer, "name" "text", "match_count" integer)
    LANGUAGE "plpgsql"
    AS $_$
BEGIN
    RETURN QUERY EXECUTE format($f$
        SELECT p.id, p.name, COALESCE(sum(cnt), 0) as match_count
        FROM %s p
        LEFT JOIN (
            SELECT player1 as player_id, count(*) as cnt FROM %s GROUP BY player1
            UNION ALL
            SELECT player2 as player_id, count(*) as cnt FROM %s GROUP BY player2
            UNION ALL
            SELECT player3 as player_id, count(*) FROM %s WHERE player3 IS NOT NULL GROUP BY player3
            UNION ALL
            SELECT player4 as player_id, count(*) FROM %s WHERE player4 IS NOT NULL GROUP BY player4
        ) AS subquery ON p.id = subquery.player_id
        GROUP BY p.id, p.name
        ORDER BY match_count DESC
    $f$, playerTable, matchesTable, matchesTable, matchesTable, matchesTable);
END;
$_$;


ALTER FUNCTION "public"."get_player_match_count"("matchestable" "regclass", "playertable" "regclass") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_player_match_count"("matchestable" "text", "playertable" "text") RETURNS TABLE("id" integer, "name" "text", "match_count" integer)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY EXECUTE
    'SELECT p.id, p.name, COALESCE(sum(sub.cnt), 0) as match_count
    FROM ' || quote_ident(playerTable) || ' p
    LEFT JOIN (
        SELECT player1 as player_id, count(*) as cnt FROM ' || quote_ident(matchesTable) || ' GROUP BY player1
        UNION ALL
        SELECT player2 as player_id, count(*) as cnt FROM ' || quote_ident(matchesTable) || ' GROUP BY player2
        UNION ALL
        SELECT player3 as player_id, count(*) as cnt FROM ' || quote_ident(matchesTable) || ' WHERE player3 IS NOT NULL GROUP BY player3
        UNION ALL
        SELECT player4 as player_id, count(*) as cnt FROM ' || quote_ident(matchesTable) || ' WHERE player4 IS NOT NULL GROUP BY player4
    ) sub ON p.id = sub.player_id
    GROUP BY p.id, p.name
    ORDER BY match_count DESC';
END;
$$;


ALTER FUNCTION "public"."get_player_match_count"("matchestable" "text", "playertable" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_player_match_counts"() RETURNS TABLE("id" integer, "name" "text", "match_count" integer)
    LANGUAGE "sql"
    AS $$
    SELECT p.id, p.name, COALESCE(sum(cnt), 0) as match_count
    FROM player p
    LEFT JOIN (
        SELECT player1 as player_id, count(*) as cnt FROM matches GROUP BY player1
        UNION ALL
        SELECT player2 as player_id, count(*) as cnt FROM matches GROUP BY player2
        UNION ALL
        SELECT player3 as player_id, count(*) as cnt FROM matches WHERE player3 IS NOT NULL GROUP BY player3
        UNION ALL
        SELECT player4 as player_id, count(*) as cnt FROM matches WHERE player4 IS NOT NULL GROUP BY player4
    ) subquery ON p.id = subquery.player_id
    GROUP BY p.id, p.name
    ORDER BY match_count DESC;
$$;


ALTER FUNCTION "public"."get_player_match_counts"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_player_matches_count"("kicker_id" bigint) RETURNS TABLE("id" bigint, "name" "text", "match_count" bigint)
    LANGUAGE "plpgsql"
    AS $_$
BEGIN
    RETURN QUERY
    SELECT p.id, p.name, COALESCE(SUM(subquery.cnt)::bigint, 0) AS match_count
    FROM player p
    LEFT JOIN (
        SELECT m.player1 AS id, COUNT(*) AS cnt 
        FROM matches m
        WHERE m.kicker_id = $1 AND m.status != 'active'
        GROUP BY m.player1
        UNION ALL
        SELECT m.player2 AS id, COUNT(*) AS cnt 
        FROM matches m
        WHERE m.kicker_id = $1 AND m.status != 'active'
        GROUP BY m.player2
        UNION ALL
        SELECT m.player3 AS id, COUNT(*) AS cnt 
        FROM matches m
        WHERE m.player3 IS NOT NULL AND m.kicker_id = $1 AND m.status != 'active'
        GROUP BY m.player3
        UNION ALL
        SELECT m.player4 AS id, COUNT(*) AS cnt 
        FROM matches m
        WHERE m.player4 IS NOT NULL AND m.kicker_id = $1 AND m.status != 'active'
        GROUP BY m.player4
    ) subquery ON p.id = subquery.id
    WHERE p.kicker_id = $1
    GROUP BY p.id, p.name
    ORDER BY match_count DESC;
END;
$_$;


ALTER FUNCTION "public"."get_player_matches_count"("kicker_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_players_by_kicker"("kicker_id_param" integer) RETURNS SETOF "public"."player"
    LANGUAGE "plpgsql" STABLE
    AS $$
BEGIN
    RETURN QUERY 
    SELECT * 
    FROM player
    WHERE kicker_id = kicker_id_param
    ORDER BY LOWER(name);
END;
$$;


ALTER FUNCTION "public"."get_players_by_kicker"("kicker_id_param" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_nr"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.nr := COALESCE(
        (SELECT MAX(nr) FROM season WHERE kicker_id = NEW.kicker_id) + 1,
        1
    );
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."increment_nr"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_player_history"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    currentPlayer RECORD;
    winCount INT;
    lossCount INT;
    win2on2Count INT;
    loss2on2Count INT;
    win2on1Count INT;
    loss2on1Count INT;
    totalDuration INT;
    totalDuration2on2 INT;
    totalDuration2on1 INT;
BEGIN
    -- Iteriere über alle Spieler in der player-Tabelle
    FOR currentPlayer IN
        SELECT * FROM player
    LOOP
        -- Berechne wins und losses für 1on1 am aktuellen Tag
        SELECT COUNT(*) INTO winCount
        FROM matches
        WHERE DATE(created_at) = CURRENT_DATE
        AND gamemode = '1on1'
        AND ((player1 = currentPlayer.id AND "scoreTeam1" > "scoreTeam2") OR
             (player2 = currentPlayer.id AND "scoreTeam1" < "scoreTeam2"));

        SELECT COUNT(*) INTO lossCount
        FROM matches
        WHERE DATE(created_at) = CURRENT_DATE
        AND gamemode = '1on1'
        AND ((player1 = currentPlayer.id AND "scoreTeam1" < "scoreTeam2") OR
             (player2 = currentPlayer.id AND "scoreTeam1" > "scoreTeam2"));

        -- Berechne wins2on2 und losses2on2 für 2on2 am aktuellen Tag
        SELECT COUNT(*) INTO win2on2Count
        FROM matches
        WHERE DATE(created_at) = CURRENT_DATE
        AND gamemode = '2on2'
        AND ((player1 = currentPlayer.id AND "scoreTeam1" > "scoreTeam2") OR
             (player2 = currentPlayer.id AND "scoreTeam1" < "scoreTeam2"));

        SELECT COUNT(*) INTO loss2on2Count
        FROM matches
        WHERE DATE(created_at) = CURRENT_DATE
        AND gamemode = '2on2'
        AND ((player1 = currentPlayer.id AND "scoreTeam1" < "scoreTeam2") OR
             (player2 = currentPlayer.id AND "scoreTeam1" > "scoreTeam2"));

        -- Berechne wins2on1 und losses2on1 für 2on1 am aktuellen Tag
        SELECT COUNT(*) INTO win2on1Count
        FROM matches
        WHERE DATE(created_at) = CURRENT_DATE
        AND gamemode = '2on1'
        AND ((player1 = currentPlayer.id AND "scoreTeam1" > "scoreTeam2") OR
             (player2 = currentPlayer.id AND "scoreTeam1" < "scoreTeam2"));

        SELECT COUNT(*) INTO loss2on1Count
        FROM matches
        WHERE DATE(created_at) = CURRENT_DATE
        AND gamemode = '2on1'
        AND ((player1 = currentPlayer.id AND "scoreTeam1" < "scoreTeam2") OR
             (player2 = currentPlayer.id AND "scoreTeam1" > "scoreTeam2"));

        -- Berechne die gesamte Spielzeit für 1on1, 2on2, 2on1 am aktuellen Tag
        SELECT SUM(EXTRACT(EPOCH FROM (end_time - start_time))) INTO totalDuration
        FROM matches
        WHERE DATE(created_at) = CURRENT_DATE
        AND gamemode = '1on1'
        AND (player1 = currentPlayer.id OR player2 = currentPlayer.id);

        SELECT SUM(EXTRACT(EPOCH FROM (end_time - start_time))) INTO totalDuration2on2
        FROM matches
        WHERE DATE(created_at) = CURRENT_DATE
        AND gamemode = '2on2'
        AND (player1 = currentPlayer.id OR player2 = currentPlayer.id OR player3 = currentPlayer.id OR player4 = currentPlayer.id);

        SELECT SUM(EXTRACT(EPOCH FROM (end_time - start_time))) INTO totalDuration2on1
        FROM matches
        WHERE DATE(created_at) = CURRENT_DATE
        AND gamemode = '2on1'
        AND (player1 = currentPlayer.id OR player2 = currentPlayer.id OR player3 = currentPlayer.id OR player4 = currentPlayer.id);

        -- Fügen Sie die berechneten Werte in player_history ein
        INSERT INTO player_history (player_name, player_id, user_id, mmr, mmr2on2, wins, losses, wins2on2, losses2on2, wins2on1, losses2on1, duration, duration2on2, duration2on1, kicker_id)
        VALUES (currentPlayer.name, currentPlayer.id, currentPlayer.user_id, currentPlayer.mmr, currentPlayer.mmr2on2, winCount, lossCount, win2on2Count, loss2on2Count, win2on1Count, loss2on1Count, COALESCE(totalDuration, 0), COALESCE(totalDuration2on2, 0), COALESCE(totalDuration2on1, 0), currentPlayer.kicker_id);
    END LOOP;
END;
$$;


ALTER FUNCTION "public"."update_player_history"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_sequences"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  seq_record RECORD;
  max_id INTEGER;
BEGIN
  -- Durchlaufe alle Tabellen im Schema 'kopecht'
  FOR seq_record IN SELECT table_name, column_name FROM information_schema.columns WHERE table_schema = 'kopecht' AND column_default LIKE 'nextval(%' LOOP
    -- Ermittle die maximale ID für die aktuelle Tabelle
    EXECUTE 'SELECT COALESCE(MAX(' || quote_ident(seq_record.column_name) || '), 0) FROM kopecht.' || quote_ident(seq_record.table_name) INTO max_id;
  
    -- Setze den Sequenzwert auf die maximale ID + 1
    EXECUTE 'SELECT setval(pg_get_serial_sequence(''kopecht.' || quote_ident(seq_record.table_name) || ''', ''' || seq_record.column_name || '''), ' || max_id || ' + 1)';
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."update_sequences"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_sequences_in_kopecht"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  seq_record RECORD;
  sequence_name TEXT;
  max_id BIGINT;
BEGIN
  FOR seq_record IN
    SELECT t.relname AS table_name, a.attname AS column_name, s.relname AS sequence_name
    FROM pg_class s
    JOIN pg_depend d ON d.objid = s.oid
    JOIN pg_class t ON d.refobjid = t.oid
    JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = d.refobjsubid
    WHERE s.relkind = 'S' AND t.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'kopecht')
  LOOP
    EXECUTE 'SELECT MAX(' || quote_ident(seq_record.column_name) || ') FROM kopecht.' || quote_ident(seq_record.table_name)
    INTO max_id;

    IF max_id IS NULL THEN
      max_id := 1;
    ELSE
      max_id := max_id + 1;
    END IF;

    sequence_name := 'kopecht.' || seq_record.sequence_name;

    EXECUTE 'SELECT setval(''' || sequence_name || ''', ' || max_id || ', false)';
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."update_sequences_in_kopecht"() OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."goals" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "match_id" bigint NOT NULL,
    "player_id" bigint NOT NULL,
    "kicker_id" bigint NOT NULL,
    "goal_type" "text" NOT NULL,
    "amount" smallint NOT NULL,
    "team" smallint NOT NULL,
    "scoreTeam1" bigint,
    "scoreTeam2" bigint,
    "gamemode" "text" DEFAULT ''::"text" NOT NULL
);


ALTER TABLE "public"."goals" OWNER TO "postgres";


ALTER TABLE "public"."goals" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."goals_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."kicker" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" "text" NOT NULL,
    "access_token" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "avatar" "text",
    "season_config" "jsonb" DEFAULT '{"frequency": "quarterly", "season_mode": false}'::"jsonb" NOT NULL,
    "admin" "uuid"
);


ALTER TABLE "public"."kicker" OWNER TO "postgres";


ALTER TABLE "public"."kicker" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."kicker_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."matches" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "end_time" timestamp with time zone,
    "player1" bigint NOT NULL,
    "player2" bigint NOT NULL,
    "player3" bigint,
    "player4" bigint,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "scoreTeam1" smallint DEFAULT '0'::smallint NOT NULL,
    "scoreTeam2" smallint DEFAULT '0'::smallint NOT NULL,
    "mmrChangeTeam1" bigint,
    "mmrChangeTeam2" bigint,
    "mmrPlayer1" bigint,
    "mmrPlayer2" bigint,
    "mmrPlayer3" bigint,
    "mmrPlayer4" bigint,
    "gamemode" "text" DEFAULT '1on1'::"text" NOT NULL,
    "start_time" timestamp with time zone,
    "kicker_id" bigint NOT NULL,
    "nr" bigint,
    "season_id" bigint
);


ALTER TABLE "public"."matches" OWNER TO "postgres";


ALTER TABLE "public"."matches" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."matches_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."player_history" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "player_name" "text" NOT NULL,
    "player_id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "kicker_id" bigint NOT NULL,
    "mmr" bigint NOT NULL,
    "mmr2on2" bigint NOT NULL,
    "wins" bigint NOT NULL,
    "losses" bigint NOT NULL,
    "wins2on2" bigint NOT NULL,
    "losses2on2" bigint NOT NULL,
    "wins2on1" bigint NOT NULL,
    "losses2on1" bigint NOT NULL,
    "duration" bigint DEFAULT '0'::bigint NOT NULL,
    "duration2on2" bigint DEFAULT '0'::bigint NOT NULL,
    "duration2on1" bigint DEFAULT '0'::bigint NOT NULL
);


ALTER TABLE "public"."player_history" OWNER TO "postgres";


ALTER TABLE "public"."player_history" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."player_history_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE "public"."player" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."player_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE ONLY "public"."goals"
    ADD CONSTRAINT "goals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."kicker"
    ADD CONSTRAINT "kicker_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."matches"
    ADD CONSTRAINT "matches_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."player_history"
    ADD CONSTRAINT "player_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."player"
    ADD CONSTRAINT "player_pkey" PRIMARY KEY ("id");



CREATE OR REPLACE TRIGGER "before_match_insert" BEFORE INSERT ON "public"."matches" FOR EACH ROW EXECUTE FUNCTION "public"."assign_match_number"();



ALTER TABLE ONLY "public"."goals"
    ADD CONSTRAINT "goals_kicker_id_fkey" FOREIGN KEY ("kicker_id") REFERENCES "public"."kicker"("id");



ALTER TABLE ONLY "public"."goals"
    ADD CONSTRAINT "goals_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id");



ALTER TABLE ONLY "public"."goals"
    ADD CONSTRAINT "goals_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "public"."player"("id");



ALTER TABLE ONLY "public"."kicker"
    ADD CONSTRAINT "kicker_admin_fkey" FOREIGN KEY ("admin") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."matches"
    ADD CONSTRAINT "matches_kicker_id_fkey" FOREIGN KEY ("kicker_id") REFERENCES "public"."kicker"("id");



ALTER TABLE ONLY "public"."matches"
    ADD CONSTRAINT "matches_player1_fkey" FOREIGN KEY ("player1") REFERENCES "public"."player"("id");



ALTER TABLE ONLY "public"."matches"
    ADD CONSTRAINT "matches_player2_fkey" FOREIGN KEY ("player2") REFERENCES "public"."player"("id");



ALTER TABLE ONLY "public"."matches"
    ADD CONSTRAINT "matches_player3_fkey" FOREIGN KEY ("player3") REFERENCES "public"."player"("id");



ALTER TABLE ONLY "public"."matches"
    ADD CONSTRAINT "matches_player4_fkey" FOREIGN KEY ("player4") REFERENCES "public"."player"("id");



ALTER TABLE ONLY "public"."player_history"
    ADD CONSTRAINT "player_history_kicker_id_fkey" FOREIGN KEY ("kicker_id") REFERENCES "public"."kicker"("id");



ALTER TABLE ONLY "public"."player_history"
    ADD CONSTRAINT "player_history_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "public"."player"("id");



ALTER TABLE ONLY "public"."player_history"
    ADD CONSTRAINT "player_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."player"
    ADD CONSTRAINT "player_kicker_id_fkey" FOREIGN KEY ("kicker_id") REFERENCES "public"."kicker"("id");



ALTER TABLE ONLY "public"."player"
    ADD CONSTRAINT "player_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



CREATE POLICY "Enable read access for all users" ON "public"."player" USING (true) WITH CHECK (true);



CREATE POLICY "access_control_on_goals" ON "public"."goals" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."player"
  WHERE (("player"."kicker_id" = "goals"."kicker_id") AND ("player"."user_id" = "auth"."uid"())))));



CREATE POLICY "access_control_on_matches" ON "public"."matches" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."player"
  WHERE (("player"."kicker_id" = "matches"."kicker_id") AND ("player"."user_id" = "auth"."uid"())))));



CREATE POLICY "delete_control_on_goals" ON "public"."goals" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."player"
  WHERE (("player"."kicker_id" = "goals"."kicker_id") AND ("player"."user_id" = "auth"."uid"())))));



ALTER TABLE "public"."goals" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "insert_control_on_goals" ON "public"."goals" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."player"
  WHERE (("player"."kicker_id" = "goals"."kicker_id") AND ("player"."user_id" = "auth"."uid"())))));



CREATE POLICY "insert_control_on_matches" ON "public"."matches" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."player"
  WHERE (("player"."kicker_id" = "matches"."kicker_id") AND ("player"."user_id" = "auth"."uid"())))));



ALTER TABLE "public"."matches" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."player" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "update_control_on_goals" ON "public"."goals" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."player"
  WHERE (("player"."kicker_id" = "goals"."kicker_id") AND ("player"."user_id" = "auth"."uid"())))));



CREATE POLICY "update_control_on_matches" ON "public"."matches" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."player"
  WHERE (("player"."kicker_id" = "matches"."kicker_id") AND ("player"."user_id" = "auth"."uid"())))));



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON TABLE "public"."player" TO "anon";
GRANT ALL ON TABLE "public"."player" TO "authenticated";
GRANT ALL ON TABLE "public"."player" TO "service_role";



GRANT ALL ON FUNCTION "public"."assign_match_number"() TO "anon";
GRANT ALL ON FUNCTION "public"."assign_match_number"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."assign_match_number"() TO "service_role";



GRANT ALL ON FUNCTION "public"."duplicate_schema_tables"() TO "anon";
GRANT ALL ON FUNCTION "public"."duplicate_schema_tables"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."duplicate_schema_tables"() TO "service_role";



GRANT ALL ON PROCEDURE "public"."fillgoalsfrommatches"() TO "anon";
GRANT ALL ON PROCEDURE "public"."fillgoalsfrommatches"() TO "authenticated";
GRANT ALL ON PROCEDURE "public"."fillgoalsfrommatches"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_player_match_count"("matchestable" "regclass", "playertable" "regclass") TO "anon";
GRANT ALL ON FUNCTION "public"."get_player_match_count"("matchestable" "regclass", "playertable" "regclass") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_player_match_count"("matchestable" "regclass", "playertable" "regclass") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_player_match_count"("matchestable" "text", "playertable" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_player_match_count"("matchestable" "text", "playertable" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_player_match_count"("matchestable" "text", "playertable" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_player_match_counts"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_player_match_counts"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_player_match_counts"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_player_matches_count"("kicker_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."get_player_matches_count"("kicker_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_player_matches_count"("kicker_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_players_by_kicker"("kicker_id_param" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_players_by_kicker"("kicker_id_param" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_players_by_kicker"("kicker_id_param" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_nr"() TO "anon";
GRANT ALL ON FUNCTION "public"."increment_nr"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_nr"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_player_history"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_player_history"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_player_history"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_sequences"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_sequences"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_sequences"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_sequences_in_kopecht"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_sequences_in_kopecht"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_sequences_in_kopecht"() TO "service_role";



GRANT ALL ON TABLE "public"."goals" TO "anon";
GRANT ALL ON TABLE "public"."goals" TO "authenticated";
GRANT ALL ON TABLE "public"."goals" TO "service_role";



GRANT ALL ON SEQUENCE "public"."goals_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."goals_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."goals_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."kicker" TO "anon";
GRANT ALL ON TABLE "public"."kicker" TO "authenticated";
GRANT ALL ON TABLE "public"."kicker" TO "service_role";



GRANT ALL ON SEQUENCE "public"."kicker_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."kicker_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."kicker_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."matches" TO "anon";
GRANT ALL ON TABLE "public"."matches" TO "authenticated";
GRANT ALL ON TABLE "public"."matches" TO "service_role";



GRANT ALL ON SEQUENCE "public"."matches_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."matches_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."matches_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."player_history" TO "anon";
GRANT ALL ON TABLE "public"."player_history" TO "authenticated";
GRANT ALL ON TABLE "public"."player_history" TO "service_role";



GRANT ALL ON SEQUENCE "public"."player_history_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."player_history_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."player_history_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."player_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."player_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."player_id_seq" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






