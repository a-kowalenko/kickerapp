

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


CREATE OR REPLACE FUNCTION "public"."create_season_ranking_for_new_player"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    current_season BIGINT;
BEGIN
    SELECT current_season_id INTO current_season
    FROM public.kicker
    WHERE id = NEW.kicker_id;

    IF current_season IS NOT NULL THEN
        INSERT INTO public.season_rankings (player_id, season_id, wins, losses, mmr, wins2on2, losses2on2, mmr2on2)
        VALUES (NEW.id, current_season, 0, 0, 1000, 0, 0, 1000)
        ON CONFLICT (player_id, season_id) DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_season_ranking_for_new_player"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."delete_match_with_recalculation"("p_match_id" bigint, "p_kicker_id" bigint, "p_user_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_match RECORD;
    v_kicker RECORD;
    v_subsequent_match RECORD;
    v_team1_wins BOOLEAN;
    v_is_fatality BOOLEAN;
    v_gamemode TEXT;
    v_mmr_change_team1 INT;
    v_mmr_change_team2 INT;
    v_old_mmr_change_team1 INT;
    v_old_mmr_change_team2 INT;
    v_p1_mmr_before INT;
    v_p2_mmr_before INT;
    v_p3_mmr_before INT;
    v_p4_mmr_before INT;
    v_team1_avg_mmr INT;
    v_team2_avg_mmr INT;
    v_expected_outcome FLOAT;
    v_result INT;
    v_affected_player_ids BIGINT[];
    v_match_date DATE;
    v_season_id BIGINT;
    -- Tracking variables for running MMR state per player (using temp table would be cleaner but this works)
    v_player_mmr_map JSONB;
    v_player_mmr2on2_map JSONB;
    v_player_id_str TEXT;
BEGIN
    -- 1. Validate kicker exists and user is admin
    SELECT * INTO v_kicker FROM public.kicker WHERE id = p_kicker_id;
    
    IF v_kicker IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Kicker not found');
    END IF;
    
    IF v_kicker.admin IS NULL OR v_kicker.admin != p_user_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'Only admins can delete matches');
    END IF;

    -- 2. Fetch and validate the match
    SELECT m.*
    INTO v_match
    FROM public.matches m
    WHERE m.id = p_match_id AND m.kicker_id = p_kicker_id;

    IF v_match IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Match not found');
    END IF;

    IF v_match.status != 'ended' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Can only delete completed matches');
    END IF;

    -- Store match details for reversal
    v_team1_wins := v_match."scoreTeam1" > v_match."scoreTeam2";
    v_gamemode := v_match.gamemode;
    v_match_date := DATE(v_match.start_time);
    v_season_id := v_match.season_id;

    -- Build array of affected player IDs
    v_affected_player_ids := ARRAY[v_match.player1, v_match.player2];
    IF v_match.player3 IS NOT NULL THEN
        v_affected_player_ids := array_append(v_affected_player_ids, v_match.player3);
    END IF;
    IF v_match.player4 IS NOT NULL THEN
        v_affected_player_ids := array_append(v_affected_player_ids, v_match.player4);
    END IF;

    -- 3. Delete goals for this match
    DELETE FROM public.goals WHERE match_id = p_match_id;

    -- 4. Reverse player table stats (wins/losses only, no MMR in player table)
    IF v_gamemode = '1on1' THEN
        IF v_team1_wins THEN
            UPDATE public.player SET wins = wins - 1 WHERE id = v_match.player1;
            UPDATE public.player SET losses = losses - 1 WHERE id = v_match.player2;
        ELSE
            UPDATE public.player SET losses = losses - 1 WHERE id = v_match.player1;
            UPDATE public.player SET wins = wins - 1 WHERE id = v_match.player2;
        END IF;
    ELSIF v_gamemode = '2on2' THEN
        IF v_team1_wins THEN
            UPDATE public.player SET wins2on2 = wins2on2 - 1 WHERE id = v_match.player1;
            UPDATE public.player SET wins2on2 = wins2on2 - 1 WHERE id = v_match.player3;
            UPDATE public.player SET losses2on2 = losses2on2 - 1 WHERE id = v_match.player2;
            UPDATE public.player SET losses2on2 = losses2on2 - 1 WHERE id = v_match.player4;
        ELSE
            UPDATE public.player SET losses2on2 = losses2on2 - 1 WHERE id = v_match.player1;
            UPDATE public.player SET losses2on2 = losses2on2 - 1 WHERE id = v_match.player3;
            UPDATE public.player SET wins2on2 = wins2on2 - 1 WHERE id = v_match.player2;
            UPDATE public.player SET wins2on2 = wins2on2 - 1 WHERE id = v_match.player4;
        END IF;
    END IF;

    -- 5. Initialize player MMR tracking maps with MMR values BEFORE the deleted match
    -- The deleted match stores mmrPlayer1/2/3/4 which is the MMR before that match was played
    v_player_mmr_map := '{}'::JSONB;
    v_player_mmr2on2_map := '{}'::JSONB;
    
    IF v_season_id IS NOT NULL THEN
        -- Use mmrPlayer values from the deleted match (these are the MMR values BEFORE the match)
        IF v_gamemode = '1on1' THEN
            v_player_mmr_map := jsonb_build_object(
                v_match.player1::TEXT, COALESCE(v_match."mmrPlayer1", 1000),
                v_match.player2::TEXT, COALESCE(v_match."mmrPlayer2", 1000)
            );
        ELSIF v_gamemode = '2on2' THEN
            v_player_mmr2on2_map := jsonb_build_object(
                v_match.player1::TEXT, COALESCE(v_match."mmrPlayer1", 1000),
                v_match.player2::TEXT, COALESCE(v_match."mmrPlayer2", 1000),
                v_match.player3::TEXT, COALESCE(v_match."mmrPlayer3", 1000),
                v_match.player4::TEXT, COALESCE(v_match."mmrPlayer4", 1000)
            );
        END IF;
        
        -- Update season_rankings to the state BEFORE the deleted match
        IF v_gamemode = '1on1' THEN
            IF v_team1_wins THEN
                UPDATE public.season_rankings 
                SET wins = wins - 1, mmr = COALESCE(v_match."mmrPlayer1", 1000)
                WHERE season_id = v_season_id AND player_id = v_match.player1;
                
                UPDATE public.season_rankings 
                SET losses = losses - 1, mmr = COALESCE(v_match."mmrPlayer2", 1000)
                WHERE season_id = v_season_id AND player_id = v_match.player2;
            ELSE
                UPDATE public.season_rankings 
                SET losses = losses - 1, mmr = COALESCE(v_match."mmrPlayer1", 1000)
                WHERE season_id = v_season_id AND player_id = v_match.player1;
                
                UPDATE public.season_rankings 
                SET wins = wins - 1, mmr = COALESCE(v_match."mmrPlayer2", 1000)
                WHERE season_id = v_season_id AND player_id = v_match.player2;
            END IF;
        ELSIF v_gamemode = '2on2' THEN
            IF v_team1_wins THEN
                UPDATE public.season_rankings 
                SET wins2on2 = wins2on2 - 1, mmr2on2 = COALESCE(v_match."mmrPlayer1", 1000)
                WHERE season_id = v_season_id AND player_id = v_match.player1;
                
                UPDATE public.season_rankings 
                SET wins2on2 = wins2on2 - 1, mmr2on2 = COALESCE(v_match."mmrPlayer3", 1000)
                WHERE season_id = v_season_id AND player_id = v_match.player3;
                
                UPDATE public.season_rankings 
                SET losses2on2 = losses2on2 - 1, mmr2on2 = COALESCE(v_match."mmrPlayer2", 1000)
                WHERE season_id = v_season_id AND player_id = v_match.player2;
                
                UPDATE public.season_rankings 
                SET losses2on2 = losses2on2 - 1, mmr2on2 = COALESCE(v_match."mmrPlayer4", 1000)
                WHERE season_id = v_season_id AND player_id = v_match.player4;
            ELSE
                UPDATE public.season_rankings 
                SET losses2on2 = losses2on2 - 1, mmr2on2 = COALESCE(v_match."mmrPlayer1", 1000)
                WHERE season_id = v_season_id AND player_id = v_match.player1;
                
                UPDATE public.season_rankings 
                SET losses2on2 = losses2on2 - 1, mmr2on2 = COALESCE(v_match."mmrPlayer3", 1000)
                WHERE season_id = v_season_id AND player_id = v_match.player3;
                
                UPDATE public.season_rankings 
                SET wins2on2 = wins2on2 - 1, mmr2on2 = COALESCE(v_match."mmrPlayer2", 1000)
                WHERE season_id = v_season_id AND player_id = v_match.player2;
                
                UPDATE public.season_rankings 
                SET wins2on2 = wins2on2 - 1, mmr2on2 = COALESCE(v_match."mmrPlayer4", 1000)
                WHERE season_id = v_season_id AND player_id = v_match.player4;
            END IF;
        END IF;
    END IF;

    -- 6. Delete player_history entries for affected players from match date onward
    DELETE FROM public.player_history 
    WHERE player_id = ANY(v_affected_player_ids) 
    AND DATE(created_at) >= v_match_date;

    -- 7. Delete the match
    DELETE FROM public.matches WHERE id = p_match_id;

    -- 8. Recalculate MMR for all subsequent matches
    -- We track each player's running MMR in v_player_mmr_map/v_player_mmr2on2_map
    -- Starting from the MMR before the deleted match, we recalculate each subsequent match
    FOR v_subsequent_match IN
        SELECT m.*
        FROM public.matches m
        WHERE m.kicker_id = p_kicker_id 
        AND m.start_time > v_match.start_time
        AND m.status = 'ended'
        ORDER BY m.start_time ASC
    LOOP
        -- Skip matches without season (off-season matches don't have MMR)
        IF v_subsequent_match.season_id IS NULL THEN
            CONTINUE;
        END IF;

        v_team1_wins := v_subsequent_match."scoreTeam1" > v_subsequent_match."scoreTeam2";
        v_is_fatality := v_subsequent_match."scoreTeam1" = 0 OR v_subsequent_match."scoreTeam2" = 0;
        v_result := CASE WHEN v_team1_wins THEN 1 ELSE 0 END;
        
        -- Store old MMR changes for comparison
        v_old_mmr_change_team1 := COALESCE(v_subsequent_match."mmrChangeTeam1", 0);
        v_old_mmr_change_team2 := COALESCE(v_subsequent_match."mmrChangeTeam2", 0);

        IF v_subsequent_match.gamemode = '1on1' THEN
            -- Get current running MMR for players (or fetch from season_rankings if not in map)
            v_player_id_str := v_subsequent_match.player1::TEXT;
            IF v_player_mmr_map ? v_player_id_str THEN
                v_p1_mmr_before := (v_player_mmr_map ->> v_player_id_str)::INT;
            ELSE
                SELECT COALESCE(mmr, 1000) INTO v_p1_mmr_before
                FROM public.season_rankings 
                WHERE season_id = v_subsequent_match.season_id AND player_id = v_subsequent_match.player1;
                v_p1_mmr_before := COALESCE(v_p1_mmr_before, 1000);
            END IF;
            
            v_player_id_str := v_subsequent_match.player2::TEXT;
            IF v_player_mmr_map ? v_player_id_str THEN
                v_p2_mmr_before := (v_player_mmr_map ->> v_player_id_str)::INT;
            ELSE
                SELECT COALESCE(mmr, 1000) INTO v_p2_mmr_before
                FROM public.season_rankings 
                WHERE season_id = v_subsequent_match.season_id AND player_id = v_subsequent_match.player2;
                v_p2_mmr_before := COALESCE(v_p2_mmr_before, 1000);
            END IF;

            -- Calculate expected outcome and MMR change
            v_expected_outcome := 1.0 / (1.0 + POWER(10, (v_p2_mmr_before - v_p1_mmr_before) / 400.0));
            v_mmr_change_team1 := ROUND(32 * (v_result - v_expected_outcome));
            
            IF v_is_fatality THEN
                v_mmr_change_team1 := v_mmr_change_team1 * 2;
            END IF;
            
            v_mmr_change_team2 := -v_mmr_change_team1;

            -- Update match record with new MMR values
            UPDATE public.matches 
            SET "mmrChangeTeam1" = v_mmr_change_team1,
                "mmrChangeTeam2" = v_mmr_change_team2,
                "mmrPlayer1" = v_p1_mmr_before,
                "mmrPlayer2" = v_p2_mmr_before
            WHERE id = v_subsequent_match.id;

            -- Update running MMR for next iteration
            v_player_mmr_map := jsonb_set(v_player_mmr_map, ARRAY[v_subsequent_match.player1::TEXT], to_jsonb(v_p1_mmr_before + v_mmr_change_team1));
            v_player_mmr_map := jsonb_set(v_player_mmr_map, ARRAY[v_subsequent_match.player2::TEXT], to_jsonb(v_p2_mmr_before + v_mmr_change_team2));

            -- Update season_rankings with final MMR after this match
            UPDATE public.season_rankings 
            SET mmr = v_p1_mmr_before + v_mmr_change_team1
            WHERE season_id = v_subsequent_match.season_id AND player_id = v_subsequent_match.player1;

            UPDATE public.season_rankings 
            SET mmr = v_p2_mmr_before + v_mmr_change_team2
            WHERE season_id = v_subsequent_match.season_id AND player_id = v_subsequent_match.player2;

        ELSIF v_subsequent_match.gamemode = '2on2' THEN
            -- Get current running MMR for players (2on2)
            v_player_id_str := v_subsequent_match.player1::TEXT;
            IF v_player_mmr2on2_map ? v_player_id_str THEN
                v_p1_mmr_before := (v_player_mmr2on2_map ->> v_player_id_str)::INT;
            ELSE
                SELECT COALESCE(mmr2on2, 1000) INTO v_p1_mmr_before
                FROM public.season_rankings 
                WHERE season_id = v_subsequent_match.season_id AND player_id = v_subsequent_match.player1;
                v_p1_mmr_before := COALESCE(v_p1_mmr_before, 1000);
            END IF;
            
            v_player_id_str := v_subsequent_match.player2::TEXT;
            IF v_player_mmr2on2_map ? v_player_id_str THEN
                v_p2_mmr_before := (v_player_mmr2on2_map ->> v_player_id_str)::INT;
            ELSE
                SELECT COALESCE(mmr2on2, 1000) INTO v_p2_mmr_before
                FROM public.season_rankings 
                WHERE season_id = v_subsequent_match.season_id AND player_id = v_subsequent_match.player2;
                v_p2_mmr_before := COALESCE(v_p2_mmr_before, 1000);
            END IF;
            
            v_player_id_str := v_subsequent_match.player3::TEXT;
            IF v_player_mmr2on2_map ? v_player_id_str THEN
                v_p3_mmr_before := (v_player_mmr2on2_map ->> v_player_id_str)::INT;
            ELSE
                SELECT COALESCE(mmr2on2, 1000) INTO v_p3_mmr_before
                FROM public.season_rankings 
                WHERE season_id = v_subsequent_match.season_id AND player_id = v_subsequent_match.player3;
                v_p3_mmr_before := COALESCE(v_p3_mmr_before, 1000);
            END IF;
            
            v_player_id_str := v_subsequent_match.player4::TEXT;
            IF v_player_mmr2on2_map ? v_player_id_str THEN
                v_p4_mmr_before := (v_player_mmr2on2_map ->> v_player_id_str)::INT;
            ELSE
                SELECT COALESCE(mmr2on2, 1000) INTO v_p4_mmr_before
                FROM public.season_rankings 
                WHERE season_id = v_subsequent_match.season_id AND player_id = v_subsequent_match.player4;
                v_p4_mmr_before := COALESCE(v_p4_mmr_before, 1000);
            END IF;

            -- Calculate team averages
            v_team1_avg_mmr := ROUND((v_p1_mmr_before + v_p3_mmr_before) / 2.0);
            v_team2_avg_mmr := ROUND((v_p2_mmr_before + v_p4_mmr_before) / 2.0);

            -- Calculate expected outcome and MMR change
            v_expected_outcome := 1.0 / (1.0 + POWER(10, (v_team2_avg_mmr - v_team1_avg_mmr) / 400.0));
            v_mmr_change_team1 := ROUND(32 * (v_result - v_expected_outcome));
            
            IF v_is_fatality THEN
                v_mmr_change_team1 := v_mmr_change_team1 * 2;
            END IF;
            
            v_mmr_change_team2 := -v_mmr_change_team1;

            -- Update match record with new MMR values
            UPDATE public.matches 
            SET "mmrChangeTeam1" = v_mmr_change_team1,
                "mmrChangeTeam2" = v_mmr_change_team2,
                "mmrPlayer1" = v_p1_mmr_before,
                "mmrPlayer2" = v_p2_mmr_before,
                "mmrPlayer3" = v_p3_mmr_before,
                "mmrPlayer4" = v_p4_mmr_before
            WHERE id = v_subsequent_match.id;

            -- Update running MMR for next iteration
            v_player_mmr2on2_map := jsonb_set(v_player_mmr2on2_map, ARRAY[v_subsequent_match.player1::TEXT], to_jsonb(v_p1_mmr_before + v_mmr_change_team1));
            v_player_mmr2on2_map := jsonb_set(v_player_mmr2on2_map, ARRAY[v_subsequent_match.player2::TEXT], to_jsonb(v_p2_mmr_before + v_mmr_change_team2));
            v_player_mmr2on2_map := jsonb_set(v_player_mmr2on2_map, ARRAY[v_subsequent_match.player3::TEXT], to_jsonb(v_p3_mmr_before + v_mmr_change_team1));
            v_player_mmr2on2_map := jsonb_set(v_player_mmr2on2_map, ARRAY[v_subsequent_match.player4::TEXT], to_jsonb(v_p4_mmr_before + v_mmr_change_team2));

            -- Update season_rankings with final MMR after this match
            UPDATE public.season_rankings 
            SET mmr2on2 = v_p1_mmr_before + v_mmr_change_team1
            WHERE season_id = v_subsequent_match.season_id AND player_id = v_subsequent_match.player1;

            UPDATE public.season_rankings 
            SET mmr2on2 = v_p3_mmr_before + v_mmr_change_team1
            WHERE season_id = v_subsequent_match.season_id AND player_id = v_subsequent_match.player3;

            UPDATE public.season_rankings 
            SET mmr2on2 = v_p2_mmr_before + v_mmr_change_team2
            WHERE season_id = v_subsequent_match.season_id AND player_id = v_subsequent_match.player2;

            UPDATE public.season_rankings 
            SET mmr2on2 = v_p4_mmr_before + v_mmr_change_team2
            WHERE season_id = v_subsequent_match.season_id AND player_id = v_subsequent_match.player4;
        END IF;

        -- Also delete player_history for this subsequent match's affected players from its date
        DELETE FROM public.player_history 
        WHERE player_id IN (v_subsequent_match.player1, v_subsequent_match.player2, 
                           COALESCE(v_subsequent_match.player3, -1), COALESCE(v_subsequent_match.player4, -1))
        AND DATE(created_at) >= DATE(v_subsequent_match.start_time);
    END LOOP;

    RETURN jsonb_build_object('success', true, 'message', 'Match deleted successfully');
END;
$$;


ALTER FUNCTION "public"."delete_match_with_recalculation"("p_match_id" bigint, "p_kicker_id" bigint, "p_user_id" "uuid") OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "public"."get_next_season_number"("p_kicker_id" bigint) RETURNS integer
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    next_num INT;
BEGIN
    SELECT COALESCE(MAX(season_number), -1) + 1 INTO next_num
    FROM public.seasons
    WHERE kicker_id = p_kicker_id;

    RETURN next_num;
END;
$$;


ALTER FUNCTION "public"."get_next_season_number"("p_kicker_id" bigint) OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "public"."get_player_matches_count"("kicker_id" bigint, "p_season_id" bigint DEFAULT NULL::bigint) RETURNS TABLE("id" bigint, "name" "text", "match_count" bigint)
    LANGUAGE "plpgsql"
    AS $_$
BEGIN
    RETURN QUERY
    SELECT p.id, p.name, COALESCE(SUM(subquery.cnt)::bigint, 0)
    FROM public.player p
    LEFT JOIN (
        SELECT m.player1 AS id, COUNT(*) AS cnt
        FROM public.matches m
        WHERE m.kicker_id = $1 
          AND m.status != 'active'
          AND (p_season_id IS NULL OR m.season_id = p_season_id)
        GROUP BY m.player1
        UNION ALL
        SELECT m.player2 AS id, COUNT(*) AS cnt
        FROM public.matches m
        WHERE m.kicker_id = $1 
          AND m.status != 'active'
          AND (p_season_id IS NULL OR m.season_id = p_season_id)
        GROUP BY m.player2
        UNION ALL
        SELECT m.player3 AS id, COUNT(*) AS cnt
        FROM public.matches m
        WHERE m.player3 IS NOT NULL
          AND m.kicker_id = $1 
          AND m.status != 'active'
          AND (p_season_id IS NULL OR m.season_id = p_season_id)
        GROUP BY m.player3
        UNION ALL
        SELECT m.player4 AS id, COUNT(*) AS cnt
        FROM public.matches m
        WHERE m.player4 IS NOT NULL
          AND m.kicker_id = $1 
          AND m.status != 'active'
          AND (p_season_id IS NULL OR m.season_id = p_season_id)
        GROUP BY m.player4
    ) subquery ON p.id = subquery.id
    WHERE p.kicker_id = $1
    GROUP BY p.id, p.name
    ORDER BY match_count DESC;
END;
$_$;


ALTER FUNCTION "public"."get_player_matches_count"("kicker_id" bigint, "p_season_id" bigint) OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "public"."get_season_rankings"("p_kicker_id" bigint, "p_season_id" bigint) RETURNS TABLE("id" bigint, "player_id" bigint, "name" "text", "avatar" "text", "wins" bigint, "losses" bigint, "mmr" bigint, "wins2on2" bigint, "losses2on2" bigint, "mmr2on2" bigint, "user_id" "uuid", "kicker_id" bigint)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sr.id,
        p.id,
        p.name,
        p.avatar,
        sr.wins,
        sr.losses,
        sr.mmr,
        sr.wins2on2,
        sr.losses2on2,
        sr.mmr2on2,
        p.user_id,
        p.kicker_id
    FROM public.season_rankings sr
    JOIN public.player p ON sr.player_id = p.id
    WHERE p.kicker_id = p_kicker_id
      AND sr.season_id = p_season_id;
END;
$$;


ALTER FUNCTION "public"."get_season_rankings"("p_kicker_id" bigint, "p_season_id" bigint) OWNER TO "postgres";


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
    seasonId BIGINT;
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
    -- Iterate over all players in the player table
    FOR currentPlayer IN
        SELECT * FROM public.player
    LOOP
        -- Get current season for this player's kicker
        SELECT current_season_id INTO seasonId
        FROM public.kicker
        WHERE id = currentPlayer.kicker_id;

        -- Calculate wins and losses for 1on1 on the current day
        SELECT COUNT(*) INTO winCount
        FROM public.matches
        WHERE DATE(created_at) = CURRENT_DATE
        AND gamemode = '1on1'
        AND ((player1 = currentPlayer.id AND "scoreTeam1" > "scoreTeam2") OR
             (player2 = currentPlayer.id AND "scoreTeam1" < "scoreTeam2"));

        SELECT COUNT(*) INTO lossCount
        FROM public.matches
        WHERE DATE(created_at) = CURRENT_DATE
        AND gamemode = '1on1'
        AND ((player1 = currentPlayer.id AND "scoreTeam1" < "scoreTeam2") OR
             (player2 = currentPlayer.id AND "scoreTeam1" > "scoreTeam2"));

        -- Calculate wins2on2 and losses2on2 for 2on2 on the current day
        SELECT COUNT(*) INTO win2on2Count
        FROM public.matches
        WHERE DATE(created_at) = CURRENT_DATE
        AND gamemode = '2on2'
        AND ((player1 = currentPlayer.id AND "scoreTeam1" > "scoreTeam2") OR
             (player2 = currentPlayer.id AND "scoreTeam1" < "scoreTeam2"));

        SELECT COUNT(*) INTO loss2on2Count
        FROM public.matches
        WHERE DATE(created_at) = CURRENT_DATE
        AND gamemode = '2on2'
        AND ((player1 = currentPlayer.id AND "scoreTeam1" < "scoreTeam2") OR
             (player2 = currentPlayer.id AND "scoreTeam1" > "scoreTeam2"));

        -- Calculate wins2on1 and losses2on1 for 2on1 on the current day
        SELECT COUNT(*) INTO win2on1Count
        FROM public.matches
        WHERE DATE(created_at) = CURRENT_DATE
        AND gamemode = '2on1'
        AND ((player1 = currentPlayer.id AND "scoreTeam1" > "scoreTeam2") OR
             (player2 = currentPlayer.id AND "scoreTeam1" < "scoreTeam2"));

        SELECT COUNT(*) INTO loss2on1Count
        FROM public.matches
        WHERE DATE(created_at) = CURRENT_DATE
        AND gamemode = '2on1'
        AND ((player1 = currentPlayer.id AND "scoreTeam1" < "scoreTeam2") OR
             (player2 = currentPlayer.id AND "scoreTeam1" > "scoreTeam2"));

        -- Calculate total play time for 1on1, 2on2, 2on1 on the current day
        SELECT SUM(EXTRACT(EPOCH FROM (end_time - start_time))) INTO totalDuration
        FROM public.matches
        WHERE DATE(created_at) = CURRENT_DATE
        AND gamemode = '1on1'
        AND (player1 = currentPlayer.id OR player2 = currentPlayer.id);

        SELECT SUM(EXTRACT(EPOCH FROM (end_time - start_time))) INTO totalDuration2on2
        FROM public.matches
        WHERE DATE(created_at) = CURRENT_DATE
        AND gamemode = '2on2'
        AND (player1 = currentPlayer.id OR player2 = currentPlayer.id OR player3 = currentPlayer.id OR player4 = currentPlayer.id);

        SELECT SUM(EXTRACT(EPOCH FROM (end_time - start_time))) INTO totalDuration2on1
        FROM public.matches
        WHERE DATE(created_at) = CURRENT_DATE
        AND gamemode = '2on1'
        AND (player1 = currentPlayer.id OR player2 = currentPlayer.id OR player3 = currentPlayer.id OR player4 = currentPlayer.id);

        -- Insert the calculated values into player_history with season_id
        INSERT INTO public.player_history (
            player_name, player_id, user_id, mmr, mmr2on2, 
            wins, losses, wins2on2, losses2on2, wins2on1, losses2on1, 
            duration, duration2on2, duration2on1, kicker_id, season_id
        )
        VALUES (
            currentPlayer.name, currentPlayer.id, currentPlayer.user_id, 
            currentPlayer.mmr, currentPlayer.mmr2on2, 
            winCount, lossCount, win2on2Count, loss2on2Count, 
            win2on1Count, loss2on1Count, 
            COALESCE(totalDuration, 0), COALESCE(totalDuration2on2, 0), 
            COALESCE(totalDuration2on1, 0), currentPlayer.kicker_id, seasonId
        );
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
    "admin" "uuid",
    "current_season_id" bigint
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
    "duration2on1" bigint DEFAULT '0'::bigint NOT NULL,
    "season_id" bigint
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



CREATE TABLE IF NOT EXISTS "public"."season_rankings" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "player_id" bigint NOT NULL,
    "season_id" bigint NOT NULL,
    "wins" bigint DEFAULT 0 NOT NULL,
    "losses" bigint DEFAULT 0 NOT NULL,
    "mmr" bigint DEFAULT 1000 NOT NULL,
    "wins2on2" bigint DEFAULT 0 NOT NULL,
    "losses2on2" bigint DEFAULT 0 NOT NULL,
    "mmr2on2" bigint DEFAULT 1000 NOT NULL
);


ALTER TABLE "public"."season_rankings" OWNER TO "postgres";


ALTER TABLE "public"."season_rankings" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."season_rankings_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."seasons" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "kicker_id" bigint NOT NULL,
    "season_number" integer NOT NULL,
    "name" "text",
    "start_date" timestamp with time zone DEFAULT "now"() NOT NULL,
    "end_date" timestamp with time zone,
    "is_active" boolean DEFAULT true NOT NULL
);


ALTER TABLE "public"."seasons" OWNER TO "postgres";


ALTER TABLE "public"."seasons" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."seasons_id_seq"
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



ALTER TABLE ONLY "public"."season_rankings"
    ADD CONSTRAINT "season_rankings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."season_rankings"
    ADD CONSTRAINT "season_rankings_player_id_season_id_key" UNIQUE ("player_id", "season_id");



ALTER TABLE ONLY "public"."seasons"
    ADD CONSTRAINT "seasons_kicker_id_season_number_key" UNIQUE ("kicker_id", "season_number");



ALTER TABLE ONLY "public"."seasons"
    ADD CONSTRAINT "seasons_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_player_history_season_id" ON "public"."player_history" USING "btree" ("season_id");



CREATE INDEX "idx_season_rankings_player_id" ON "public"."season_rankings" USING "btree" ("player_id");



CREATE INDEX "idx_season_rankings_season_id" ON "public"."season_rankings" USING "btree" ("season_id");



CREATE INDEX "idx_seasons_is_active" ON "public"."seasons" USING "btree" ("is_active");



CREATE INDEX "idx_seasons_kicker_id" ON "public"."seasons" USING "btree" ("kicker_id");



CREATE OR REPLACE TRIGGER "after_player_insert_create_season_ranking" AFTER INSERT ON "public"."player" FOR EACH ROW EXECUTE FUNCTION "public"."create_season_ranking_for_new_player"();



CREATE OR REPLACE TRIGGER "before_match_insert" BEFORE INSERT ON "public"."matches" FOR EACH ROW EXECUTE FUNCTION "public"."assign_match_number"();



ALTER TABLE ONLY "public"."goals"
    ADD CONSTRAINT "goals_kicker_id_fkey" FOREIGN KEY ("kicker_id") REFERENCES "public"."kicker"("id");



ALTER TABLE ONLY "public"."goals"
    ADD CONSTRAINT "goals_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id");



ALTER TABLE ONLY "public"."goals"
    ADD CONSTRAINT "goals_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "public"."player"("id");



ALTER TABLE ONLY "public"."kicker"
    ADD CONSTRAINT "kicker_admin_fkey" FOREIGN KEY ("admin") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."kicker"
    ADD CONSTRAINT "kicker_current_season_id_fkey" FOREIGN KEY ("current_season_id") REFERENCES "public"."seasons"("id");



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
    ADD CONSTRAINT "player_history_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id");



ALTER TABLE ONLY "public"."player_history"
    ADD CONSTRAINT "player_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."player"
    ADD CONSTRAINT "player_kicker_id_fkey" FOREIGN KEY ("kicker_id") REFERENCES "public"."kicker"("id");



ALTER TABLE ONLY "public"."player"
    ADD CONSTRAINT "player_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."season_rankings"
    ADD CONSTRAINT "season_rankings_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "public"."player"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."season_rankings"
    ADD CONSTRAINT "season_rankings_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."seasons"
    ADD CONSTRAINT "seasons_kicker_id_fkey" FOREIGN KEY ("kicker_id") REFERENCES "public"."kicker"("id") ON DELETE CASCADE;



CREATE POLICY "Admins can insert seasons" ON "public"."seasons" FOR INSERT WITH CHECK (true);



CREATE POLICY "Admins can update seasons" ON "public"."seasons" FOR UPDATE USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."player" USING (true) WITH CHECK (true);



CREATE POLICY "System can manage season_rankings" ON "public"."season_rankings" USING (true);



CREATE POLICY "Users can view season_rankings" ON "public"."season_rankings" FOR SELECT USING (true);



CREATE POLICY "Users can view seasons for their kickers" ON "public"."seasons" FOR SELECT USING (true);



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


ALTER TABLE "public"."season_rankings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."seasons" ENABLE ROW LEVEL SECURITY;


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



GRANT ALL ON FUNCTION "public"."create_season_ranking_for_new_player"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_season_ranking_for_new_player"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_season_ranking_for_new_player"() TO "service_role";



GRANT ALL ON FUNCTION "public"."delete_match_with_recalculation"("p_match_id" bigint, "p_kicker_id" bigint, "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."delete_match_with_recalculation"("p_match_id" bigint, "p_kicker_id" bigint, "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_match_with_recalculation"("p_match_id" bigint, "p_kicker_id" bigint, "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."duplicate_schema_tables"() TO "anon";
GRANT ALL ON FUNCTION "public"."duplicate_schema_tables"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."duplicate_schema_tables"() TO "service_role";



GRANT ALL ON PROCEDURE "public"."fillgoalsfrommatches"() TO "anon";
GRANT ALL ON PROCEDURE "public"."fillgoalsfrommatches"() TO "authenticated";
GRANT ALL ON PROCEDURE "public"."fillgoalsfrommatches"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_next_season_number"("p_kicker_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."get_next_season_number"("p_kicker_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_next_season_number"("p_kicker_id" bigint) TO "service_role";



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



GRANT ALL ON FUNCTION "public"."get_player_matches_count"("kicker_id" bigint, "p_season_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."get_player_matches_count"("kicker_id" bigint, "p_season_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_player_matches_count"("kicker_id" bigint, "p_season_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_players_by_kicker"("kicker_id_param" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_players_by_kicker"("kicker_id_param" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_players_by_kicker"("kicker_id_param" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_season_rankings"("p_kicker_id" bigint, "p_season_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."get_season_rankings"("p_kicker_id" bigint, "p_season_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_season_rankings"("p_kicker_id" bigint, "p_season_id" bigint) TO "service_role";



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



GRANT ALL ON TABLE "public"."season_rankings" TO "anon";
GRANT ALL ON TABLE "public"."season_rankings" TO "authenticated";
GRANT ALL ON TABLE "public"."season_rankings" TO "service_role";



GRANT ALL ON SEQUENCE "public"."season_rankings_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."season_rankings_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."season_rankings_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."seasons" TO "anon";
GRANT ALL ON TABLE "public"."seasons" TO "authenticated";
GRANT ALL ON TABLE "public"."seasons" TO "service_role";



GRANT ALL ON SEQUENCE "public"."seasons_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."seasons_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."seasons_id_seq" TO "service_role";



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






