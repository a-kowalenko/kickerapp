

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



CREATE TYPE "public"."player_with_season_mmr" AS (
	"id" bigint,
	"created_at" timestamp with time zone,
	"name" "text",
	"wins" bigint,
	"losses" bigint,
	"mmr" bigint,
	"avatar" "text",
	"user_id" "uuid",
	"mmr2on2" bigint,
	"wins2on2" bigint,
	"losses2on2" bigint,
	"kicker_id" bigint
);


ALTER TYPE "public"."player_with_season_mmr" OWNER TO "postgres";

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


CREATE OR REPLACE FUNCTION "public"."create_season_end_history"("p_season_id" bigint, "p_kicker_id" bigint) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    currentPlayer RECORD;
    v_end_date DATE;
    v_mmr BIGINT;
    v_mmr2on2 BIGINT;
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
    -- Get the end_date from the season
    SELECT DATE(end_date) INTO v_end_date
    FROM seasons
    WHERE id = p_season_id AND kicker_id = p_kicker_id;
    
    -- If no end_date found (season not ended or doesn't exist), use current date
    IF v_end_date IS NULL THEN
        v_end_date := CURRENT_DATE;
    END IF;

    -- Iterate over all players of this kicker
    FOR currentPlayer IN
        SELECT * FROM player
        WHERE kicker_id = p_kicker_id
    LOOP
        -- Check for duplicate: skip if entry already exists for this player, season, and date
        IF EXISTS (
            SELECT 1 FROM player_history
            WHERE player_id = currentPlayer.id
            AND season_id = p_season_id
            AND DATE(created_at) = v_end_date
        ) THEN
            CONTINUE;
        END IF;

        -- Get mmr and mmr2on2 from season_rankings
        SELECT sr.mmr, sr.mmr2on2 INTO v_mmr, v_mmr2on2
        FROM season_rankings sr
        WHERE sr.player_id = currentPlayer.id AND sr.season_id = p_season_id;

        -- If no season ranking found, use defaults
        IF v_mmr IS NULL THEN
            v_mmr := 1000;
        END IF;
        IF v_mmr2on2 IS NULL THEN
            v_mmr2on2 := 1000;
        END IF;

        -- Calculate wins and losses for 1on1 on the end date
        SELECT COUNT(*) INTO winCount
        FROM matches
        WHERE DATE(created_at) = v_end_date
        AND gamemode = '1on1'
        AND status = 'ended'
        AND ((player1 = currentPlayer.id AND "scoreTeam1" > "scoreTeam2") OR
             (player2 = currentPlayer.id AND "scoreTeam1" < "scoreTeam2"));

        SELECT COUNT(*) INTO lossCount
        FROM matches
        WHERE DATE(created_at) = v_end_date
        AND gamemode = '1on1'
        AND status = 'ended'
        AND ((player1 = currentPlayer.id AND "scoreTeam1" < "scoreTeam2") OR
             (player2 = currentPlayer.id AND "scoreTeam1" > "scoreTeam2"));

        -- Calculate wins2on2 and losses2on2 for 2on2 on the end date
        -- Team 1 = player1 + player3, Team 2 = player2 + player4
        SELECT COUNT(*) INTO win2on2Count
        FROM matches
        WHERE DATE(created_at) = v_end_date
        AND gamemode = '2on2'
        AND status = 'ended'
        AND (((player1 = currentPlayer.id OR player3 = currentPlayer.id) AND "scoreTeam1" > "scoreTeam2") OR
             ((player2 = currentPlayer.id OR player4 = currentPlayer.id) AND "scoreTeam1" < "scoreTeam2"));

        SELECT COUNT(*) INTO loss2on2Count
        FROM matches
        WHERE DATE(created_at) = v_end_date
        AND gamemode = '2on2'
        AND status = 'ended'
        AND (((player1 = currentPlayer.id OR player3 = currentPlayer.id) AND "scoreTeam1" < "scoreTeam2") OR
             ((player2 = currentPlayer.id OR player4 = currentPlayer.id) AND "scoreTeam1" > "scoreTeam2"));

        -- Calculate wins2on1 and losses2on1 for 2on1 on the end date
        SELECT COUNT(*) INTO win2on1Count
        FROM matches
        WHERE DATE(created_at) = v_end_date
        AND gamemode = '2on1'
        AND status = 'ended'
        AND (((player1 = currentPlayer.id OR player3 = currentPlayer.id) AND "scoreTeam1" > "scoreTeam2") OR
             ((player2 = currentPlayer.id OR player4 = currentPlayer.id) AND "scoreTeam1" < "scoreTeam2"));

        SELECT COUNT(*) INTO loss2on1Count
        FROM matches
        WHERE DATE(created_at) = v_end_date
        AND gamemode = '2on1'
        AND status = 'ended'
        AND (((player1 = currentPlayer.id OR player3 = currentPlayer.id) AND "scoreTeam1" < "scoreTeam2") OR
             ((player2 = currentPlayer.id OR player4 = currentPlayer.id) AND "scoreTeam1" > "scoreTeam2"));

        -- Calculate total play time for 1on1 on the end date
        SELECT SUM(EXTRACT(EPOCH FROM (end_time - start_time))) INTO totalDuration
        FROM matches
        WHERE DATE(created_at) = v_end_date
        AND gamemode = '1on1'
        AND status = 'ended'
        AND (player1 = currentPlayer.id OR player2 = currentPlayer.id);

        -- Calculate total play time for 2on2 on the end date
        SELECT SUM(EXTRACT(EPOCH FROM (end_time - start_time))) INTO totalDuration2on2
        FROM matches
        WHERE DATE(created_at) = v_end_date
        AND gamemode = '2on2'
        AND status = 'ended'
        AND (player1 = currentPlayer.id OR player2 = currentPlayer.id OR player3 = currentPlayer.id OR player4 = currentPlayer.id);

        -- Calculate total play time for 2on1 on the end date
        SELECT SUM(EXTRACT(EPOCH FROM (end_time - start_time))) INTO totalDuration2on1
        FROM matches
        WHERE DATE(created_at) = v_end_date
        AND gamemode = '2on1'
        AND status = 'ended'
        AND (player1 = currentPlayer.id OR player2 = currentPlayer.id OR player3 = currentPlayer.id OR player4 = currentPlayer.id);

        -- Insert the calculated values into player_history with season_id
        INSERT INTO player_history (
            created_at,
            player_name, player_id, user_id, mmr, mmr2on2, 
            wins, losses, wins2on2, losses2on2, wins2on1, losses2on1, 
            duration, duration2on2, duration2on1, kicker_id, season_id
        )
        VALUES (
            v_end_date,
            currentPlayer.name, currentPlayer.id, currentPlayer.user_id, 
            v_mmr, v_mmr2on2, 
            winCount, lossCount, win2on2Count, loss2on2Count, 
            win2on1Count, loss2on1Count, 
            COALESCE(totalDuration, 0), COALESCE(totalDuration2on2, 0), 
            COALESCE(totalDuration2on1, 0), currentPlayer.kicker_id, p_season_id
        );
    END LOOP;
END;
$$;


ALTER FUNCTION "public"."create_season_end_history"("p_season_id" bigint, "p_kicker_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_season_ranking_for_new_player"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    current_season BIGINT;
BEGIN
    SELECT current_season_id INTO current_season
    FROM kicker
    WHERE id = NEW.kicker_id;

    IF current_season IS NOT NULL THEN
        INSERT INTO season_rankings (player_id, season_id, wins, losses, mmr, wins2on2, losses2on2, mmr2on2)
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
    -- Variables for player_history recreation
    v_current_date DATE;
    v_player_record RECORD;
    v_winCount INT;
    v_lossCount INT;
    v_win2on2Count INT;
    v_loss2on2Count INT;
    v_win2on1Count INT;
    v_loss2on1Count INT;
    v_totalDuration INT;
    v_totalDuration2on2 INT;
    v_totalDuration2on1 INT;
    v_end_of_day_mmr INT;
    v_end_of_day_mmr2on2 INT;
    v_history_season_id BIGINT;
BEGIN
    -- 1. Validate kicker exists and user is admin
    SELECT * INTO v_kicker FROM kicker WHERE id = p_kicker_id;
    
    IF v_kicker IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Kicker not found');
    END IF;
    
    IF v_kicker.admin IS NULL OR v_kicker.admin != p_user_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'Only admins can delete matches');
    END IF;

    -- 2. Fetch and validate the match
    SELECT m.*
    INTO v_match
    FROM matches m
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
    DELETE FROM goals WHERE match_id = p_match_id;

    -- 4. Reverse player table stats (wins/losses only, no MMR in player table)
    IF v_gamemode = '1on1' THEN
        IF v_team1_wins THEN
            UPDATE player SET wins = wins - 1 WHERE id = v_match.player1;
            UPDATE player SET losses = losses - 1 WHERE id = v_match.player2;
        ELSE
            UPDATE player SET losses = losses - 1 WHERE id = v_match.player1;
            UPDATE player SET wins = wins - 1 WHERE id = v_match.player2;
        END IF;
    ELSIF v_gamemode = '2on2' THEN
        IF v_team1_wins THEN
            UPDATE player SET wins2on2 = wins2on2 - 1 WHERE id = v_match.player1;
            UPDATE player SET wins2on2 = wins2on2 - 1 WHERE id = v_match.player3;
            UPDATE player SET losses2on2 = losses2on2 - 1 WHERE id = v_match.player2;
            UPDATE player SET losses2on2 = losses2on2 - 1 WHERE id = v_match.player4;
        ELSE
            UPDATE player SET losses2on2 = losses2on2 - 1 WHERE id = v_match.player1;
            UPDATE player SET losses2on2 = losses2on2 - 1 WHERE id = v_match.player3;
            UPDATE player SET wins2on2 = wins2on2 - 1 WHERE id = v_match.player2;
            UPDATE player SET wins2on2 = wins2on2 - 1 WHERE id = v_match.player4;
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
                UPDATE season_rankings 
                SET wins = wins - 1, mmr = COALESCE(v_match."mmrPlayer1", 1000)
                WHERE season_id = v_season_id AND player_id = v_match.player1;
                
                UPDATE season_rankings 
                SET losses = losses - 1, mmr = COALESCE(v_match."mmrPlayer2", 1000)
                WHERE season_id = v_season_id AND player_id = v_match.player2;
            ELSE
                UPDATE season_rankings 
                SET losses = losses - 1, mmr = COALESCE(v_match."mmrPlayer1", 1000)
                WHERE season_id = v_season_id AND player_id = v_match.player1;
                
                UPDATE season_rankings 
                SET wins = wins - 1, mmr = COALESCE(v_match."mmrPlayer2", 1000)
                WHERE season_id = v_season_id AND player_id = v_match.player2;
            END IF;
        ELSIF v_gamemode = '2on2' THEN
            IF v_team1_wins THEN
                UPDATE season_rankings 
                SET wins2on2 = wins2on2 - 1, mmr2on2 = COALESCE(v_match."mmrPlayer1", 1000)
                WHERE season_id = v_season_id AND player_id = v_match.player1;
                
                UPDATE season_rankings 
                SET wins2on2 = wins2on2 - 1, mmr2on2 = COALESCE(v_match."mmrPlayer3", 1000)
                WHERE season_id = v_season_id AND player_id = v_match.player3;
                
                UPDATE season_rankings 
                SET losses2on2 = losses2on2 - 1, mmr2on2 = COALESCE(v_match."mmrPlayer2", 1000)
                WHERE season_id = v_season_id AND player_id = v_match.player2;
                
                UPDATE season_rankings 
                SET losses2on2 = losses2on2 - 1, mmr2on2 = COALESCE(v_match."mmrPlayer4", 1000)
                WHERE season_id = v_season_id AND player_id = v_match.player4;
            ELSE
                UPDATE season_rankings 
                SET losses2on2 = losses2on2 - 1, mmr2on2 = COALESCE(v_match."mmrPlayer1", 1000)
                WHERE season_id = v_season_id AND player_id = v_match.player1;
                
                UPDATE season_rankings 
                SET losses2on2 = losses2on2 - 1, mmr2on2 = COALESCE(v_match."mmrPlayer3", 1000)
                WHERE season_id = v_season_id AND player_id = v_match.player3;
                
                UPDATE season_rankings 
                SET wins2on2 = wins2on2 - 1, mmr2on2 = COALESCE(v_match."mmrPlayer2", 1000)
                WHERE season_id = v_season_id AND player_id = v_match.player2;
                
                UPDATE season_rankings 
                SET wins2on2 = wins2on2 - 1, mmr2on2 = COALESCE(v_match."mmrPlayer4", 1000)
                WHERE season_id = v_season_id AND player_id = v_match.player4;
            END IF;
        END IF;
    END IF;

    -- 6. Delete player_history entries for ALL players of this kicker from match date onward
    -- We need to recreate history for all players to maintain consistency
    DELETE FROM player_history 
    WHERE kicker_id = p_kicker_id 
    AND DATE(created_at) >= v_match_date;

    -- 7. Delete the match
    DELETE FROM matches WHERE id = p_match_id;

    -- 8. Recalculate MMR for all subsequent matches
    -- We track each player's running MMR in v_player_mmr_map/v_player_mmr2on2_map
    -- Starting from the MMR before the deleted match, we recalculate each subsequent match
    FOR v_subsequent_match IN
        SELECT m.*
        FROM matches m
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
                FROM season_rankings 
                WHERE season_id = v_subsequent_match.season_id AND player_id = v_subsequent_match.player1;
                v_p1_mmr_before := COALESCE(v_p1_mmr_before, 1000);
            END IF;
            
            v_player_id_str := v_subsequent_match.player2::TEXT;
            IF v_player_mmr_map ? v_player_id_str THEN
                v_p2_mmr_before := (v_player_mmr_map ->> v_player_id_str)::INT;
            ELSE
                SELECT COALESCE(mmr, 1000) INTO v_p2_mmr_before
                FROM season_rankings 
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
            UPDATE matches 
            SET "mmrChangeTeam1" = v_mmr_change_team1,
                "mmrChangeTeam2" = v_mmr_change_team2,
                "mmrPlayer1" = v_p1_mmr_before,
                "mmrPlayer2" = v_p2_mmr_before
            WHERE id = v_subsequent_match.id;

            -- Update running MMR for next iteration
            v_player_mmr_map := jsonb_set(v_player_mmr_map, ARRAY[v_subsequent_match.player1::TEXT], to_jsonb(v_p1_mmr_before + v_mmr_change_team1));
            v_player_mmr_map := jsonb_set(v_player_mmr_map, ARRAY[v_subsequent_match.player2::TEXT], to_jsonb(v_p2_mmr_before + v_mmr_change_team2));

            -- Update season_rankings with final MMR after this match
            UPDATE season_rankings 
            SET mmr = v_p1_mmr_before + v_mmr_change_team1
            WHERE season_id = v_subsequent_match.season_id AND player_id = v_subsequent_match.player1;

            UPDATE season_rankings 
            SET mmr = v_p2_mmr_before + v_mmr_change_team2
            WHERE season_id = v_subsequent_match.season_id AND player_id = v_subsequent_match.player2;

        ELSIF v_subsequent_match.gamemode = '2on2' THEN
            -- Get current running MMR for players (2on2)
            v_player_id_str := v_subsequent_match.player1::TEXT;
            IF v_player_mmr2on2_map ? v_player_id_str THEN
                v_p1_mmr_before := (v_player_mmr2on2_map ->> v_player_id_str)::INT;
            ELSE
                SELECT COALESCE(mmr2on2, 1000) INTO v_p1_mmr_before
                FROM season_rankings 
                WHERE season_id = v_subsequent_match.season_id AND player_id = v_subsequent_match.player1;
                v_p1_mmr_before := COALESCE(v_p1_mmr_before, 1000);
            END IF;
            
            v_player_id_str := v_subsequent_match.player2::TEXT;
            IF v_player_mmr2on2_map ? v_player_id_str THEN
                v_p2_mmr_before := (v_player_mmr2on2_map ->> v_player_id_str)::INT;
            ELSE
                SELECT COALESCE(mmr2on2, 1000) INTO v_p2_mmr_before
                FROM season_rankings 
                WHERE season_id = v_subsequent_match.season_id AND player_id = v_subsequent_match.player2;
                v_p2_mmr_before := COALESCE(v_p2_mmr_before, 1000);
            END IF;
            
            v_player_id_str := v_subsequent_match.player3::TEXT;
            IF v_player_mmr2on2_map ? v_player_id_str THEN
                v_p3_mmr_before := (v_player_mmr2on2_map ->> v_player_id_str)::INT;
            ELSE
                SELECT COALESCE(mmr2on2, 1000) INTO v_p3_mmr_before
                FROM season_rankings 
                WHERE season_id = v_subsequent_match.season_id AND player_id = v_subsequent_match.player3;
                v_p3_mmr_before := COALESCE(v_p3_mmr_before, 1000);
            END IF;
            
            v_player_id_str := v_subsequent_match.player4::TEXT;
            IF v_player_mmr2on2_map ? v_player_id_str THEN
                v_p4_mmr_before := (v_player_mmr2on2_map ->> v_player_id_str)::INT;
            ELSE
                SELECT COALESCE(mmr2on2, 1000) INTO v_p4_mmr_before
                FROM season_rankings 
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
            UPDATE matches 
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
            UPDATE season_rankings 
            SET mmr2on2 = v_p1_mmr_before + v_mmr_change_team1
            WHERE season_id = v_subsequent_match.season_id AND player_id = v_subsequent_match.player1;

            UPDATE season_rankings 
            SET mmr2on2 = v_p3_mmr_before + v_mmr_change_team1
            WHERE season_id = v_subsequent_match.season_id AND player_id = v_subsequent_match.player3;

            UPDATE season_rankings 
            SET mmr2on2 = v_p2_mmr_before + v_mmr_change_team2
            WHERE season_id = v_subsequent_match.season_id AND player_id = v_subsequent_match.player2;

            UPDATE season_rankings 
            SET mmr2on2 = v_p4_mmr_before + v_mmr_change_team2
            WHERE season_id = v_subsequent_match.season_id AND player_id = v_subsequent_match.player4;
        END IF;
    END LOOP;

    -- 9. Recreate player_history entries for all players of this kicker from match_date to today

    -- For each day from match_date to today
    v_current_date := v_match_date;
    WHILE v_current_date <= CURRENT_DATE LOOP
        -- For each player of this kicker (not just affected ones, to maintain complete history)
        FOR v_player_record IN
            SELECT p.*
            FROM player p
            WHERE p.kicker_id = p_kicker_id
        LOOP
            -- Get season_id that was active on v_current_date for this kicker
            SELECT s.id INTO v_history_season_id
            FROM seasons s
            WHERE s.kicker_id = p_kicker_id
            AND s.start_date::date <= v_current_date
            AND (s.end_date IS NULL OR s.end_date::date >= v_current_date)
            ORDER BY s.start_date DESC
            LIMIT 1;
            
            -- If no season found, skip this entry (shouldn't happen normally)
            IF v_history_season_id IS NULL THEN
                CONTINUE;
            END IF;

            -- Calculate wins and losses for 1on1 on this day
            SELECT COUNT(*) INTO v_winCount
            FROM matches
            WHERE DATE(created_at) = v_current_date
            AND gamemode = '1on1'
            AND kicker_id = v_player_record.kicker_id
            AND status = 'ended'
            AND ((player1 = v_player_record.id AND "scoreTeam1" > "scoreTeam2") OR
                 (player2 = v_player_record.id AND "scoreTeam1" < "scoreTeam2"));

            SELECT COUNT(*) INTO v_lossCount
            FROM matches
            WHERE DATE(created_at) = v_current_date
            AND gamemode = '1on1'
            AND kicker_id = v_player_record.kicker_id
            AND status = 'ended'
            AND ((player1 = v_player_record.id AND "scoreTeam1" < "scoreTeam2") OR
                 (player2 = v_player_record.id AND "scoreTeam1" > "scoreTeam2"));

            -- Calculate wins2on2 and losses2on2 for 2on2 on this day
            -- FIXED: Include player3 and player4 in team membership check
            SELECT COUNT(*) INTO v_win2on2Count
            FROM matches
            WHERE DATE(created_at) = v_current_date
            AND gamemode = '2on2'
            AND kicker_id = v_player_record.kicker_id
            AND status = 'ended'
            AND (((player1 = v_player_record.id OR player3 = v_player_record.id) AND "scoreTeam1" > "scoreTeam2") OR
                 ((player2 = v_player_record.id OR player4 = v_player_record.id) AND "scoreTeam1" < "scoreTeam2"));

            SELECT COUNT(*) INTO v_loss2on2Count
            FROM matches
            WHERE DATE(created_at) = v_current_date
            AND gamemode = '2on2'
            AND kicker_id = v_player_record.kicker_id
            AND status = 'ended'
            AND (((player1 = v_player_record.id OR player3 = v_player_record.id) AND "scoreTeam1" < "scoreTeam2") OR
                 ((player2 = v_player_record.id OR player4 = v_player_record.id) AND "scoreTeam1" > "scoreTeam2"));

            -- Calculate wins2on1 and losses2on1 for 2on1 on this day
            -- FIXED: Include player3 and player4 in team membership check
            SELECT COUNT(*) INTO v_win2on1Count
            FROM matches
            WHERE DATE(created_at) = v_current_date
            AND gamemode = '2on1'
            AND kicker_id = v_player_record.kicker_id
            AND status = 'ended'
            AND (((player1 = v_player_record.id OR player3 = v_player_record.id) AND "scoreTeam1" > "scoreTeam2") OR
                 ((player2 = v_player_record.id OR player4 = v_player_record.id) AND "scoreTeam1" < "scoreTeam2"));

            SELECT COUNT(*) INTO v_loss2on1Count
            FROM matches
            WHERE DATE(created_at) = v_current_date
            AND gamemode = '2on1'
            AND kicker_id = v_player_record.kicker_id
            AND status = 'ended'
            AND (((player1 = v_player_record.id OR player3 = v_player_record.id) AND "scoreTeam1" < "scoreTeam2") OR
                 ((player2 = v_player_record.id OR player4 = v_player_record.id) AND "scoreTeam1" > "scoreTeam2"));

            -- Calculate total play time for 1on1 on this day
            SELECT COALESCE(SUM(EXTRACT(EPOCH FROM (end_time - start_time))), 0) INTO v_totalDuration
            FROM matches
            WHERE DATE(created_at) = v_current_date
            AND gamemode = '1on1'
            AND kicker_id = v_player_record.kicker_id
            AND status = 'ended'
            AND (player1 = v_player_record.id OR player2 = v_player_record.id);

            -- Calculate total play time for 2on2 on this day
            SELECT COALESCE(SUM(EXTRACT(EPOCH FROM (end_time - start_time))), 0) INTO v_totalDuration2on2
            FROM matches
            WHERE DATE(created_at) = v_current_date
            AND gamemode = '2on2'
            AND kicker_id = v_player_record.kicker_id
            AND status = 'ended'
            AND (player1 = v_player_record.id OR player2 = v_player_record.id OR player3 = v_player_record.id OR player4 = v_player_record.id);

            -- Calculate total play time for 2on1 on this day
            SELECT COALESCE(SUM(EXTRACT(EPOCH FROM (end_time - start_time))), 0) INTO v_totalDuration2on1
            FROM matches
            WHERE DATE(created_at) = v_current_date
            AND gamemode = '2on1'
            AND kicker_id = v_player_record.kicker_id
            AND status = 'ended'
            AND (player1 = v_player_record.id OR player2 = v_player_record.id OR player3 = v_player_record.id OR player4 = v_player_record.id);

            -- Get end-of-day MMR (last match MMR change on this day, or current if today)
            IF v_current_date = CURRENT_DATE THEN
                -- For today, use current season_rankings MMR
                SELECT COALESCE(sr.mmr, 1000), COALESCE(sr.mmr2on2, 1000)
                INTO v_end_of_day_mmr, v_end_of_day_mmr2on2
                FROM season_rankings sr
                WHERE sr.season_id = v_history_season_id AND sr.player_id = v_player_record.id;
                
                v_end_of_day_mmr := COALESCE(v_end_of_day_mmr, 1000);
                v_end_of_day_mmr2on2 := COALESCE(v_end_of_day_mmr2on2, 1000);
            ELSE
                -- For past days, calculate end-of-day MMR from matches
                -- Find the last 1on1 match of this day for this player
                SELECT 
                    CASE 
                        WHEN m.player1 = v_player_record.id THEN COALESCE(m."mmrPlayer1", 1000) + COALESCE(m."mmrChangeTeam1", 0)
                        WHEN m.player2 = v_player_record.id THEN COALESCE(m."mmrPlayer2", 1000) + COALESCE(m."mmrChangeTeam2", 0)
                    END
                INTO v_end_of_day_mmr
                FROM matches m
                WHERE DATE(m.created_at) = v_current_date
                AND m.gamemode = '1on1'
                AND m.kicker_id = v_player_record.kicker_id
                AND m.status = 'ended'
                AND (m.player1 = v_player_record.id OR m.player2 = v_player_record.id)
                ORDER BY m.start_time DESC
                LIMIT 1;

                -- If no 1on1 match that day, get from previous history or default
                IF v_end_of_day_mmr IS NULL THEN
                    SELECT ph.mmr INTO v_end_of_day_mmr
                    FROM player_history ph
                    WHERE ph.player_id = v_player_record.id
                    AND DATE(ph.created_at) < v_current_date
                    ORDER BY ph.created_at DESC
                    LIMIT 1;
                    
                    v_end_of_day_mmr := COALESCE(v_end_of_day_mmr, 1000);
                END IF;

                -- Find the last 2on2 match of this day for this player
                SELECT 
                    CASE 
                        WHEN m.player1 = v_player_record.id THEN COALESCE(m."mmrPlayer1", 1000) + COALESCE(m."mmrChangeTeam1", 0)
                        WHEN m.player2 = v_player_record.id THEN COALESCE(m."mmrPlayer2", 1000) + COALESCE(m."mmrChangeTeam2", 0)
                        WHEN m.player3 = v_player_record.id THEN COALESCE(m."mmrPlayer3", 1000) + COALESCE(m."mmrChangeTeam1", 0)
                        WHEN m.player4 = v_player_record.id THEN COALESCE(m."mmrPlayer4", 1000) + COALESCE(m."mmrChangeTeam2", 0)
                    END
                INTO v_end_of_day_mmr2on2
                FROM matches m
                WHERE DATE(m.created_at) = v_current_date
                AND m.gamemode = '2on2'
                AND m.kicker_id = v_player_record.kicker_id
                AND m.status = 'ended'
                AND (m.player1 = v_player_record.id OR m.player2 = v_player_record.id OR m.player3 = v_player_record.id OR m.player4 = v_player_record.id)
                ORDER BY m.start_time DESC
                LIMIT 1;

                -- If no 2on2 match that day, get from previous history or default
                IF v_end_of_day_mmr2on2 IS NULL THEN
                    SELECT ph.mmr2on2 INTO v_end_of_day_mmr2on2
                    FROM player_history ph
                    WHERE ph.player_id = v_player_record.id
                    AND DATE(ph.created_at) < v_current_date
                    ORDER BY ph.created_at DESC
                    LIMIT 1;
                    
                    v_end_of_day_mmr2on2 := COALESCE(v_end_of_day_mmr2on2, 1000);
                END IF;
            END IF;

            -- Insert player_history entry for this day
            INSERT INTO player_history (
                created_at, player_name, player_id, user_id, kicker_id,
                mmr, mmr2on2, wins, losses, wins2on2, losses2on2, 
                wins2on1, losses2on1, duration, duration2on2, duration2on1, season_id
            )
            VALUES (
                v_current_date + INTERVAL '23 hours 59 minutes 59 seconds',
                v_player_record.name, v_player_record.id, v_player_record.user_id, v_player_record.kicker_id,
                v_end_of_day_mmr, v_end_of_day_mmr2on2, v_winCount, v_lossCount, 
                v_win2on2Count, v_loss2on2Count, v_win2on1Count, v_loss2on1Count,
                v_totalDuration, v_totalDuration2on2, v_totalDuration2on1, v_history_season_id
            );
        END LOOP;

        v_current_date := v_current_date + INTERVAL '1 day';
    END LOOP;

    RETURN jsonb_build_object('success', true, 'message', 'Match deleted successfully');
END;
$$;


ALTER FUNCTION "public"."delete_match_with_recalculation"("p_match_id" bigint, "p_kicker_id" bigint, "p_user_id" "uuid") OWNER TO "postgres";


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
  BEFORE INSERT ON kopecht.seasons
  FOR EACH ROW 
  EXECUTE FUNCTION kopecht.increment_nr();

END;$$;


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
    FROM seasons
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
    FROM player p
    LEFT JOIN (
        SELECT m.player1 AS id, COUNT(*) AS cnt
        FROM matches m
        WHERE m.kicker_id = $1 
          AND m.status != 'active'
          AND (p_season_id IS NULL OR m.season_id = p_season_id)
        GROUP BY m.player1
        UNION ALL
        SELECT m.player2 AS id, COUNT(*) AS cnt
        FROM matches m
        WHERE m.kicker_id = $1 
          AND m.status != 'active'
          AND (p_season_id IS NULL OR m.season_id = p_season_id)
        GROUP BY m.player2
        UNION ALL
        SELECT m.player3 AS id, COUNT(*) AS cnt
        FROM matches m
        WHERE m.player3 IS NOT NULL
          AND m.kicker_id = $1 
          AND m.status != 'active'
          AND (p_season_id IS NULL OR m.season_id = p_season_id)
        GROUP BY m.player3
        UNION ALL
        SELECT m.player4 AS id, COUNT(*) AS cnt
        FROM matches m
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


CREATE OR REPLACE FUNCTION "public"."get_players_by_kicker"("kicker_id_param" integer, "p_season_id" bigint DEFAULT NULL::bigint) RETURNS SETOF "public"."player_with_season_mmr"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF p_season_id IS NULL THEN
        -- No season specified: return player data with their base MMR
        RETURN QUERY 
        SELECT 
            p.id,
            p.created_at,
            p.name,
            p.wins,
            p.losses,
            p.mmr,
            p.avatar,
            p.user_id,
            p.mmr2on2,
            p.wins2on2,
            p.losses2on2,
            p.kicker_id
        FROM player p
        WHERE p.kicker_id = kicker_id_param
        ORDER BY LOWER(p.name);
    ELSE
        -- Season specified: return player data with season-specific MMR from season_rankings
        RETURN QUERY 
        SELECT 
            p.id,
            p.created_at,
            p.name,
            COALESCE(sr.wins, p.wins) AS wins,
            COALESCE(sr.losses, p.losses) AS losses,
            COALESCE(sr.mmr, p.mmr) AS mmr,
            p.avatar,
            p.user_id,
            COALESCE(sr.mmr2on2, p.mmr2on2) AS mmr2on2,
            COALESCE(sr.wins2on2, p.wins2on2) AS wins2on2,
            COALESCE(sr.losses2on2, p.losses2on2) AS losses2on2,
            p.kicker_id
        FROM player p
        LEFT JOIN season_rankings sr ON sr.player_id = p.id AND sr.season_id = p_season_id
        WHERE p.kicker_id = kicker_id_param
        ORDER BY LOWER(p.name);
    END IF;
END;
$$;


ALTER FUNCTION "public"."get_players_by_kicker"("kicker_id_param" integer, "p_season_id" bigint) OWNER TO "postgres";


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
    FROM season_rankings sr
    JOIN player p ON sr.player_id = p.id
    WHERE p.kicker_id = p_kicker_id
      AND sr.season_id = p_season_id;
END;
$$;


ALTER FUNCTION "public"."get_season_rankings"("p_kicker_id" bigint, "p_season_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_total_unread_count"() RETURNS bigint
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    total BIGINT;
BEGIN
    SELECT COALESCE(SUM(unread_count), 0) INTO total
    FROM get_unread_count_per_kicker();
    
    RETURN total;
END;
$$;


ALTER FUNCTION "public"."get_total_unread_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_unread_comment_count"("p_kicker_id" bigint) RETURNS bigint
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_player_id BIGINT;
    v_last_read_at TIMESTAMPTZ;
    v_count BIGINT;
BEGIN
    -- Get the player ID for this user in this kicker
    SELECT id INTO v_player_id
    FROM player
    WHERE user_id = auth.uid() AND kicker_id = p_kicker_id;
    
    IF v_player_id IS NULL THEN
        RETURN 0;
    END IF;
    
    -- Get last read timestamp
    SELECT last_read_at INTO v_last_read_at
    FROM comment_read_status
    WHERE user_id = auth.uid() AND kicker_id = p_kicker_id;
    
    -- Count unread comments
    SELECT COUNT(*)::BIGINT INTO v_count
    FROM match_comments mc
    WHERE mc.kicker_id = p_kicker_id
        AND mc.created_at > COALESCE(v_last_read_at, '1970-01-01'::TIMESTAMPTZ)
        AND mc.player_id != v_player_id;  -- Don't count own comments
    
    RETURN COALESCE(v_count, 0);
END;
$$;


ALTER FUNCTION "public"."get_unread_comment_count"("p_kicker_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_unread_comment_count_per_kicker"() RETURNS TABLE("kicker_id" bigint, "unread_count" bigint)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.kicker_id,
        COUNT(mc.id)::BIGINT as unread_count
    FROM player p
    LEFT JOIN comment_read_status crs ON crs.kicker_id = p.kicker_id AND crs.user_id = auth.uid()
    LEFT JOIN match_comments mc ON mc.kicker_id = p.kicker_id
        AND mc.created_at > COALESCE(crs.last_read_at, '1970-01-01'::TIMESTAMPTZ)
        AND mc.player_id != p.id  -- Don't count own comments
    WHERE p.user_id = auth.uid()
    GROUP BY p.kicker_id;
END;
$$;


ALTER FUNCTION "public"."get_unread_comment_count_per_kicker"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_unread_count_for_user"("p_user_id" "uuid") RETURNS bigint
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    total BIGINT;
BEGIN
    SELECT COALESCE(SUM(cnt), 0) INTO total
    FROM (
        SELECT COUNT(cm.id) as cnt
        FROM player p
        LEFT JOIN chat_read_status crs ON crs.kicker_id = p.kicker_id AND crs.user_id = p_user_id
        LEFT JOIN chat_messages cm ON cm.kicker_id = p.kicker_id
            AND cm.created_at > COALESCE(crs.last_read_at, '1970-01-01'::TIMESTAMPTZ)
            AND cm.player_id != p.id
            AND (
                cm.recipient_id IS NULL
                OR
                cm.recipient_id = p.id
            )
        WHERE p.user_id = p_user_id
        GROUP BY p.kicker_id
    ) sub;
    
    RETURN COALESCE(total, 0);
END;
$$;


ALTER FUNCTION "public"."get_unread_count_for_user"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_unread_count_per_kicker"() RETURNS TABLE("kicker_id" bigint, "unread_count" bigint)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.kicker_id,
        COUNT(cm.id)::BIGINT as unread_count
    FROM player p
    LEFT JOIN chat_read_status crs ON crs.kicker_id = p.kicker_id AND crs.user_id = auth.uid()
    LEFT JOIN chat_messages cm ON cm.kicker_id = p.kicker_id
        AND cm.created_at > COALESCE(crs.last_read_at, '1970-01-01'::TIMESTAMPTZ)
        AND cm.player_id != p.id  -- Don't count own messages
        AND (
            -- Public messages
            cm.recipient_id IS NULL
            OR
            -- Whispers to this user
            cm.recipient_id = p.id
        )
    WHERE p.user_id = auth.uid()
    GROUP BY p.kicker_id;
END;
$$;


ALTER FUNCTION "public"."get_unread_count_per_kicker"() OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "public"."notify_mention"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    IF NEW.content LIKE '%@%' THEN
        PERFORM net.http_post(
            url := 'https://dixhaxicjwqchhautpje.supabase.co/functions/v1/send-push-notification',
            headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpeGhheGljandxY2hoYXV0cGplIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTY5ODQyODUwNSwiZXhwIjoyMDE0MDA0NTA1fQ.tzNZNw1M1NjFHuLFQ7CVkuBE4G9wcmypZBfWd3fiikc'
            ),
            body := jsonb_build_object(
                'type', 'INSERT',
                'table', TG_TABLE_NAME,
                'schema', 'public',
                'record', row_to_json(NEW)
            )
        );
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."notify_mention"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_chat_read_status"("p_kicker_id" bigint) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    INSERT INTO chat_read_status (user_id, kicker_id, last_read_at, updated_at)
    VALUES (auth.uid(), p_kicker_id, NOW(), NOW())
    ON CONFLICT (user_id, kicker_id)
    DO UPDATE SET 
        last_read_at = NOW(),
        updated_at = NOW();
END;
$$;


ALTER FUNCTION "public"."update_chat_read_status"("p_kicker_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_comment_read_status"("p_kicker_id" bigint) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    INSERT INTO comment_read_status (user_id, kicker_id, last_read_at, updated_at)
    VALUES (auth.uid(), p_kicker_id, NOW(), NOW())
    ON CONFLICT (user_id, kicker_id)
    DO UPDATE SET 
        last_read_at = NOW(),
        updated_at = NOW();
END;
$$;


ALTER FUNCTION "public"."update_comment_read_status"("p_kicker_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_player_history"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    currentPlayer RECORD;
    seasonId BIGINT;
    playerMmr INT;
    playerMmr2on2 INT;
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
        SELECT * FROM player
    LOOP
        -- Get current season for this player's kicker
        SELECT current_season_id INTO seasonId
        FROM kicker
        WHERE id = currentPlayer.kicker_id;

        -- Get MMR values: from season_rankings if season is active, otherwise from player
        IF seasonId IS NOT NULL THEN
            SELECT sr.mmr, sr.mmr2on2
            INTO playerMmr, playerMmr2on2
            FROM season_rankings sr
            WHERE sr.player_id = currentPlayer.id
            AND sr.season_id = seasonId;
        END IF;

        -- If no season active or no ranking exists, use player's MMR values
        IF playerMmr IS NULL THEN
            playerMmr := currentPlayer.mmr;
        END IF;
        IF playerMmr2on2 IS NULL THEN
            playerMmr2on2 := currentPlayer.mmr2on2;
        END IF;

        -- Calculate wins and losses for 1on1 on the current day
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

        -- Calculate wins2on2 and losses2on2 for 2on2 on the current day
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

        -- Calculate wins2on1 and losses2on1 for 2on1 on the current day
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

        -- Calculate total play time for 1on1, 2on2, 2on1 on the current day
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

        -- Insert the calculated values into player_history with season_id
        INSERT INTO player_history (
            player_name, player_id, user_id, mmr, mmr2on2, 
            wins, losses, wins2on2, losses2on2, wins2on1, losses2on1, 
            duration, duration2on2, duration2on1, kicker_id, season_id
        )
        VALUES (
            currentPlayer.name, currentPlayer.id, currentPlayer.user_id, 
            playerMmr, playerMmr2on2, 
            winCount, lossCount, win2on2Count, loss2on2Count, 
            win2on1Count, loss2on1Count, 
            COALESCE(totalDuration, 0), COALESCE(totalDuration2on2, 0), 
            COALESCE(totalDuration2on1, 0), currentPlayer.kicker_id, seasonId
        );
    END LOOP;
END;
$$;


ALTER FUNCTION "public"."update_player_history"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_push_subscription_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_push_subscription_updated_at"() OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "public"."upsert_fcm_token"("p_fcm_token" "text", "p_device_info" "text" DEFAULT NULL::"text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Get the current authenticated user
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;
    
    -- Delete any existing entry with this token (could be from another user)
    DELETE FROM push_subscriptions
    WHERE fcm_token = p_fcm_token;
    
    -- Delete old tokens for this user with same device type
    IF p_device_info IS NOT NULL THEN
        DELETE FROM push_subscriptions
        WHERE user_id = v_user_id
        AND device_info::jsonb->>'deviceType' = p_device_info::jsonb->>'deviceType';
    END IF;
    
    -- Insert the new token
    INSERT INTO push_subscriptions (user_id, fcm_token, device_info)
    VALUES (v_user_id, p_fcm_token, p_device_info);
END;
$$;


ALTER FUNCTION "public"."upsert_fcm_token"("p_fcm_token" "text", "p_device_info" "text") OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."chat_messages" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "edited_at" timestamp with time zone,
    "player_id" bigint NOT NULL,
    "kicker_id" bigint NOT NULL,
    "content" character varying(500) NOT NULL,
    "reply_to_id" bigint,
    "recipient_id" bigint
);


ALTER TABLE "public"."chat_messages" OWNER TO "postgres";


ALTER TABLE "public"."chat_messages" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."chat_messages_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."chat_reactions" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "message_id" bigint NOT NULL,
    "player_id" bigint NOT NULL,
    "kicker_id" bigint NOT NULL,
    "reaction_type" "text" NOT NULL
);


ALTER TABLE "public"."chat_reactions" OWNER TO "postgres";


ALTER TABLE "public"."chat_reactions" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."chat_reactions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."chat_read_status" (
    "id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "kicker_id" bigint NOT NULL,
    "last_read_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."chat_read_status" OWNER TO "postgres";


ALTER TABLE "public"."chat_read_status" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."chat_read_status_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."chat_typing" (
    "id" bigint NOT NULL,
    "player_id" bigint NOT NULL,
    "kicker_id" bigint NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."chat_typing" OWNER TO "postgres";


ALTER TABLE "public"."chat_typing" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."chat_typing_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."comment_reactions" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "comment_id" bigint NOT NULL,
    "player_id" bigint NOT NULL,
    "kicker_id" bigint NOT NULL,
    "reaction_type" "text" NOT NULL
);


ALTER TABLE "public"."comment_reactions" OWNER TO "postgres";


ALTER TABLE "public"."comment_reactions" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."comment_reactions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."comment_read_status" (
    "id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "kicker_id" bigint NOT NULL,
    "last_read_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."comment_read_status" OWNER TO "postgres";


ALTER TABLE "public"."comment_read_status" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."comment_read_status_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



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



CREATE TABLE IF NOT EXISTS "public"."match_comments" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "edited_at" timestamp with time zone,
    "match_id" bigint NOT NULL,
    "player_id" bigint NOT NULL,
    "kicker_id" bigint NOT NULL,
    "content" character varying(1000) NOT NULL
);


ALTER TABLE "public"."match_comments" OWNER TO "postgres";


ALTER TABLE "public"."match_comments" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."match_comments_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."match_reactions" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "match_id" bigint NOT NULL,
    "player_id" bigint NOT NULL,
    "kicker_id" bigint NOT NULL,
    "reaction_type" "text" NOT NULL
);


ALTER TABLE "public"."match_reactions" OWNER TO "postgres";


ALTER TABLE "public"."match_reactions" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."match_reactions_id_seq"
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



CREATE TABLE IF NOT EXISTS "public"."push_subscriptions" (
    "id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "fcm_token" "text" NOT NULL,
    "device_info" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."push_subscriptions" OWNER TO "postgres";


ALTER TABLE "public"."push_subscriptions" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."push_subscriptions_id_seq"
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



ALTER TABLE ONLY "public"."chat_messages"
    ADD CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."chat_reactions"
    ADD CONSTRAINT "chat_reactions_message_id_player_id_reaction_type_key" UNIQUE ("message_id", "player_id", "reaction_type");



ALTER TABLE ONLY "public"."chat_reactions"
    ADD CONSTRAINT "chat_reactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."chat_read_status"
    ADD CONSTRAINT "chat_read_status_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."chat_read_status"
    ADD CONSTRAINT "chat_read_status_user_id_kicker_id_key" UNIQUE ("user_id", "kicker_id");



ALTER TABLE ONLY "public"."chat_typing"
    ADD CONSTRAINT "chat_typing_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."chat_typing"
    ADD CONSTRAINT "chat_typing_player_id_kicker_id_key" UNIQUE ("player_id", "kicker_id");



ALTER TABLE ONLY "public"."comment_reactions"
    ADD CONSTRAINT "comment_reactions_comment_id_player_id_reaction_type_key" UNIQUE ("comment_id", "player_id", "reaction_type");



ALTER TABLE ONLY "public"."comment_reactions"
    ADD CONSTRAINT "comment_reactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."comment_read_status"
    ADD CONSTRAINT "comment_read_status_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."comment_read_status"
    ADD CONSTRAINT "comment_read_status_user_id_kicker_id_key" UNIQUE ("user_id", "kicker_id");



ALTER TABLE ONLY "public"."goals"
    ADD CONSTRAINT "goals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."kicker"
    ADD CONSTRAINT "kicker_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."match_comments"
    ADD CONSTRAINT "match_comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."match_reactions"
    ADD CONSTRAINT "match_reactions_match_id_player_id_reaction_type_key" UNIQUE ("match_id", "player_id", "reaction_type");



ALTER TABLE ONLY "public"."match_reactions"
    ADD CONSTRAINT "match_reactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."matches"
    ADD CONSTRAINT "matches_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."player_history"
    ADD CONSTRAINT "player_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."player"
    ADD CONSTRAINT "player_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."push_subscriptions"
    ADD CONSTRAINT "push_subscriptions_fcm_token_key" UNIQUE ("fcm_token");



ALTER TABLE ONLY "public"."push_subscriptions"
    ADD CONSTRAINT "push_subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."season_rankings"
    ADD CONSTRAINT "season_rankings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."season_rankings"
    ADD CONSTRAINT "season_rankings_player_id_season_id_key" UNIQUE ("player_id", "season_id");



ALTER TABLE ONLY "public"."seasons"
    ADD CONSTRAINT "seasons_kicker_id_season_number_key" UNIQUE ("kicker_id", "season_number");



ALTER TABLE ONLY "public"."seasons"
    ADD CONSTRAINT "seasons_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_chat_messages_created_at" ON "public"."chat_messages" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_chat_messages_kicker_id" ON "public"."chat_messages" USING "btree" ("kicker_id");



CREATE INDEX "idx_chat_messages_player_id" ON "public"."chat_messages" USING "btree" ("player_id");



CREATE INDEX "idx_chat_messages_recipient_id" ON "public"."chat_messages" USING "btree" ("recipient_id");



CREATE INDEX "idx_chat_messages_reply_to_id" ON "public"."chat_messages" USING "btree" ("reply_to_id");



CREATE INDEX "idx_chat_reactions_message_id" ON "public"."chat_reactions" USING "btree" ("message_id");



CREATE INDEX "idx_chat_reactions_player_id" ON "public"."chat_reactions" USING "btree" ("player_id");



CREATE INDEX "idx_chat_read_status_kicker_id" ON "public"."chat_read_status" USING "btree" ("kicker_id");



CREATE INDEX "idx_chat_read_status_last_read_at" ON "public"."chat_read_status" USING "btree" ("last_read_at");



CREATE INDEX "idx_chat_read_status_user_id" ON "public"."chat_read_status" USING "btree" ("user_id");



CREATE INDEX "idx_chat_typing_kicker_id" ON "public"."chat_typing" USING "btree" ("kicker_id");



CREATE INDEX "idx_chat_typing_updated_at" ON "public"."chat_typing" USING "btree" ("updated_at");



CREATE INDEX "idx_comment_reactions_comment_id" ON "public"."comment_reactions" USING "btree" ("comment_id");



CREATE INDEX "idx_comment_reactions_player_id" ON "public"."comment_reactions" USING "btree" ("player_id");



CREATE INDEX "idx_comment_read_status_kicker_id" ON "public"."comment_read_status" USING "btree" ("kicker_id");



CREATE INDEX "idx_comment_read_status_last_read_at" ON "public"."comment_read_status" USING "btree" ("last_read_at");



CREATE INDEX "idx_comment_read_status_user_id" ON "public"."comment_read_status" USING "btree" ("user_id");



CREATE INDEX "idx_match_comments_created_at" ON "public"."match_comments" USING "btree" ("created_at");



CREATE INDEX "idx_match_comments_kicker_id" ON "public"."match_comments" USING "btree" ("kicker_id");



CREATE INDEX "idx_match_comments_match_id" ON "public"."match_comments" USING "btree" ("match_id");



CREATE INDEX "idx_match_comments_player_id" ON "public"."match_comments" USING "btree" ("player_id");



CREATE INDEX "idx_match_reactions_match_id" ON "public"."match_reactions" USING "btree" ("match_id");



CREATE INDEX "idx_match_reactions_player_id" ON "public"."match_reactions" USING "btree" ("player_id");



CREATE INDEX "idx_player_history_season_id" ON "public"."player_history" USING "btree" ("season_id");



CREATE INDEX "idx_push_subscriptions_fcm_token" ON "public"."push_subscriptions" USING "btree" ("fcm_token");



CREATE INDEX "idx_push_subscriptions_user_id" ON "public"."push_subscriptions" USING "btree" ("user_id");



CREATE INDEX "idx_season_rankings_player_id" ON "public"."season_rankings" USING "btree" ("player_id");



CREATE INDEX "idx_season_rankings_season_id" ON "public"."season_rankings" USING "btree" ("season_id");



CREATE INDEX "idx_seasons_is_active" ON "public"."seasons" USING "btree" ("is_active");



CREATE INDEX "idx_seasons_kicker_id" ON "public"."seasons" USING "btree" ("kicker_id");



CREATE OR REPLACE TRIGGER "after_player_insert_create_season_ranking" AFTER INSERT ON "public"."player" FOR EACH ROW EXECUTE FUNCTION "public"."create_season_ranking_for_new_player"();



CREATE OR REPLACE TRIGGER "before_match_insert" BEFORE INSERT ON "public"."matches" FOR EACH ROW EXECUTE FUNCTION "public"."assign_match_number"();



CREATE OR REPLACE TRIGGER "notify_chat_mention" AFTER INSERT ON "public"."chat_messages" FOR EACH ROW EXECUTE FUNCTION "public"."notify_mention"();



CREATE OR REPLACE TRIGGER "notify_comment_mention" AFTER INSERT ON "public"."match_comments" FOR EACH ROW EXECUTE FUNCTION "public"."notify_mention"();



CREATE OR REPLACE TRIGGER "trigger_update_push_subscription_updated_at" BEFORE UPDATE ON "public"."push_subscriptions" FOR EACH ROW EXECUTE FUNCTION "public"."update_push_subscription_updated_at"();



ALTER TABLE ONLY "public"."chat_messages"
    ADD CONSTRAINT "chat_messages_kicker_id_fkey" FOREIGN KEY ("kicker_id") REFERENCES "public"."kicker"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chat_messages"
    ADD CONSTRAINT "chat_messages_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "public"."player"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chat_messages"
    ADD CONSTRAINT "chat_messages_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "public"."player"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chat_messages"
    ADD CONSTRAINT "chat_messages_reply_to_id_fkey" FOREIGN KEY ("reply_to_id") REFERENCES "public"."chat_messages"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."chat_reactions"
    ADD CONSTRAINT "chat_reactions_kicker_id_fkey" FOREIGN KEY ("kicker_id") REFERENCES "public"."kicker"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chat_reactions"
    ADD CONSTRAINT "chat_reactions_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "public"."chat_messages"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chat_reactions"
    ADD CONSTRAINT "chat_reactions_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "public"."player"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chat_read_status"
    ADD CONSTRAINT "chat_read_status_kicker_id_fkey" FOREIGN KEY ("kicker_id") REFERENCES "public"."kicker"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chat_read_status"
    ADD CONSTRAINT "chat_read_status_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chat_typing"
    ADD CONSTRAINT "chat_typing_kicker_id_fkey" FOREIGN KEY ("kicker_id") REFERENCES "public"."kicker"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chat_typing"
    ADD CONSTRAINT "chat_typing_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "public"."player"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comment_reactions"
    ADD CONSTRAINT "comment_reactions_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "public"."match_comments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comment_reactions"
    ADD CONSTRAINT "comment_reactions_kicker_id_fkey" FOREIGN KEY ("kicker_id") REFERENCES "public"."kicker"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comment_reactions"
    ADD CONSTRAINT "comment_reactions_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "public"."player"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comment_read_status"
    ADD CONSTRAINT "comment_read_status_kicker_id_fkey" FOREIGN KEY ("kicker_id") REFERENCES "public"."kicker"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comment_read_status"
    ADD CONSTRAINT "comment_read_status_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



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



ALTER TABLE ONLY "public"."match_comments"
    ADD CONSTRAINT "match_comments_kicker_id_fkey" FOREIGN KEY ("kicker_id") REFERENCES "public"."kicker"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."match_comments"
    ADD CONSTRAINT "match_comments_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."match_comments"
    ADD CONSTRAINT "match_comments_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "public"."player"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."match_reactions"
    ADD CONSTRAINT "match_reactions_kicker_id_fkey" FOREIGN KEY ("kicker_id") REFERENCES "public"."kicker"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."match_reactions"
    ADD CONSTRAINT "match_reactions_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."match_reactions"
    ADD CONSTRAINT "match_reactions_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "public"."player"("id") ON DELETE CASCADE;



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



ALTER TABLE ONLY "public"."push_subscriptions"
    ADD CONSTRAINT "push_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."season_rankings"
    ADD CONSTRAINT "season_rankings_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "public"."player"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."season_rankings"
    ADD CONSTRAINT "season_rankings_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."seasons"
    ADD CONSTRAINT "seasons_kicker_id_fkey" FOREIGN KEY ("kicker_id") REFERENCES "public"."kicker"("id") ON DELETE CASCADE;



CREATE POLICY "Admins can delete chat messages" ON "public"."chat_messages" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."kicker"
  WHERE (("kicker"."id" = "chat_messages"."kicker_id") AND ("kicker"."admin" = "auth"."uid"())))));



CREATE POLICY "Admins can delete comments" ON "public"."match_comments" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."kicker"
  WHERE (("kicker"."id" = "match_comments"."kicker_id") AND ("kicker"."admin" = "auth"."uid"())))));



CREATE POLICY "Admins can insert seasons" ON "public"."seasons" FOR INSERT WITH CHECK (true);



CREATE POLICY "Admins can update seasons" ON "public"."seasons" FOR UPDATE USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."player" USING (true) WITH CHECK (true);



CREATE POLICY "System can manage season_rankings" ON "public"."season_rankings" USING (true);



CREATE POLICY "Users can delete own chat reactions" ON "public"."chat_reactions" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."player"
  WHERE (("player"."id" = "chat_reactions"."player_id") AND ("player"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can delete own comment reactions" ON "public"."comment_reactions" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."player"
  WHERE (("player"."id" = "comment_reactions"."player_id") AND ("player"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can delete own comment read status" ON "public"."comment_read_status" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own match reactions" ON "public"."match_reactions" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."player"
  WHERE (("player"."id" = "match_reactions"."player_id") AND ("player"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can delete own push subscriptions" ON "public"."push_subscriptions" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own read status" ON "public"."chat_read_status" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own typing status" ON "public"."chat_typing" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."player"
  WHERE (("player"."id" = "chat_typing"."player_id") AND ("player"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can insert chat messages" ON "public"."chat_messages" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."player"
  WHERE (("player"."kicker_id" = "chat_messages"."kicker_id") AND ("player"."user_id" = "auth"."uid"()) AND ("player"."id" = "chat_messages"."player_id")))));



CREATE POLICY "Users can insert chat reactions" ON "public"."chat_reactions" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."player"
  WHERE (("player"."kicker_id" = "chat_reactions"."kicker_id") AND ("player"."user_id" = "auth"."uid"()) AND ("player"."id" = "chat_reactions"."player_id")))));



CREATE POLICY "Users can insert comment reactions" ON "public"."comment_reactions" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."player"
  WHERE (("player"."kicker_id" = "comment_reactions"."kicker_id") AND ("player"."user_id" = "auth"."uid"()) AND ("player"."id" = "comment_reactions"."player_id")))));



CREATE POLICY "Users can insert comments" ON "public"."match_comments" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."player"
  WHERE (("player"."kicker_id" = "match_comments"."kicker_id") AND ("player"."user_id" = "auth"."uid"()) AND ("player"."id" = "match_comments"."player_id")))));



CREATE POLICY "Users can insert match reactions" ON "public"."match_reactions" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."player"
  WHERE (("player"."kicker_id" = "match_reactions"."kicker_id") AND ("player"."user_id" = "auth"."uid"()) AND ("player"."id" = "match_reactions"."player_id")))));



CREATE POLICY "Users can insert own comment read status" ON "public"."comment_read_status" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own push subscriptions" ON "public"."push_subscriptions" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own read status" ON "public"."chat_read_status" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert typing status" ON "public"."chat_typing" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."player"
  WHERE (("player"."kicker_id" = "chat_typing"."kicker_id") AND ("player"."user_id" = "auth"."uid"()) AND ("player"."id" = "chat_typing"."player_id")))));



CREATE POLICY "Users can update own chat messages" ON "public"."chat_messages" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."player"
  WHERE (("player"."id" = "chat_messages"."player_id") AND ("player"."user_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."player"
  WHERE (("player"."id" = "chat_messages"."player_id") AND ("player"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can update own comment read status" ON "public"."comment_read_status" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own comments" ON "public"."match_comments" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."player"
  WHERE (("player"."id" = "match_comments"."player_id") AND ("player"."user_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."player"
  WHERE (("player"."id" = "match_comments"."player_id") AND ("player"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can update own push subscriptions" ON "public"."push_subscriptions" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own read status" ON "public"."chat_read_status" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own typing status" ON "public"."chat_typing" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."player"
  WHERE (("player"."id" = "chat_typing"."player_id") AND ("player"."user_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."player"
  WHERE (("player"."id" = "chat_typing"."player_id") AND ("player"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view chat messages" ON "public"."chat_messages" FOR SELECT USING (((EXISTS ( SELECT 1
   FROM "public"."player"
  WHERE (("player"."kicker_id" = "chat_messages"."kicker_id") AND ("player"."user_id" = "auth"."uid"())))) AND (("recipient_id" IS NULL) OR (EXISTS ( SELECT 1
   FROM "public"."player"
  WHERE (("player"."id" = "chat_messages"."player_id") AND ("player"."user_id" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM "public"."player"
  WHERE (("player"."id" = "chat_messages"."recipient_id") AND ("player"."user_id" = "auth"."uid"())))))));



CREATE POLICY "Users can view chat reactions" ON "public"."chat_reactions" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."player"
  WHERE (("player"."kicker_id" = "chat_reactions"."kicker_id") AND ("player"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view comment reactions" ON "public"."comment_reactions" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."player"
  WHERE (("player"."kicker_id" = "comment_reactions"."kicker_id") AND ("player"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view comments for their kickers" ON "public"."match_comments" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."player"
  WHERE (("player"."kicker_id" = "match_comments"."kicker_id") AND ("player"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view match reactions" ON "public"."match_reactions" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."player"
  WHERE (("player"."kicker_id" = "match_reactions"."kicker_id") AND ("player"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view own comment read status" ON "public"."comment_read_status" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own push subscriptions" ON "public"."push_subscriptions" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own read status" ON "public"."chat_read_status" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view season_rankings" ON "public"."season_rankings" FOR SELECT USING (true);



CREATE POLICY "Users can view seasons for their kickers" ON "public"."seasons" FOR SELECT USING (true);



CREATE POLICY "Users can view typing status" ON "public"."chat_typing" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."player"
  WHERE (("player"."kicker_id" = "chat_typing"."kicker_id") AND ("player"."user_id" = "auth"."uid"())))));



CREATE POLICY "access_control_on_goals" ON "public"."goals" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."player"
  WHERE (("player"."kicker_id" = "goals"."kicker_id") AND ("player"."user_id" = "auth"."uid"())))));



CREATE POLICY "access_control_on_matches" ON "public"."matches" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."player"
  WHERE (("player"."kicker_id" = "matches"."kicker_id") AND ("player"."user_id" = "auth"."uid"())))));



ALTER TABLE "public"."chat_messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."chat_reactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."chat_read_status" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."chat_typing" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."comment_reactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."comment_read_status" ENABLE ROW LEVEL SECURITY;


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



ALTER TABLE "public"."match_comments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."match_reactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."matches" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."player" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."push_subscriptions" ENABLE ROW LEVEL SECURITY;


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



GRANT ALL ON FUNCTION "public"."create_season_end_history"("p_season_id" bigint, "p_kicker_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."create_season_end_history"("p_season_id" bigint, "p_kicker_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_season_end_history"("p_season_id" bigint, "p_kicker_id" bigint) TO "service_role";



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



GRANT ALL ON FUNCTION "public"."get_players_by_kicker"("kicker_id_param" integer, "p_season_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."get_players_by_kicker"("kicker_id_param" integer, "p_season_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_players_by_kicker"("kicker_id_param" integer, "p_season_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_season_rankings"("p_kicker_id" bigint, "p_season_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."get_season_rankings"("p_kicker_id" bigint, "p_season_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_season_rankings"("p_kicker_id" bigint, "p_season_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_total_unread_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_total_unread_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_total_unread_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_unread_comment_count"("p_kicker_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."get_unread_comment_count"("p_kicker_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_unread_comment_count"("p_kicker_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_unread_comment_count_per_kicker"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_unread_comment_count_per_kicker"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_unread_comment_count_per_kicker"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_unread_count_for_user"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_unread_count_for_user"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_unread_count_for_user"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_unread_count_per_kicker"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_unread_count_per_kicker"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_unread_count_per_kicker"() TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_nr"() TO "anon";
GRANT ALL ON FUNCTION "public"."increment_nr"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_nr"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_mention"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_mention"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_mention"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_chat_read_status"("p_kicker_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."update_chat_read_status"("p_kicker_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_chat_read_status"("p_kicker_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_comment_read_status"("p_kicker_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."update_comment_read_status"("p_kicker_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_comment_read_status"("p_kicker_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_player_history"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_player_history"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_player_history"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_push_subscription_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_push_subscription_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_push_subscription_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_sequences"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_sequences"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_sequences"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_sequences_in_kopecht"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_sequences_in_kopecht"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_sequences_in_kopecht"() TO "service_role";



GRANT ALL ON FUNCTION "public"."upsert_fcm_token"("p_fcm_token" "text", "p_device_info" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."upsert_fcm_token"("p_fcm_token" "text", "p_device_info" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."upsert_fcm_token"("p_fcm_token" "text", "p_device_info" "text") TO "service_role";



GRANT ALL ON TABLE "public"."chat_messages" TO "anon";
GRANT ALL ON TABLE "public"."chat_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."chat_messages" TO "service_role";



GRANT ALL ON SEQUENCE "public"."chat_messages_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."chat_messages_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."chat_messages_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."chat_reactions" TO "anon";
GRANT ALL ON TABLE "public"."chat_reactions" TO "authenticated";
GRANT ALL ON TABLE "public"."chat_reactions" TO "service_role";



GRANT ALL ON SEQUENCE "public"."chat_reactions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."chat_reactions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."chat_reactions_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."chat_read_status" TO "anon";
GRANT ALL ON TABLE "public"."chat_read_status" TO "authenticated";
GRANT ALL ON TABLE "public"."chat_read_status" TO "service_role";



GRANT ALL ON SEQUENCE "public"."chat_read_status_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."chat_read_status_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."chat_read_status_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."chat_typing" TO "anon";
GRANT ALL ON TABLE "public"."chat_typing" TO "authenticated";
GRANT ALL ON TABLE "public"."chat_typing" TO "service_role";



GRANT ALL ON SEQUENCE "public"."chat_typing_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."chat_typing_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."chat_typing_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."comment_reactions" TO "anon";
GRANT ALL ON TABLE "public"."comment_reactions" TO "authenticated";
GRANT ALL ON TABLE "public"."comment_reactions" TO "service_role";



GRANT ALL ON SEQUENCE "public"."comment_reactions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."comment_reactions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."comment_reactions_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."comment_read_status" TO "anon";
GRANT ALL ON TABLE "public"."comment_read_status" TO "authenticated";
GRANT ALL ON TABLE "public"."comment_read_status" TO "service_role";



GRANT ALL ON SEQUENCE "public"."comment_read_status_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."comment_read_status_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."comment_read_status_id_seq" TO "service_role";



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



GRANT ALL ON TABLE "public"."match_comments" TO "anon";
GRANT ALL ON TABLE "public"."match_comments" TO "authenticated";
GRANT ALL ON TABLE "public"."match_comments" TO "service_role";



GRANT ALL ON SEQUENCE "public"."match_comments_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."match_comments_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."match_comments_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."match_reactions" TO "anon";
GRANT ALL ON TABLE "public"."match_reactions" TO "authenticated";
GRANT ALL ON TABLE "public"."match_reactions" TO "service_role";



GRANT ALL ON SEQUENCE "public"."match_reactions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."match_reactions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."match_reactions_id_seq" TO "service_role";



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



GRANT ALL ON TABLE "public"."push_subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."push_subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."push_subscriptions" TO "service_role";



GRANT ALL ON SEQUENCE "public"."push_subscriptions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."push_subscriptions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."push_subscriptions_id_seq" TO "service_role";



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






