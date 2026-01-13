


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


CREATE OR REPLACE FUNCTION "public"."accept_team_invitation"("p_invitation_id" bigint) RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_invitation RECORD;
    v_team RECORD;
    v_user_player_id BIGINT;
    v_kicker_id BIGINT;
BEGIN
    -- Get invitation first to know which team/kicker we're dealing with
    SELECT * INTO v_invitation
    FROM team_invitations
    WHERE id = p_invitation_id;
    
    IF v_invitation IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Invitation not found');
    END IF;
    
    -- Get the kicker_id from the team
    SELECT kicker_id INTO v_kicker_id
    FROM teams
    WHERE id = v_invitation.team_id;
    
    -- Get current user's player ID for this specific kicker
    SELECT id INTO v_user_player_id
    FROM player
    WHERE user_id = auth.uid()
    AND kicker_id = v_kicker_id
    LIMIT 1;
    
    IF v_user_player_id IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Player not found for this kicker');
    END IF;
    
    -- Check if user is the invited player
    IF v_invitation.invited_player_id != v_user_player_id THEN
        RETURN json_build_object('success', false, 'error', 'Not authorized');
    END IF;
    
    -- Check if invitation is still pending
    IF v_invitation.status != 'pending' THEN
        RETURN json_build_object('success', false, 'error', 'Invitation already responded to');
    END IF;
    
    -- Update invitation status
    UPDATE team_invitations
    SET status = 'accepted', responded_at = NOW()
    WHERE id = p_invitation_id;
    
    -- Activate the team
    UPDATE teams
    SET status = 'active'
    WHERE id = v_invitation.team_id;
    
    -- Get team info for response
    SELECT * INTO v_team
    FROM teams
    WHERE id = v_invitation.team_id;
    
    RETURN json_build_object(
        'success', true, 
        'team_id', v_team.id,
        'team_name', v_team.name
    );
END;
$$;


ALTER FUNCTION "public"."accept_team_invitation"("p_invitation_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."add_bounty_to_season_rankings"("p_player_id" bigint, "p_season_id" bigint, "p_bounty_amount" integer, "p_gamemode" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    IF p_gamemode = '1on1' THEN
        UPDATE season_rankings
        SET bounty_claimed = bounty_claimed + p_bounty_amount
        WHERE player_id = p_player_id AND season_id = p_season_id;
    ELSE
        UPDATE season_rankings
        SET bounty_claimed_2on2 = bounty_claimed_2on2 + p_bounty_amount
        WHERE player_id = p_player_id AND season_id = p_season_id;
    END IF;
END;
$$;


ALTER FUNCTION "public"."add_bounty_to_season_rankings"("p_player_id" bigint, "p_season_id" bigint, "p_bounty_amount" integer, "p_gamemode" "text") OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "public"."atomic_increment_progress"("p_player_id" bigint, "p_achievement_id" bigint, "p_increment" integer DEFAULT 1, "p_max_progress" integer DEFAULT 1, "p_season_id" bigint DEFAULT NULL::bigint) RETURNS TABLE("new_progress" integer)
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_new_progress INTEGER;
BEGIN
    -- LOOP-BASED UPSERT: Most robust pattern for concurrent updates
    LOOP
        -- Step 1: Try UPDATE first
        IF p_season_id IS NULL THEN
            UPDATE player_achievement_progress
            SET current_progress = LEAST(current_progress + p_increment, p_max_progress),
                updated_at = NOW()
            WHERE player_id = p_player_id 
              AND achievement_id = p_achievement_id
              AND season_id IS NULL
            RETURNING current_progress INTO v_new_progress;
        ELSE
            UPDATE player_achievement_progress
            SET current_progress = LEAST(current_progress + p_increment, p_max_progress),
                updated_at = NOW()
            WHERE player_id = p_player_id 
              AND achievement_id = p_achievement_id
              AND season_id = p_season_id
            RETURNING current_progress INTO v_new_progress;
        END IF;

        -- If UPDATE succeeded, exit loop
        IF FOUND THEN
            EXIT;
        END IF;

        -- Step 2: Try INSERT
        BEGIN
            v_new_progress := LEAST(p_increment, p_max_progress);
            
            INSERT INTO player_achievement_progress (
                player_id, 
                achievement_id, 
                current_progress,
                season_id,
                updated_at
            )
            VALUES (
                p_player_id, 
                p_achievement_id, 
                v_new_progress,
                p_season_id,
                NOW()
            );
            EXIT;
        EXCEPTION WHEN unique_violation THEN
            -- Loop back and try UPDATE again
            NULL;
        END;
    END LOOP;

    RETURN QUERY SELECT v_new_progress;
END;
$$;


ALTER FUNCTION "public"."atomic_increment_progress"("p_player_id" bigint, "p_achievement_id" bigint, "p_increment" integer, "p_max_progress" integer, "p_season_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."batch_update_status_display_config"("p_kicker_id" integer, "p_configs" "jsonb") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_config JSONB;
    v_updated INTEGER := 0;
BEGIN
    FOR v_config IN SELECT * FROM jsonb_array_elements(p_configs)
    LOOP
        UPDATE status_display_config
        SET 
            layer = COALESCE(v_config->>'layer', layer),
            priority = COALESCE((v_config->>'priority')::INTEGER, priority),
            is_exclusive = COALESCE((v_config->>'is_exclusive')::BOOLEAN, is_exclusive),
            is_enabled = COALESCE((v_config->>'is_enabled')::BOOLEAN, is_enabled),
            updated_at = NOW()
        WHERE kicker_id = p_kicker_id 
          AND status_key = v_config->>'status_key';
        
        IF FOUND THEN
            v_updated := v_updated + 1;
        END IF;
    END LOOP;
    
    RETURN v_updated;
END;
$$;


ALTER FUNCTION "public"."batch_update_status_display_config"("p_kicker_id" integer, "p_configs" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_mention_notifications"("p_content" "text", "p_type" character varying, "p_source_id" bigint, "p_match_id" bigint, "p_kicker_id" bigint, "p_sender_player_id" bigint) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_mentioned_player_id BIGINT;
    v_mentioned_user_id UUID;
    v_content_preview TEXT;
    v_player_record RECORD;
BEGIN
    -- Truncate content for preview (max 100 chars)
    v_content_preview := LEFT(p_content, 100);
    IF LENGTH(p_content) > 100 THEN
        v_content_preview := v_content_preview || '...';
    END IF;
    
    -- Check for @everyone mention
    IF p_content LIKE '%@everyone%' THEN
        -- Insert notification for all players in the kicker (except sender)
        FOR v_player_record IN 
            SELECT pl.id, pl.user_id 
            FROM player pl 
            WHERE pl.kicker_id = p_kicker_id 
              AND pl.id != p_sender_player_id
              AND pl.user_id IS NOT NULL
        LOOP
            INSERT INTO mention_notifications (
                user_id, type, source_id, match_id, kicker_id, 
                sender_player_id, content_preview, is_read, created_at
            )
            VALUES (
                v_player_record.user_id, p_type, p_source_id, p_match_id, p_kicker_id,
                p_sender_player_id, v_content_preview, FALSE, NOW()
            )
            ON CONFLICT DO NOTHING;
        END LOOP;
    END IF;
    
    -- Parse individual @[name](player_id) mentions using regex
    -- Pattern: @[any text](digits)
    FOR v_mentioned_player_id IN 
        SELECT (regexp_matches(p_content, '@\[[^\]]+\]\((\d+)\)', 'g'))[1]::BIGINT
    LOOP
        -- Skip if mentioning self
        IF v_mentioned_player_id = p_sender_player_id THEN
            CONTINUE;
        END IF;
        
        -- Get user_id from player
        SELECT user_id INTO v_mentioned_user_id
        FROM player
        WHERE id = v_mentioned_player_id;
        
        -- Skip if player has no user_id
        IF v_mentioned_user_id IS NULL THEN
            CONTINUE;
        END IF;
        
        -- Insert notification (avoid duplicates with ON CONFLICT DO NOTHING)
        INSERT INTO mention_notifications (
            user_id, type, source_id, match_id, kicker_id,
            sender_player_id, content_preview, is_read, created_at
        )
        VALUES (
            v_mentioned_user_id, p_type, p_source_id, p_match_id, p_kicker_id,
            p_sender_player_id, v_content_preview, FALSE, NOW()
        )
        ON CONFLICT DO NOTHING;
    END LOOP;
END;
$$;


ALTER FUNCTION "public"."create_mention_notifications"("p_content" "text", "p_type" character varying, "p_source_id" bigint, "p_match_id" bigint, "p_kicker_id" bigint, "p_sender_player_id" bigint) OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "public"."create_team_with_invitation"("p_name" character varying, "p_partner_player_id" bigint, "p_kicker_id" bigint) RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_user_player_id BIGINT;
    v_team_id BIGINT;
    v_invitation_id BIGINT;
BEGIN
    -- Get current user's player ID for this kicker
    SELECT id INTO v_user_player_id
    FROM player
    WHERE user_id = auth.uid() AND kicker_id = p_kicker_id
    LIMIT 1;
    
    IF v_user_player_id IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Player not found in this kicker');
    END IF;
    
    -- Check partner exists in same kicker
    IF NOT EXISTS (SELECT 1 FROM player WHERE id = p_partner_player_id AND kicker_id = p_kicker_id) THEN
        RETURN json_build_object('success', false, 'error', 'Partner not found in this kicker');
    END IF;
    
    -- Check if team name already exists in this kicker
    IF EXISTS (SELECT 1 FROM teams WHERE name = p_name AND kicker_id = p_kicker_id AND status != 'dissolved') THEN
        RETURN json_build_object('success', false, 'error', 'Team name already exists');
    END IF;
    
    -- Create team with pending status
    INSERT INTO teams (name, player1_id, player2_id, kicker_id, status)
    VALUES (p_name, v_user_player_id, p_partner_player_id, p_kicker_id, 'pending')
    RETURNING id INTO v_team_id;
    
    -- Create invitation
    INSERT INTO team_invitations (team_id, inviting_player_id, invited_player_id)
    VALUES (v_team_id, v_user_player_id, p_partner_player_id)
    RETURNING id INTO v_invitation_id;
    
    RETURN json_build_object(
        'success', true,
        'team_id', v_team_id,
        'invitation_id', v_invitation_id
    );
END;
$$;


ALTER FUNCTION "public"."create_team_with_invitation"("p_name" character varying, "p_partner_player_id" bigint, "p_kicker_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."decline_team_invitation"("p_invitation_id" bigint) RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_invitation RECORD;
    v_user_player_id BIGINT;
    v_kicker_id BIGINT;
BEGIN
    -- Get invitation first to know which team/kicker we're dealing with
    SELECT * INTO v_invitation
    FROM team_invitations
    WHERE id = p_invitation_id;
    
    IF v_invitation IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Invitation not found');
    END IF;
    
    -- Get the kicker_id from the team
    SELECT kicker_id INTO v_kicker_id
    FROM teams
    WHERE id = v_invitation.team_id;
    
    -- Get current user's player ID for this specific kicker
    SELECT id INTO v_user_player_id
    FROM player
    WHERE user_id = auth.uid()
    AND kicker_id = v_kicker_id
    LIMIT 1;
    
    IF v_user_player_id IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Player not found for this kicker');
    END IF;
    
    -- Check if user is the invited player
    IF v_invitation.invited_player_id != v_user_player_id THEN
        RETURN json_build_object('success', false, 'error', 'Not authorized');
    END IF;
    
    -- Check if invitation is still pending
    IF v_invitation.status != 'pending' THEN
        RETURN json_build_object('success', false, 'error', 'Invitation already responded to');
    END IF;
    
    -- Update invitation status
    UPDATE team_invitations
    SET status = 'declined', responded_at = NOW()
    WHERE id = p_invitation_id;
    
    -- Delete the pending team
    DELETE FROM teams
    WHERE id = v_invitation.team_id;
    
    RETURN json_build_object('success', true);
END;
$$;


ALTER FUNCTION "public"."decline_team_invitation"("p_invitation_id" bigint) OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "public"."delete_push_subscription"("p_subscription_id" bigint) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Get the user_id of the subscription
    SELECT user_id INTO v_user_id
    FROM push_subscriptions
    WHERE id = p_subscription_id;
    
    -- Check if subscription exists and belongs to current user
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Subscription not found';
    END IF;
    
    IF v_user_id != auth.uid() THEN
        RAISE EXCEPTION 'Not authorized to delete this subscription';
    END IF;
    
    -- Delete the subscription
    DELETE FROM push_subscriptions
    WHERE id = p_subscription_id;
    
    RETURN TRUE;
END;
$$;


ALTER FUNCTION "public"."delete_push_subscription"("p_subscription_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."dissolve_team"("p_team_id" bigint) RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_team RECORD;
    v_user_player_id BIGINT;
BEGIN
    -- Get team first to know which kicker it belongs to
    SELECT * INTO v_team
    FROM teams
    WHERE id = p_team_id;
    
    IF v_team IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Team not found');
    END IF;
    
    -- Get current user's player ID for the team's kicker
    SELECT id INTO v_user_player_id
    FROM player
    WHERE user_id = auth.uid() AND kicker_id = v_team.kicker_id
    LIMIT 1;
    
    IF v_user_player_id IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Player not found');
    END IF;
    
    -- Check if user is a team member
    IF v_team.player1_id != v_user_player_id AND v_team.player2_id != v_user_player_id THEN
        RETURN json_build_object('success', false, 'error', 'Not a team member');
    END IF;
    
    -- Check if team is active
    IF v_team.status != 'active' THEN
        RETURN json_build_object('success', false, 'error', 'Team is not active');
    END IF;
    
    -- Dissolve the team
    UPDATE teams
    SET status = 'dissolved', dissolved_at = NOW()
    WHERE id = p_team_id;
    
    RETURN json_build_object('success', true, 'team_name', v_team.name);
END;
$$;


ALTER FUNCTION "public"."dissolve_team"("p_team_id" bigint) OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "public"."get_bounty_leaderboard"("p_limit" integer DEFAULT 10, "p_month" "text" DEFAULT NULL::"text") RETURNS TABLE("player_id" bigint, "player_name" "text", "player_avatar" "text", "total_bounties_claimed" integer, "total_bounty_amount" integer, "biggest_bounty" integer, "biggest_streak_broken" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        bh.claimer_id as player_id,
        p.name as player_name,
        p.avatar as player_avatar,
        COUNT(*)::INT as total_bounties_claimed,
        SUM(bh.bounty_amount)::INT as total_bounty_amount,
        MAX(bh.bounty_amount)::INT as biggest_bounty,
        MAX(bh.streak_broken)::INT as biggest_streak_broken
    FROM bounty_history bh
    JOIN player p ON p.id = bh.claimer_id
    WHERE (p_month IS NULL OR TO_CHAR(bh.created_at, 'YYYY-MM') = p_month)
    GROUP BY bh.claimer_id, p.name, p.avatar
    ORDER BY total_bounty_amount DESC
    LIMIT p_limit;
END;
$$;


ALTER FUNCTION "public"."get_bounty_leaderboard"("p_limit" integer, "p_month" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_combined_unread_count"() RETURNS bigint
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    chat_count BIGINT;
    comment_count BIGINT;
BEGIN
    -- Get chat unread count
    SELECT COALESCE(SUM(unread_count), 0) INTO chat_count
    FROM get_unread_count_per_kicker();
    
    -- Get comment unread count (considering both kicker-wide and match-specific read status)
    SELECT COALESCE(COUNT(*), 0) INTO comment_count
    FROM match_comments mc
    INNER JOIN player p ON p.kicker_id = mc.kicker_id AND p.user_id = auth.uid()
    LEFT JOIN comment_read_status crs ON crs.kicker_id = mc.kicker_id AND crs.user_id = auth.uid()
    LEFT JOIN match_comment_read_status mcrs ON mcrs.match_id = mc.match_id AND mcrs.user_id = auth.uid()
    WHERE mc.player_id != p.id  -- Don't count own comments
        AND mc.created_at > COALESCE(crs.last_read_at, '1970-01-01'::TIMESTAMPTZ)  -- Not read via kicker-wide
        AND mc.created_at > COALESCE(mcrs.last_read_at, '1970-01-01'::TIMESTAMPTZ); -- Not read via match-specific
    
    RETURN chat_count + comment_count;
END;
$$;


ALTER FUNCTION "public"."get_combined_unread_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_combined_unread_count_for_user"("p_user_id" "uuid") RETURNS bigint
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    chat_count BIGINT;
    comment_count BIGINT;
BEGIN
    -- Get chat unread count for user
    SELECT COALESCE(SUM(cnt), 0) INTO chat_count
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
    
    -- Get comment unread count for user (considering both kicker-wide and match-specific read status)
    SELECT COALESCE(COUNT(*), 0) INTO comment_count
    FROM match_comments mc
    INNER JOIN player p ON p.kicker_id = mc.kicker_id AND p.user_id = p_user_id
    LEFT JOIN comment_read_status crs ON crs.kicker_id = mc.kicker_id AND crs.user_id = p_user_id
    LEFT JOIN match_comment_read_status mcrs ON mcrs.match_id = mc.match_id AND mcrs.user_id = p_user_id
    WHERE mc.player_id != p.id  -- Don't count own comments
        AND mc.created_at > COALESCE(crs.last_read_at, '1970-01-01'::TIMESTAMPTZ)  -- Not read via kicker-wide
        AND mc.created_at > COALESCE(mcrs.last_read_at, '1970-01-01'::TIMESTAMPTZ); -- Not read via match-specific
    
    RETURN chat_count + comment_count;
END;
$$;


ALTER FUNCTION "public"."get_combined_unread_count_for_user"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_kicker_invite_preview"("invite_token" "uuid", "inviter_player_id" bigint DEFAULT NULL::bigint) RETURNS TABLE("kicker_id" bigint, "kicker_name" "text", "kicker_avatar" "text", "inviter_name" "text", "inviter_avatar" "text", "sample_players" "jsonb", "player_count" bigint)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    found_kicker_id bigint;
BEGIN
    -- Find kicker by access token
    SELECT k.id INTO found_kicker_id
    FROM public.kicker k
    WHERE k.access_token = invite_token;

    IF found_kicker_id IS NULL THEN
        RAISE EXCEPTION 'Invalid invite token';
    END IF;

    RETURN QUERY
    SELECT 
        k.id as kicker_id,
        k.name as kicker_name,
        k.avatar as kicker_avatar,
        -- Get inviter info if player_id provided
        (
            SELECT p.name 
            FROM public.player p 
            WHERE p.id = inviter_player_id 
            AND p.kicker_id = k.id
        ) as inviter_name,
        (
            SELECT p.avatar 
            FROM public.player p 
            WHERE p.id = inviter_player_id 
            AND p.kicker_id = k.id
        ) as inviter_avatar,
        -- Get 3 random players (excluding inviter)
        (
            SELECT jsonb_agg(player_info)
            FROM (
                SELECT jsonb_build_object(
                    'name', p.name,
                    'avatar', p.avatar
                ) as player_info
                FROM public.player p
                WHERE p.kicker_id = k.id
                AND (inviter_player_id IS NULL OR p.id != inviter_player_id)
                ORDER BY random()
                LIMIT 3
            ) sub
        ) as sample_players,
        -- Total player count
        (
            SELECT COUNT(*)
            FROM public.player p
            WHERE p.kicker_id = k.id
        ) as player_count
    FROM public.kicker k
    WHERE k.id = found_kicker_id;
END;
$$;


ALTER FUNCTION "public"."get_kicker_invite_preview"("invite_token" "uuid", "inviter_player_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_kicker_permissions"("p_kicker_id" bigint) RETURNS TABLE("user_id" "uuid", "player_id" bigint, "player_name" "text", "player_avatar" "text", "permission_type" "text", "granted_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.user_id,
        p.id as player_id,
        p.name as player_name,
        p.avatar as player_avatar,
        up.permission_type,
        up.granted_at
    FROM player p
    LEFT JOIN user_permissions up 
        ON p.user_id = up.user_id 
        AND up.kicker_id = p_kicker_id
    WHERE p.kicker_id = p_kicker_id
    ORDER BY p.name;
END;
$$;


ALTER FUNCTION "public"."get_kicker_permissions"("p_kicker_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_mention_notifications"("p_limit" integer DEFAULT 50, "p_offset" integer DEFAULT 0) RETURNS TABLE("id" bigint, "type" character varying, "source_id" bigint, "match_id" bigint, "kicker_id" bigint, "kicker_name" "text", "sender_player_id" bigint, "sender_player_name" "text", "sender_avatar" "text", "content_preview" "text", "is_read" boolean, "created_at" timestamp with time zone, "match_info" "jsonb", "team_invitation_id" bigint, "team_info" "jsonb")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        mn.id,
        mn.type,
        mn.source_id,
        mn.match_id,
        mn.kicker_id,
        k.name AS kicker_name,
        mn.sender_player_id,
        p.name AS sender_player_name,
        p.avatar AS sender_avatar,
        mn.content_preview,
        mn.is_read,
        mn.created_at,
        CASE 
            WHEN mn.match_id IS NOT NULL THEN
                jsonb_build_object(
                    'id', m.id,
                    'player1_name', p1.name,
                    'player2_name', p2.name,
                    'player3_name', p3.name,
                    'player4_name', p4.name,
                    'scoreTeam1', m."scoreTeam1",
                    'scoreTeam2', m."scoreTeam2"
                )
            ELSE NULL
        END AS match_info,
        mn.team_invitation_id,
        CASE 
            WHEN mn.team_invitation_id IS NOT NULL THEN
                jsonb_build_object(
                    'invitation_id', ti.id,
                    'team_id', t.id,
                    'team_name', t.name,
                    'team_logo_url', t.logo_url,
                    'invitation_status', ti.status
                )
            ELSE NULL
        END AS team_info
    FROM mention_notifications mn
    JOIN kicker k ON k.id = mn.kicker_id
    JOIN player p ON p.id = mn.sender_player_id
    LEFT JOIN matches m ON m.id = mn.match_id
    LEFT JOIN player p1 ON p1.id = m.player1
    LEFT JOIN player p2 ON p2.id = m.player2
    LEFT JOIN player p3 ON p3.id = m.player3
    LEFT JOIN player p4 ON p4.id = m.player4
    LEFT JOIN team_invitations ti ON ti.id = mn.team_invitation_id
    LEFT JOIN teams t ON t.id = ti.team_id
    WHERE mn.user_id = auth.uid()
      AND mn.type != 'chat_all'  -- Exclude chat_all from notification bell
    ORDER BY mn.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;


ALTER FUNCTION "public"."get_mention_notifications"("p_limit" integer, "p_offset" integer) OWNER TO "postgres";


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


CREATE TABLE IF NOT EXISTS "public"."team_season_rankings" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "team_id" bigint NOT NULL,
    "season_id" bigint NOT NULL,
    "wins" bigint DEFAULT 0 NOT NULL,
    "losses" bigint DEFAULT 0 NOT NULL,
    "mmr" bigint DEFAULT 1000 NOT NULL,
    "bounty_claimed" integer DEFAULT 0
);


ALTER TABLE "public"."team_season_rankings" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_or_create_team_season_ranking"("p_team_id" bigint, "p_season_id" bigint) RETURNS "public"."team_season_rankings"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_ranking team_season_rankings;
BEGIN
    -- Try to get existing ranking
    SELECT * INTO v_ranking
    FROM team_season_rankings
    WHERE team_id = p_team_id AND season_id = p_season_id;
    
    -- If not found, create it
    IF v_ranking IS NULL THEN
        INSERT INTO team_season_rankings (team_id, season_id, wins, losses, mmr)
        VALUES (p_team_id, p_season_id, 0, 0, 1000)
        RETURNING * INTO v_ranking;
    END IF;
    
    RETURN v_ranking;
END;
$$;


ALTER FUNCTION "public"."get_or_create_team_season_ranking"("p_team_id" bigint, "p_season_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_pending_team_invitations"("p_player_id" bigint) RETURNS TABLE("invitation_id" bigint, "team_id" bigint, "team_name" character varying, "inviting_player_id" bigint, "inviting_player_name" "text", "inviting_player_avatar" "text", "created_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ti.id AS invitation_id,
        t.id AS team_id,
        t.name AS team_name,
        ti.inviting_player_id,
        p.name AS inviting_player_name,
        p.avatar AS inviting_player_avatar,
        ti.created_at
    FROM team_invitations ti
    JOIN teams t ON ti.team_id = t.id
    JOIN player p ON ti.inviting_player_id = p.id
    WHERE ti.invited_player_id = p_player_id
    AND ti.status = 'pending'
    ORDER BY ti.created_at DESC;
END;
$$;


ALTER FUNCTION "public"."get_pending_team_invitations"("p_player_id" bigint) OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "public"."get_player_status"("p_player_id" bigint) RETURNS TABLE("gamemode" "text", "current_streak" integer, "current_bounty" integer, "active_statuses" "text"[], "primary_status" "text", "updated_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ps.gamemode,
        ps.current_streak,
        ps.current_bounty,
        ps.active_statuses,
        -- Primary status is the highest priority active status
        (
            SELECT sd.asset_key
            FROM status_definitions sd
            WHERE sd.key = ANY(ps.active_statuses)
            ORDER BY sd.priority DESC
            LIMIT 1
        ) as primary_status,
        ps.updated_at
    FROM player_status ps
    WHERE ps.player_id = p_player_id;
END;
$$;


ALTER FUNCTION "public"."get_player_status"("p_player_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_player_team_stats"("p_player_id" bigint, "p_season_id" bigint DEFAULT NULL::bigint) RETURNS TABLE("wins" bigint, "losses" bigint, "bounty_claimed" bigint)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    IF p_season_id IS NULL THEN
        -- All-time stats from teams table
        RETURN QUERY
        SELECT 
            COALESCE(SUM(t.wins), 0)::BIGINT AS wins,
            COALESCE(SUM(t.losses), 0)::BIGINT AS losses,
            0::BIGINT AS bounty_claimed  -- All-time bounty not tracked separately
        FROM teams t
        WHERE (t.player1_id = p_player_id OR t.player2_id = p_player_id);
    ELSE
        -- Season-specific stats from team_season_rankings
        RETURN QUERY
        SELECT 
            COALESCE(SUM(tsr.wins), 0)::BIGINT AS wins,
            COALESCE(SUM(tsr.losses), 0)::BIGINT AS losses,
            COALESCE(SUM(tsr.bounty_claimed), 0)::BIGINT AS bounty_claimed
        FROM teams t
        JOIN team_season_rankings tsr ON t.id = tsr.team_id AND tsr.season_id = p_season_id
        WHERE (t.player1_id = p_player_id OR t.player2_id = p_player_id);
    END IF;
END;
$$;


ALTER FUNCTION "public"."get_player_team_stats"("p_player_id" bigint, "p_season_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_player_unlocked_rewards"("p_player_id" bigint) RETURNS TABLE("reward_id" bigint, "reward_key" "text", "reward_name" "text", "reward_description" "text", "reward_type" "text", "display_position" "text", "display_value" "text", "icon" "text", "achievement_key" "text", "achievement_name" "text", "is_selected" boolean)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        rd.id AS reward_id,
        rd.key AS reward_key,
        rd.name AS reward_name,
        rd.description AS reward_description,
        rd.type AS reward_type,
        rd.display_position,
        rd.display_value,
        rd.icon,
        rd.achievement_key,
        ad.name AS achievement_name,
        CASE WHEN psr.id IS NOT NULL THEN true ELSE false END AS is_selected
    FROM reward_definitions rd
    -- Join to get the achievement definition name
    LEFT JOIN achievement_definitions ad ON rd.achievement_key = ad.key
    -- Check if this reward is currently selected
    LEFT JOIN player_selected_rewards psr 
        ON psr.player_id = p_player_id 
        AND psr.reward_id = rd.id 
        AND psr.reward_type = rd.type
    WHERE 
        -- Reward has no achievement requirement (always unlocked)
        rd.achievement_key IS NULL
        OR
        -- Player has unlocked the achievement
        EXISTS (
            SELECT 1 
            FROM player_achievements pa
            JOIN achievement_definitions ad2 ON pa.achievement_id = ad2.id
            WHERE pa.player_id = p_player_id 
            AND ad2.key = rd.achievement_key
        )
    ORDER BY rd.type, rd.sort_order;
END;
$$;


ALTER FUNCTION "public"."get_player_unlocked_rewards"("p_player_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_player_with_rewards"("p_player_id" bigint) RETURNS TABLE("player_id" bigint, "player_name" "text", "avatar" "text", "title_id" bigint, "title_name" "text", "title_display_position" "text", "title_display_value" "text", "frame_id" bigint, "frame_name" "text", "frame_display_value" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id AS player_id,
        p.name AS player_name,
        p.avatar,
        t.id AS title_id,
        t.name AS title_name,
        t.display_position AS title_display_position,
        t.display_value AS title_display_value,
        f.id AS frame_id,
        f.name AS frame_name,
        f.display_value AS frame_display_value
    FROM player p
    LEFT JOIN player_selected_rewards psr_title 
        ON p.id = psr_title.player_id AND psr_title.reward_type = 'title'
    LEFT JOIN reward_definitions t 
        ON psr_title.reward_id = t.id
    LEFT JOIN player_selected_rewards psr_frame 
        ON p.id = psr_frame.player_id AND psr_frame.reward_type = 'frame'
    LEFT JOIN reward_definitions f 
        ON psr_frame.reward_id = f.id
    WHERE p.id = p_player_id;
END;
$$;


ALTER FUNCTION "public"."get_player_with_rewards"("p_player_id" bigint) OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "public"."get_players_with_bounties"("p_gamemode" "text" DEFAULT NULL::"text", "p_min_bounty" integer DEFAULT 1) RETURNS TABLE("player_id" bigint, "player_name" "text", "player_avatar" "text", "gamemode" "text", "current_streak" integer, "current_bounty" integer, "active_statuses" "text"[], "primary_status" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ps.player_id,
        p.name as player_name,
        p.avatar as player_avatar,
        ps.gamemode,
        ps.current_streak,
        ps.current_bounty,
        ps.active_statuses,
        (
            SELECT sd.asset_key
            FROM status_definitions sd
            WHERE sd.key = ANY(ps.active_statuses)
            ORDER BY sd.priority DESC
            LIMIT 1
        ) as primary_status
    FROM player_status ps
    JOIN player p ON p.id = ps.player_id
    WHERE ps.current_bounty >= p_min_bounty
      AND (p_gamemode IS NULL OR ps.gamemode = p_gamemode)
    ORDER BY ps.current_bounty DESC, ps.current_streak DESC;
END;
$$;


ALTER FUNCTION "public"."get_players_with_bounties"("p_gamemode" "text", "p_min_bounty" integer) OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "public"."get_status_display_config"("p_kicker_id" integer) RETURNS TABLE("id" integer, "status_key" character varying, "display_name" character varying, "layer" character varying, "priority" integer, "is_exclusive" boolean, "is_enabled" boolean)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sdc.id,
        sdc.status_key,
        sdc.display_name,
        sdc.layer,
        sdc.priority,
        sdc.is_exclusive,
        sdc.is_enabled
    FROM status_display_config sdc
    WHERE sdc.kicker_id = p_kicker_id
    ORDER BY sdc.priority DESC, sdc.display_name;
END;
$$;


ALTER FUNCTION "public"."get_status_display_config"("p_kicker_id" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_team_bounty"("p_player_ids" bigint[], "p_gamemode" "text") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_total_bounty INT := 0;
BEGIN
    SELECT COALESCE(SUM(current_bounty), 0)
    INTO v_total_bounty
    FROM player_status
    WHERE player_id = ANY(p_player_ids)
      AND gamemode = p_gamemode;
    
    RETURN v_total_bounty;
END;
$$;


ALTER FUNCTION "public"."get_team_bounty"("p_player_ids" bigint[], "p_gamemode" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_team_bounty_for_team"("p_team_id" bigint) RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_bounty INT;
BEGIN
    SELECT COALESCE(current_bounty, 0)
    INTO v_bounty
    FROM team_status
    WHERE team_id = p_team_id;
    
    RETURN COALESCE(v_bounty, 0);
END;
$$;


ALTER FUNCTION "public"."get_team_bounty_for_team"("p_team_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_team_mmr_history"("p_team_id" bigint, "p_limit" integer DEFAULT 50) RETURNS TABLE("id" bigint, "match_id" bigint, "mmr_before" integer, "mmr_after" integer, "mmr_change" integer, "wins_after" integer, "losses_after" integer, "created_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        th.id,
        th.match_id,
        th.mmr_before,
        th.mmr_after,
        th.mmr_change,
        th.wins_after,
        th.losses_after,
        th.created_at
    FROM team_history th
    WHERE th.team_id = p_team_id
    ORDER BY th.created_at DESC
    LIMIT p_limit;
END;
$$;


ALTER FUNCTION "public"."get_team_mmr_history"("p_team_id" bigint, "p_limit" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_team_season_rankings"("p_kicker_id" bigint, "p_season_id" bigint) RETURNS TABLE("team_id" bigint, "team_name" character varying, "logo_url" "text", "player1_id" bigint, "player1_name" "text", "player1_avatar" "text", "player2_id" bigint, "player2_name" "text", "player2_avatar" "text", "wins" bigint, "losses" bigint, "mmr" bigint, "total_matches" bigint, "win_rate" numeric)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id AS team_id,
        t.name AS team_name,
        t.logo_url,
        p1.id AS player1_id,
        p1.name::TEXT AS player1_name,
        p1.avatar AS player1_avatar,
        p2.id AS player2_id,
        p2.name::TEXT AS player2_name,
        p2.avatar AS player2_avatar,
        COALESCE(tsr.wins, 0::BIGINT) AS wins,
        COALESCE(tsr.losses, 0::BIGINT) AS losses,
        COALESCE(tsr.mmr, 1000::BIGINT) AS mmr,
        COALESCE(tsr.wins, 0) + COALESCE(tsr.losses, 0) AS total_matches,
        CASE 
            WHEN COALESCE(tsr.wins, 0) + COALESCE(tsr.losses, 0) = 0 THEN 0
            ELSE ROUND(COALESCE(tsr.wins, 0)::NUMERIC / (COALESCE(tsr.wins, 0) + COALESCE(tsr.losses, 0)) * 100, 1)
        END AS win_rate
    FROM teams t
    JOIN player p1 ON t.player1_id = p1.id
    JOIN player p2 ON t.player2_id = p2.id
    LEFT JOIN team_season_rankings tsr ON t.id = tsr.team_id AND tsr.season_id = p_season_id
    WHERE t.kicker_id = p_kicker_id
      AND t.status = 'active'
    ORDER BY COALESCE(tsr.mmr, 1000) DESC, COALESCE(tsr.wins, 0) DESC;
END;
$$;


ALTER FUNCTION "public"."get_team_season_rankings"("p_kicker_id" bigint, "p_season_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_teams_by_kicker"("p_kicker_id" bigint) RETURNS TABLE("id" bigint, "name" character varying, "logo_url" "text", "player1_id" bigint, "player1_name" "text", "player1_avatar" "text", "player2_id" bigint, "player2_name" "text", "player2_avatar" "text", "status" "text", "mmr" integer, "wins" integer, "losses" integer, "created_at" timestamp with time zone, "dissolved_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id,
        t.name,
        t.logo_url,
        t.player1_id,
        p1.name AS player1_name,
        p1.avatar AS player1_avatar,
        t.player2_id,
        p2.name AS player2_name,
        p2.avatar AS player2_avatar,
        t.status,
        t.mmr,
        t.wins,
        t.losses,
        t.created_at,
        t.dissolved_at
    FROM teams t
    JOIN player p1 ON t.player1_id = p1.id
    JOIN player p2 ON t.player2_id = p2.id
    WHERE t.kicker_id = p_kicker_id
    ORDER BY t.mmr DESC, t.wins DESC;
END;
$$;


ALTER FUNCTION "public"."get_teams_by_kicker"("p_kicker_id" bigint) OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "public"."get_unread_match_comment_count"("p_match_id" bigint) RETURNS bigint
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_player_id BIGINT;
    v_kicker_id BIGINT;
    v_last_read_at TIMESTAMPTZ;
    v_count BIGINT;
BEGIN
    -- Get kicker_id from the match
    SELECT kicker_id INTO v_kicker_id
    FROM matches
    WHERE id = p_match_id;
    
    IF v_kicker_id IS NULL THEN
        RETURN 0;
    END IF;
    
    -- Get the player ID for this user in this kicker
    SELECT id INTO v_player_id
    FROM player
    WHERE user_id = auth.uid() AND kicker_id = v_kicker_id;
    
    IF v_player_id IS NULL THEN
        RETURN 0;
    END IF;
    
    -- Get last read timestamp for this specific match
    SELECT last_read_at INTO v_last_read_at
    FROM match_comment_read_status
    WHERE user_id = auth.uid() AND match_id = p_match_id;
    
    -- Count unread comments for this match only
    SELECT COUNT(*)::BIGINT INTO v_count
    FROM match_comments mc
    WHERE mc.match_id = p_match_id
        AND mc.created_at > COALESCE(v_last_read_at, '1970-01-01'::TIMESTAMPTZ)
        AND mc.player_id != v_player_id;  -- Don't count own comments
    
    RETURN COALESCE(v_count, 0);
END;
$$;


ALTER FUNCTION "public"."get_unread_match_comment_count"("p_match_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_unread_mention_count"() RETURNS bigint
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_count BIGINT;
BEGIN
    SELECT COUNT(*)::BIGINT INTO v_count
    FROM mention_notifications
    WHERE user_id = auth.uid() 
      AND is_read = FALSE
      AND type != 'chat_all';  -- Exclude chat_all from unread count
    
    RETURN COALESCE(v_count, 0);
END;
$$;


ALTER FUNCTION "public"."get_unread_mention_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_permissions"("p_user_id" "uuid", "p_kicker_id" bigint) RETURNS TABLE("permission_type" "text", "granted_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT up.permission_type, up.granted_at
    FROM user_permissions up
    WHERE up.user_id = p_user_id
    AND up.kicker_id = p_kicker_id;
END;
$$;


ALTER FUNCTION "public"."get_user_permissions"("p_user_id" "uuid", "p_kicker_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_sessions"() RETURNS TABLE("session_id" "uuid", "created_at" timestamp with time zone, "updated_at" timestamp with time zone, "user_agent" "text", "ip" "inet")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'auth', 'public'
    AS $$
BEGIN
    -- Only return sessions for the authenticated user
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    RETURN QUERY
    SELECT 
        s.id as session_id,
        s.created_at,
        s.updated_at,
        s.user_agent,
        s.ip
    FROM auth.sessions s
    WHERE s.user_id = auth.uid()
    ORDER BY s.updated_at DESC;
END;
$$;


ALTER FUNCTION "public"."get_user_sessions"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."grant_permission"("p_user_id" "uuid", "p_kicker_id" bigint, "p_permission_type" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Check if caller is admin
    IF NOT EXISTS (
        SELECT 1 FROM kicker
        WHERE id = p_kicker_id AND admin = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Only kicker admin can grant permissions';
    END IF;

    INSERT INTO user_permissions (user_id, kicker_id, permission_type, granted_by)
    VALUES (p_user_id, p_kicker_id, p_permission_type, auth.uid())
    ON CONFLICT (user_id, kicker_id, permission_type) DO NOTHING;
    
    RETURN TRUE;
END;
$$;


ALTER FUNCTION "public"."grant_permission"("p_user_id" "uuid", "p_kicker_id" bigint, "p_permission_type" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_goal_achievement_progress"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_season_id BIGINT;
    v_achievement RECORD;
    v_gamemode_filter TEXT;
    v_goal_type_filter TEXT;
    v_progress_season_id BIGINT;
    v_new_progress INTEGER;
    v_max_progress INTEGER;
    v_parent_max_progress INTEGER;
    v_current_progress INTEGER;
    v_just_unlocked_ids BIGINT[] := ARRAY[]::BIGINT[];
    v_effective_gamemode TEXT;
BEGIN
    -- Skip goal removals/undos
    IF NEW.amount <= 0 AND NEW.goal_type != 'own_goal' THEN
        RETURN NEW;
    END IF;
    
    -- Skip own goal removals (amount = 0)
    IF NEW.goal_type = 'own_goal' AND NEW.amount = 0 THEN
        RETURN NEW;
    END IF;
    
    -- Get season_id from the match
    SELECT m.season_id INTO v_season_id
    FROM matches m
    WHERE m.id = NEW.match_id;
    
    -- Normalize gamemode: "team" should be treated as "2on2" for achievement purposes
    v_effective_gamemode := CASE WHEN NEW.gamemode = 'team' THEN '2on2' ELSE NEW.gamemode END;
    
    -- Process all counter-based GOAL_SCORED achievements
    -- ORDER BY parent_id NULLS FIRST ensures parents are processed before children
    FOR v_achievement IN 
        SELECT ad.id, ad.key, ad.max_progress, ad.is_season_specific, ad.condition, ad.parent_id
        FROM achievement_definitions ad
        WHERE ad.trigger_event = 'GOAL_SCORED'
          AND ad.condition->>'type' = 'counter'
          AND ad.condition->>'metric' IN ('goals', 'own_goals')
        ORDER BY ad.parent_id NULLS FIRST, ad.id
    LOOP
        -- Extract filters from condition
        v_gamemode_filter := v_achievement.condition->'filters'->>'gamemode';
        v_goal_type_filter := v_achievement.condition->'filters'->>'goal_type';
        
        -- Check gamemode filter (using normalized gamemode: "team" -> "2on2")
        IF v_gamemode_filter IS NOT NULL AND v_gamemode_filter != v_effective_gamemode THEN
            CONTINUE;
        END IF;
        
        -- Check goal_type filter
        IF v_goal_type_filter IS NOT NULL THEN
            IF v_goal_type_filter = 'own_goal' AND NEW.goal_type != 'own_goal' THEN
                CONTINUE;
            END IF;
            IF v_goal_type_filter != 'own_goal' AND NEW.goal_type = 'own_goal' THEN
                CONTINUE;
            END IF;
        ELSE
            -- No goal_type filter means standard goals only (not own goals)
            IF NEW.goal_type = 'own_goal' THEN
                CONTINUE;
            END IF;
        END IF;
        
        -- Skip season-specific achievements if match has no season
        IF v_achievement.is_season_specific AND v_season_id IS NULL THEN
            CONTINUE;
        END IF;
        
        -- Determine progress season_id
        IF v_achievement.is_season_specific THEN
            v_progress_season_id := v_season_id;
        ELSE
            v_progress_season_id := NULL;
        END IF;
        
        -- Check if achievement is already unlocked (skip if not repeatable)
        IF EXISTS (
            SELECT 1 FROM player_achievements pa
            WHERE pa.player_id = NEW.player_id
              AND pa.achievement_id = v_achievement.id
              AND (
                  (v_progress_season_id IS NULL AND pa.season_id IS NULL) OR
                  (pa.season_id = v_progress_season_id)
              )
        ) THEN
            CONTINUE;
        END IF;
        
        -- Check parent achievement (chain logic)
        IF v_achievement.parent_id IS NOT NULL THEN
            -- Check if parent was JUST unlocked in this trigger execution
            IF v_achievement.parent_id = ANY(v_just_unlocked_ids) THEN
                -- Parent just unlocked! Initialize child with parent's max_progress
                -- Don't count this goal again - parent already counted it
                SELECT ad.max_progress INTO v_parent_max_progress
                FROM achievement_definitions ad
                WHERE ad.id = v_achievement.parent_id;
                
                -- Initialize child progress with parent's max_progress
                v_max_progress := v_achievement.max_progress;
                v_new_progress := LEAST(v_parent_max_progress, v_max_progress);
                
                -- Insert the initialized progress
                BEGIN
                    INSERT INTO player_achievement_progress (
                        player_id, achievement_id, current_progress, season_id, updated_at
                    ) VALUES (
                        NEW.player_id, v_achievement.id, v_new_progress, v_progress_season_id, NOW()
                    );
                EXCEPTION WHEN unique_violation THEN
                    -- Already exists, update it
                    IF v_progress_season_id IS NULL THEN
                        UPDATE player_achievement_progress
                        SET current_progress = GREATEST(current_progress, v_new_progress),
                            updated_at = NOW()
                        WHERE player_id = NEW.player_id 
                          AND achievement_id = v_achievement.id
                          AND season_id IS NULL;
                    ELSE
                        UPDATE player_achievement_progress
                        SET current_progress = GREATEST(current_progress, v_new_progress),
                            updated_at = NOW()
                        WHERE player_id = NEW.player_id 
                          AND achievement_id = v_achievement.id
                          AND season_id = v_progress_season_id;
                    END IF;
                END;
                
                -- Check if child is also completed
                IF v_new_progress >= v_max_progress THEN
                    BEGIN
                        INSERT INTO player_achievements (
                            player_id, achievement_id, unlocked_at, season_id, match_id
                        ) VALUES (
                            NEW.player_id, v_achievement.id, NOW(), v_progress_season_id, NEW.match_id
                        );
                        v_just_unlocked_ids := array_append(v_just_unlocked_ids, v_achievement.id);
                    EXCEPTION WHEN unique_violation THEN
                        NULL;
                    END;
                END IF;
                
                CONTINUE; -- Skip normal increment for this achievement
            END IF;
            
            -- Parent was not just unlocked - check if it was previously unlocked
            IF NOT EXISTS (
                SELECT 1 FROM player_achievements pa
                WHERE pa.player_id = NEW.player_id
                  AND pa.achievement_id = v_achievement.parent_id
            ) THEN
                CONTINUE; -- Parent not unlocked, skip this child
            END IF;
        END IF;
        
        -- Get max_progress
        v_max_progress := v_achievement.max_progress;
        
        -- Increment progress using loop-based upsert pattern
        LOOP
            -- Try UPDATE first
            IF v_progress_season_id IS NULL THEN
                UPDATE player_achievement_progress
                SET current_progress = LEAST(current_progress + 1, v_max_progress),
                    updated_at = NOW()
                WHERE player_id = NEW.player_id 
                  AND achievement_id = v_achievement.id
                  AND season_id IS NULL
                RETURNING current_progress INTO v_new_progress;
            ELSE
                UPDATE player_achievement_progress
                SET current_progress = LEAST(current_progress + 1, v_max_progress),
                    updated_at = NOW()
                WHERE player_id = NEW.player_id 
                  AND achievement_id = v_achievement.id
                  AND season_id = v_progress_season_id
                RETURNING current_progress INTO v_new_progress;
            END IF;
            
            -- If UPDATE succeeded, exit loop
            IF FOUND THEN
                EXIT;
            END IF;
            
            -- Try INSERT
            BEGIN
                v_new_progress := LEAST(1, v_max_progress);
                INSERT INTO player_achievement_progress (
                    player_id, achievement_id, current_progress, season_id, updated_at
                ) VALUES (
                    NEW.player_id, v_achievement.id, v_new_progress, v_progress_season_id, NOW()
                );
                EXIT;
            EXCEPTION WHEN unique_violation THEN
                -- Loop back and try UPDATE again
                NULL;
            END;
        END LOOP;
        
        -- Check if achievement should be unlocked
        IF v_new_progress >= v_max_progress THEN
            BEGIN
                INSERT INTO player_achievements (
                    player_id, achievement_id, unlocked_at, season_id, match_id
                ) VALUES (
                    NEW.player_id, v_achievement.id, NOW(), v_progress_season_id, NEW.match_id
                );
                -- Track that this achievement was just unlocked (for chain children)
                v_just_unlocked_ids := array_append(v_just_unlocked_ids, v_achievement.id);
            EXCEPTION WHEN unique_violation THEN
                -- Already unlocked by another process, ignore
                NULL;
            END;
        END IF;
        
    END LOOP;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_goal_achievement_progress"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."has_permission"("p_user_id" "uuid", "p_kicker_id" bigint, "p_permission_type" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_permissions
        WHERE user_id = p_user_id
        AND kicker_id = p_kicker_id
        AND permission_type = p_permission_type
    );
END;
$$;


ALTER FUNCTION "public"."has_permission"("p_user_id" "uuid", "p_kicker_id" bigint, "p_permission_type" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_achievement_progress"("p_player_id" bigint, "p_achievement_id" bigint, "p_increment" integer DEFAULT 1, "p_season_id" bigint DEFAULT NULL::bigint) RETURNS TABLE("new_progress" integer, "max_progress" integer, "is_completed" boolean)
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_max_progress INTEGER;
    v_new_progress INTEGER;
    v_is_completed BOOLEAN := FALSE;
    v_is_season_specific BOOLEAN;
    v_progress_season_id BIGINT;
BEGIN
    -- Get max_progress and is_season_specific from achievement definition
    SELECT ad.max_progress, COALESCE(ad.is_season_specific, true) 
    INTO v_max_progress, v_is_season_specific
    FROM achievement_definitions ad
    WHERE ad.id = p_achievement_id;
    
    IF v_max_progress IS NULL THEN
        RAISE EXCEPTION 'Achievement not found: %', p_achievement_id;
    END IF;

    -- Determine the season_id for progress tracking
    IF v_is_season_specific THEN
        v_progress_season_id := p_season_id;
    ELSE
        v_progress_season_id := NULL;
    END IF;

    -- LOOP-BASED UPSERT: Most robust pattern for concurrent updates
    -- Keeps retrying until UPDATE or INSERT succeeds
    LOOP
        -- Step 1: Try UPDATE first (works if record exists)
        IF v_progress_season_id IS NULL THEN
            UPDATE player_achievement_progress
            SET current_progress = LEAST(current_progress + p_increment, v_max_progress),
                updated_at = NOW()
            WHERE player_id = p_player_id 
              AND achievement_id = p_achievement_id
              AND season_id IS NULL
            RETURNING current_progress INTO v_new_progress;
        ELSE
            UPDATE player_achievement_progress
            SET current_progress = LEAST(current_progress + p_increment, v_max_progress),
                updated_at = NOW()
            WHERE player_id = p_player_id 
              AND achievement_id = p_achievement_id
              AND season_id = v_progress_season_id
            RETURNING current_progress INTO v_new_progress;
        END IF;

        -- If UPDATE succeeded, exit loop
        IF FOUND THEN
            EXIT;
        END IF;

        -- Step 2: UPDATE didn't find a row, try INSERT
        BEGIN
            v_new_progress := LEAST(p_increment, v_max_progress);
            
            INSERT INTO player_achievement_progress (
                player_id, 
                achievement_id, 
                current_progress,
                season_id,
                updated_at
            )
            VALUES (
                p_player_id, 
                p_achievement_id, 
                v_new_progress,
                v_progress_season_id,
                NOW()
            );
            -- INSERT succeeded, exit loop
            EXIT;
        EXCEPTION WHEN unique_violation THEN
            -- Another transaction inserted first, loop back and UPDATE
            -- This is the key: we LOOP BACK instead of trying to UPDATE here
            NULL;
        END;
    END LOOP;

    -- Check if achievement is now completed
    IF v_new_progress >= v_max_progress THEN
        BEGIN
            IF v_progress_season_id IS NULL THEN
                INSERT INTO player_achievements (
                    player_id, achievement_id, unlocked_at, season_id
                ) 
                SELECT p_player_id, p_achievement_id, NOW(), NULL
                WHERE NOT EXISTS (
                    SELECT 1 FROM player_achievements
                    WHERE player_id = p_player_id 
                      AND achievement_id = p_achievement_id
                      AND season_id IS NULL
                );
            ELSE
                INSERT INTO player_achievements (
                    player_id, achievement_id, unlocked_at, season_id
                )
                SELECT p_player_id, p_achievement_id, NOW(), p_season_id
                WHERE NOT EXISTS (
                    SELECT 1 FROM player_achievements
                    WHERE player_id = p_player_id 
                      AND achievement_id = p_achievement_id
                      AND season_id = p_season_id
                );
            END IF;
            
            IF FOUND THEN
                v_is_completed := TRUE;
            END IF;
        EXCEPTION WHEN unique_violation THEN
            -- Achievement already awarded by another concurrent request
            v_is_completed := FALSE;
        END;
    END IF;

    RETURN QUERY SELECT v_new_progress, v_max_progress, v_is_completed;
END;
$$;


ALTER FUNCTION "public"."increment_achievement_progress"("p_player_id" bigint, "p_achievement_id" bigint, "p_increment" integer, "p_season_id" bigint) OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "public"."mark_all_mentions_as_read"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    UPDATE mention_notifications
    SET is_read = TRUE
    WHERE user_id = auth.uid() AND is_read = FALSE;
END;
$$;


ALTER FUNCTION "public"."mark_all_mentions_as_read"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."mark_mention_as_read"("p_notification_id" bigint) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    UPDATE mention_notifications
    SET is_read = TRUE
    WHERE id = p_notification_id AND user_id = auth.uid();
END;
$$;


ALTER FUNCTION "public"."mark_mention_as_read"("p_notification_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_achievement_unlocked"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    payload JSON;
BEGIN
    -- Build payload matching the webhook format
    payload := json_build_object(
        'type', 'INSERT',
        'table', 'player_achievements',
        'schema', 'public',
        'record', row_to_json(NEW),
        'old_record', NULL
    );
    
    -- Call the Edge Function via pg_net (if available) or http extension
    -- Note: You may need to adjust this based on your Supabase setup
    PERFORM
        net.http_post(
            url := current_setting('app.settings.edge_function_url', true) || '/process-achievement',
            headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
            ),
            body := payload::jsonb
        );
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail the insert
        RAISE WARNING 'Failed to notify achievement unlocked: %', SQLERRM;
        RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."notify_achievement_unlocked"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."notify_achievement_unlocked"() IS 'Triggers the process-achievement Edge Function when a player unlocks an achievement';



CREATE OR REPLACE FUNCTION "public"."notify_mention"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    IF NEW.content LIKE '%@%' THEN
        PERFORM net.http_post(
            url := 'https://dixhaxicjwqchhautpje.supabase.co/functions/v1/send-push-notification',
            headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'apikey', 'sb_secret_#########################',
                'Authorization', 'Bearer sb_secret_#########################'
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


CREATE OR REPLACE FUNCTION "public"."record_team_history"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Only process if this is a team match (has team1_id and team2_id)
    IF NEW.team1_id IS NOT NULL AND NEW.team2_id IS NOT NULL THEN
        -- Record history for team 1
        INSERT INTO team_history (
            team_id,
            match_id,
            mmr_before,
            mmr_after,
            mmr_change,
            wins_before,
            wins_after,
            losses_before,
            losses_after
        )
        SELECT 
            NEW.team1_id,
            NEW.id,
            t.mmr - COALESCE(NEW."mmrChangeTeam1", 0),
            t.mmr,
            COALESCE(NEW."mmrChangeTeam1", 0),
            CASE WHEN NEW."scoreTeam1" > NEW."scoreTeam2" THEN t.wins - 1 ELSE t.wins END,
            t.wins,
            CASE WHEN NEW."scoreTeam1" < NEW."scoreTeam2" THEN t.losses - 1 ELSE t.losses END,
            t.losses
        FROM teams t
        WHERE t.id = NEW.team1_id;

        -- Record history for team 2
        INSERT INTO team_history (
            team_id,
            match_id,
            mmr_before,
            mmr_after,
            mmr_change,
            wins_before,
            wins_after,
            losses_before,
            losses_after
        )
        SELECT 
            NEW.team2_id,
            NEW.id,
            t.mmr - COALESCE(NEW."mmrChangeTeam2", 0),
            t.mmr,
            COALESCE(NEW."mmrChangeTeam2", 0),
            CASE WHEN NEW."scoreTeam2" > NEW."scoreTeam1" THEN t.wins - 1 ELSE t.wins END,
            t.wins,
            CASE WHEN NEW."scoreTeam2" < NEW."scoreTeam1" THEN t.losses - 1 ELSE t.losses END,
            t.losses
        FROM teams t
        WHERE t.id = NEW.team2_id;
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."record_team_history"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."revoke_permission"("p_user_id" "uuid", "p_kicker_id" bigint, "p_permission_type" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Check if caller is admin
    IF NOT EXISTS (
        SELECT 1 FROM kicker
        WHERE id = p_kicker_id AND admin = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Only kicker admin can revoke permissions';
    END IF;

    DELETE FROM user_permissions
    WHERE user_id = p_user_id
    AND kicker_id = p_kicker_id
    AND permission_type = p_permission_type;
    
    RETURN TRUE;
END;
$$;


ALTER FUNCTION "public"."revoke_permission"("p_user_id" "uuid", "p_kicker_id" bigint, "p_permission_type" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_device_notifications_enabled"("p_subscription_id" bigint, "p_enabled" boolean) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Get the user_id of the subscription
    SELECT user_id INTO v_user_id
    FROM push_subscriptions
    WHERE id = p_subscription_id;
    
    -- Check if subscription exists and belongs to current user
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Subscription not found';
    END IF;
    
    IF v_user_id != auth.uid() THEN
        RAISE EXCEPTION 'Not authorized to update this subscription';
    END IF;
    
    -- Update the enabled status
    UPDATE push_subscriptions
    SET 
        enabled = p_enabled,
        updated_at = NOW()
    WHERE id = p_subscription_id;
    
    RETURN TRUE;
END;
$$;


ALTER FUNCTION "public"."set_device_notifications_enabled"("p_subscription_id" bigint, "p_enabled" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_global_notifications_enabled"("p_enabled" boolean) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_user_id UUID;
BEGIN
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;
    
    -- Upsert the user's notification settings
    INSERT INTO user_notification_settings (user_id, notifications_enabled, updated_at)
    VALUES (v_user_id, p_enabled, NOW())
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        notifications_enabled = p_enabled,
        updated_at = NOW();
    
    RETURN TRUE;
END;
$$;


ALTER FUNCTION "public"."set_global_notifications_enabled"("p_enabled" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_point_collector_on_achievement"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_achievement_key TEXT;
    v_season_points INTEGER;
    v_global_points INTEGER;
BEGIN
    -- Get the key of the achievement that was just unlocked
    SELECT key INTO v_achievement_key
    FROM achievement_definitions
    WHERE id = NEW.achievement_id;

    -- Skip if this IS a point collector achievement (prevent infinite loop)
    -- Also skip if achievement not found
    IF v_achievement_key IS NULL OR v_achievement_key LIKE 'achievement_points_%' THEN
        RETURN NEW;
    END IF;

    -- Calculate season-specific points (only from season-specific achievements in this season)
    IF NEW.season_id IS NOT NULL THEN
        SELECT COALESCE(SUM(ad.points), 0) INTO v_season_points
        FROM player_achievements pa
        JOIN achievement_definitions ad ON pa.achievement_id = ad.id
        WHERE pa.player_id = NEW.player_id
        AND pa.season_id = NEW.season_id
        AND ad.is_season_specific = true
        AND ad.key NOT LIKE 'achievement_points_%';  -- Don't count point collector points

        -- Update season Point Collector chain (5000 -> 10000 -> 25000)
        PERFORM update_point_collector_progress(
            NEW.player_id,
            'achievement_points_5000',
            v_season_points,
            NEW.season_id
        );
    END IF;

    -- Calculate global points (ALL achievements, all time)
    SELECT COALESCE(SUM(ad.points), 0) INTO v_global_points
    FROM player_achievements pa
    JOIN achievement_definitions ad ON pa.achievement_id = ad.id
    WHERE pa.player_id = NEW.player_id
    AND ad.key NOT LIKE 'achievement_points_%';  -- Don't count point collector points

    -- Update global Point Collector chain (15000 -> 50000 -> 100000)
    PERFORM update_point_collector_progress(
        NEW.player_id,
        'achievement_points_15000_global',
        v_global_points,
        NULL
    );

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."sync_point_collector_on_achievement"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."terminate_other_sessions"("current_session_id" "text") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'auth', 'public'
    AS $$
DECLARE
    deleted_count integer;
    session_uuid uuid;
    deleted_session_ids uuid[];
BEGIN
    -- Only allow authenticated users
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Cast the text parameter to uuid
    session_uuid := current_session_id::uuid;

    -- Delete all sessions for this user except the current one
    -- and collect deleted session IDs
    WITH deleted AS (
        DELETE FROM auth.sessions
        WHERE user_id = auth.uid()
        AND id != session_uuid
        RETURNING id
    )
    SELECT COUNT(*), ARRAY_AGG(id) INTO deleted_count, deleted_session_ids FROM deleted;

    -- Delete refresh tokens for the deleted sessions using the collected IDs
    IF deleted_session_ids IS NOT NULL AND array_length(deleted_session_ids, 1) > 0 THEN
        DELETE FROM auth.refresh_tokens
        WHERE user_id = auth.uid()::text
        AND session_id = ANY(deleted_session_ids);
    END IF;

    RETURN deleted_count;
END;
$$;


ALTER FUNCTION "public"."terminate_other_sessions"("current_session_id" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."terminate_session"("target_session_id" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'auth', 'public'
    AS $$
DECLARE
    session_user_id uuid;
    session_uuid uuid;
BEGIN
    -- Only allow authenticated users
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Cast the text parameter to uuid
    session_uuid := target_session_id::uuid;

    -- Check if the session belongs to the current user
    SELECT user_id INTO session_user_id
    FROM auth.sessions
    WHERE id = session_uuid;

    IF session_user_id IS NULL THEN
        RAISE EXCEPTION 'Session not found';
    END IF;

    IF session_user_id != auth.uid() THEN
        RAISE EXCEPTION 'Cannot terminate another user''s session';
    END IF;

    -- Delete the session
    DELETE FROM auth.sessions WHERE id = session_uuid;

    -- Also delete any refresh tokens associated with this session
    DELETE FROM auth.refresh_tokens WHERE session_id = session_uuid;

    RETURN true;
END;
$$;


ALTER FUNCTION "public"."terminate_session"("target_session_id" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_create_chat_all_notifications"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_content_preview TEXT;
    v_player_record RECORD;
BEGIN
    -- Skip whispers (private messages)
    IF NEW.recipient_id IS NOT NULL THEN
        RETURN NEW;
    END IF;
    
    -- Truncate content for preview (max 100 chars)
    v_content_preview := LEFT(NEW.content, 100);
    IF LENGTH(NEW.content) > 100 THEN
        v_content_preview := v_content_preview || '...';
    END IF;
    
    -- Insert notification for all players in the kicker (except sender)
    -- who have notify_all_chat enabled on at least one subscription
    -- But EXCLUDE players who are already getting a mention notification (have @mention in content)
    FOR v_player_record IN 
        SELECT DISTINCT pl.id, pl.user_id 
        FROM player pl 
        INNER JOIN push_subscriptions ps ON ps.user_id = pl.user_id
        WHERE pl.kicker_id = NEW.kicker_id 
          AND pl.id != NEW.player_id
          AND pl.user_id IS NOT NULL
          AND ps.notify_all_chat = TRUE
          -- Exclude players who are mentioned (they get a 'chat' type notification instead)
          AND NOT EXISTS (
              SELECT 1 
              FROM regexp_matches(NEW.content, '@\[[^\]]+\]\(' || pl.id::TEXT || '\)', 'g')
          )
          -- Also exclude if @everyone is used (they get 'chat' notification)
          AND NEW.content NOT LIKE '%@everyone%'
    LOOP
        INSERT INTO mention_notifications (
            user_id, type, source_id, match_id, kicker_id, 
            sender_player_id, content_preview, is_read, created_at
        )
        VALUES (
            v_player_record.user_id, 'chat_all', NEW.id, NULL, NEW.kicker_id,
            NEW.player_id, v_content_preview, FALSE, NOW()
        )
        ON CONFLICT DO NOTHING;
    END LOOP;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_create_chat_all_notifications"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_create_chat_mention_notifications"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    PERFORM create_mention_notifications(
        NEW.content,
        'chat',
        NEW.id,
        NULL,  -- chat messages don't have match_id
        NEW.kicker_id,
        NEW.player_id
    );
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_create_chat_mention_notifications"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_create_comment_mention_notifications"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    PERFORM create_mention_notifications(
        NEW.content,
        'comment',
        NEW.id,
        NEW.match_id,
        NEW.kicker_id,
        NEW.player_id
    );
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_create_comment_mention_notifications"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_create_team_invite_notification"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_invited_user_id UUID;
    v_inviting_player_name TEXT;
    v_team_name TEXT;
BEGIN
    -- Only process pending invitations
    IF NEW.status != 'pending' THEN
        RETURN NEW;
    END IF;

    -- Get the user_id of the invited player
    SELECT user_id INTO v_invited_user_id
    FROM player
    WHERE id = NEW.invited_player_id;

    -- Skip if invited player has no user_id
    IF v_invited_user_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- Get inviting player name
    SELECT name INTO v_inviting_player_name
    FROM player
    WHERE id = NEW.inviting_player_id;

    -- Get team name (table is called "teams" not "team")
    SELECT name INTO v_team_name
    FROM teams
    WHERE id = NEW.team_id;

    -- Insert notification
    INSERT INTO mention_notifications (
        user_id, type, source_id, kicker_id,
        sender_player_id, content_preview, team_invitation_id, is_read, created_at
    )
    VALUES (
        v_invited_user_id,
        'team_invite',
        NEW.id,
        (SELECT kicker_id FROM player WHERE id = NEW.inviting_player_id),
        NEW.inviting_player_id,
        v_inviting_player_name || ' invited you to join team "' || v_team_name || '"',
        NEW.id,
        FALSE,
        NOW()
    )
    ON CONFLICT DO NOTHING;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_create_team_invite_notification"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_mark_team_invite_notification_read"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Only act when status changes from 'pending' to something else
    IF OLD.status = 'pending' AND NEW.status != 'pending' THEN
        UPDATE mention_notifications
        SET is_read = TRUE
        WHERE team_invitation_id = NEW.id AND is_read = FALSE;
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_mark_team_invite_notification_read"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_process_achievement"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
declare
  endpoint_url text := 'https://dixhaxicjwqchhautpje.supabase.co/functions/v1/process-achievement';
  secret_key text := 'sb_secret_#########################';
  webhook_name text := TG_ARGV[0];
begin
  perform net.http_post(
      url := endpoint_url,
      headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'apikey', secret_key,
          'Authorization', 'Bearer ' || secret_key
      ),
      body := jsonb_build_object(
          'webhook_name', webhook_name, 
          'type', TG_OP,
          'table', TG_TABLE_NAME,
          'schema', TG_TABLE_SCHEMA,
          'record', new,                
          'old_record', old             
      )
  );
  return new;
end;
$$;


ALTER FUNCTION "public"."trigger_process_achievement"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_send_push_notification"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_supabase_url TEXT;
    v_service_role_key TEXT;
    v_request_id BIGINT;
BEGIN
    -- Get Supabase URL and service role key from vault
    SELECT decrypted_secret INTO v_supabase_url 
    FROM vault.decrypted_secrets 
    WHERE name = 'supabase_url';
    
    SELECT decrypted_secret INTO v_service_role_key 
    FROM vault.decrypted_secrets 
    WHERE name = 'service_role_key';
    
    -- Only send push if we have the secrets configured
    IF v_supabase_url IS NOT NULL AND v_service_role_key IS NOT NULL THEN
        SELECT net.http_post(
            url := v_supabase_url || '/functions/v1/send-push-notification',
            headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'Authorization', 'Bearer ' || v_service_role_key
            ),
            body := jsonb_build_object(
                'type', 'INSERT',
                'table', 'mention_notifications',
                'schema', 'public',
                'record', jsonb_build_object(
                    'id', NEW.id,
                    'user_id', NEW.user_id,
                    'type', NEW.type,
                    'source_id', NEW.source_id,
                    'match_id', NEW.match_id,
                    'kicker_id', NEW.kicker_id,
                    'sender_player_id', NEW.sender_player_id,
                    'content_preview', NEW.content_preview,
                    'team_invitation_id', NEW.team_invitation_id,
                    'is_read', NEW.is_read,
                    'created_at', NEW.created_at
                )
            )
        ) INTO v_request_id;
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_send_push_notification"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_achievement_definition_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_achievement_definition_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_achievement_progress_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_achievement_progress_updated_at"() OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "public"."update_match_comment_read_status"("p_match_id" bigint) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    INSERT INTO match_comment_read_status (user_id, match_id, last_read_at, updated_at)
    VALUES (auth.uid(), p_match_id, NOW(), NOW())
    ON CONFLICT (user_id, match_id)
    DO UPDATE SET 
        last_read_at = NOW(),
        updated_at = NOW();
END;
$$;


ALTER FUNCTION "public"."update_match_comment_read_status"("p_match_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_notification_preferences"("p_subscription_id" bigint, "p_notify_all_chat" boolean DEFAULT NULL::boolean, "p_notify_mentions" boolean DEFAULT NULL::boolean, "p_notify_team_invites" boolean DEFAULT NULL::boolean) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Get the user_id of the subscription
    SELECT user_id INTO v_user_id
    FROM push_subscriptions
    WHERE id = p_subscription_id;
    
    -- Check if subscription exists and belongs to current user
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Subscription not found';
    END IF;
    
    IF v_user_id != auth.uid() THEN
        RAISE EXCEPTION 'Not authorized to update this subscription';
    END IF;
    
    -- Update only the provided preferences
    UPDATE push_subscriptions
    SET 
        notify_all_chat = COALESCE(p_notify_all_chat, notify_all_chat),
        notify_mentions = COALESCE(p_notify_mentions, notify_mentions),
        notify_team_invites = COALESCE(p_notify_team_invites, notify_team_invites),
        updated_at = NOW()
    WHERE id = p_subscription_id;
    
    RETURN TRUE;
END;
$$;


ALTER FUNCTION "public"."update_notification_preferences"("p_subscription_id" bigint, "p_notify_all_chat" boolean, "p_notify_mentions" boolean, "p_notify_team_invites" boolean) OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "public"."update_player_selected_reward"("p_player_id" bigint, "p_reward_type" "text", "p_reward_id" bigint DEFAULT NULL::bigint) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Get the user_id for the player
    SELECT user_id INTO v_user_id FROM player WHERE id = p_player_id;
    
    -- Check if the current user owns this player
    IF v_user_id != auth.uid() THEN
        RAISE EXCEPTION 'Not authorized to update rewards for this player';
    END IF;

    -- If reward_id is NULL, remove the selection
    IF p_reward_id IS NULL THEN
        DELETE FROM player_selected_rewards
        WHERE player_id = p_player_id AND reward_type = p_reward_type;
    ELSE
        -- Verify the player has unlocked this reward
        IF NOT EXISTS (
            SELECT 1 FROM reward_definitions rd
            WHERE rd.id = p_reward_id
            AND (
                rd.achievement_key IS NULL
                OR EXISTS (
                    SELECT 1 
                    FROM player_achievements pa
                    JOIN achievement_definitions ad ON pa.achievement_id = ad.id
                    WHERE pa.player_id = p_player_id 
                    AND ad.key = rd.achievement_key
                )
            )
        ) THEN
            RAISE EXCEPTION 'Reward not unlocked';
        END IF;

        -- Upsert the selection
        INSERT INTO player_selected_rewards (player_id, reward_type, reward_id, updated_at)
        VALUES (p_player_id, p_reward_type, p_reward_id, NOW())
        ON CONFLICT (player_id, reward_type) 
        DO UPDATE SET reward_id = p_reward_id, updated_at = NOW();
    END IF;

    RETURN true;
END;
$$;


ALTER FUNCTION "public"."update_player_selected_reward"("p_player_id" bigint, "p_reward_type" "text", "p_reward_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_player_status_after_match"("p_player_id" bigint, "p_match_id" bigint, "p_gamemode" "text", "p_is_winner" boolean, "p_score_diff" integer, "p_own_mmr" integer, "p_opponent_mmr" integer) RETURNS TABLE("bounty_claimed" integer, "bounty_victim_id" bigint, "new_status" "text"[], "streak" integer, "bounty_gained" integer, "old_streak" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_current_streak INT;
    v_new_streak INT;
    v_current_bounty INT;
    v_new_bounty INT;
    v_threshold_bounty INT;
    v_bounty_gained INT := 0;
    v_active_statuses TEXT[];
    v_bounty_to_claim INT := 0;
    v_bounty_victim BIGINT := NULL;
    v_opponent_status RECORD;
    v_status_def RECORD;
    v_month TEXT;
    v_was_on_loss_streak BOOLEAN := FALSE;
    v_loss_streak_before INT := 0;
    v_winner_count INT := 1;
BEGIN
    -- Get current month for monthly events
    v_month := TO_CHAR(NOW(), 'YYYY-MM');
    
    -- Get or create player status record
    INSERT INTO player_status (player_id, gamemode, current_streak, current_bounty, active_statuses)
    VALUES (p_player_id, p_gamemode, 0, 0, '{}')
    ON CONFLICT (player_id, gamemode) DO NOTHING;
    
    -- Get current status
    SELECT current_streak, current_bounty, active_statuses
    INTO v_current_streak, v_current_bounty, v_active_statuses
    FROM player_status
    WHERE player_id = p_player_id AND gamemode = p_gamemode;
    
    -- Track if player was on a loss streak (for comeback detection)
    IF v_current_streak < 0 THEN
        v_was_on_loss_streak := TRUE;
        v_loss_streak_before := ABS(v_current_streak);
    END IF;
    
    -- Calculate new streak
    IF p_is_winner THEN
        IF v_current_streak >= 0 THEN
            v_new_streak := v_current_streak + 1;
        ELSE
            v_new_streak := 1;  -- Reset from loss streak
        END IF;
    ELSE
        IF v_current_streak <= 0 THEN
            v_new_streak := v_current_streak - 1;
        ELSE
            v_new_streak := -1;  -- Reset from win streak
        END IF;
    END IF;
    
    -- ============================================
    -- FIXED BOUNTY CALCULATION
    -- Only add bounty when crossing a threshold
    -- ============================================
    IF p_is_winner AND v_new_streak >= 3 THEN
        -- Keep existing bounty as base (or 0 if coming from loss streak)
        IF v_current_streak >= 0 THEN
            v_new_bounty := v_current_bounty;
        ELSE
            v_new_bounty := 0;
        END IF;
        
        -- Check if we just crossed a threshold (3, 5, 7, or 10)
        -- Only add bounty if v_new_streak matches a threshold AND v_current_streak was below it
        SELECT bounty_per_streak INTO v_threshold_bounty
        FROM status_definitions
        WHERE type = 'streak' 
          AND (condition->>'streak_type') = 'win'
          AND (condition->>'min_streak')::int = v_new_streak
          AND v_current_streak < v_new_streak;  -- Must have just crossed this threshold
        
        -- Add threshold bounty if we crossed one
        IF v_threshold_bounty IS NOT NULL AND v_threshold_bounty > 0 THEN
            v_new_bounty := v_new_bounty + v_threshold_bounty;
            v_bounty_gained := v_threshold_bounty;  -- Track how much bounty was just gained
        END IF;
    ELSE
        -- Not on a win streak of 3+, bounty is 0
        v_new_bounty := 0;
    END IF;
    
    -- Check if we need to claim bounty from opponent (if we won and broke their streak)
    -- FIX: In 2on2, BOTH winners claim bounty from LOSING team opponents only
    IF p_is_winner THEN
        FOR v_opponent_status IN
            SELECT ps.player_id, ps.current_streak, ps.current_bounty
            FROM player_status ps
            JOIN matches m ON m.id = p_match_id
            WHERE ps.gamemode = p_gamemode
              AND ps.current_streak >= 3
              AND ps.player_id != p_player_id
              AND (
                  -- 1on1: Only one opponent, simple check
                  (p_gamemode = '1on1' AND ps.player_id IN (m.player1, m.player2))
                  OR
                  -- 2on2: Check that opponent is on the LOSING team (opposite of current player's team)
                  (p_gamemode = '2on2' AND (
                      -- If current player is on Team 1 (winner), opponent must be on Team 2 (loser)
                      (p_player_id IN (m.player1, m.player3) AND m."scoreTeam1" > m."scoreTeam2" AND ps.player_id IN (m.player2, m.player4))
                      OR
                      -- If current player is on Team 2 (winner), opponent must be on Team 1 (loser)
                      (p_player_id IN (m.player2, m.player4) AND m."scoreTeam2" > m."scoreTeam1" AND ps.player_id IN (m.player1, m.player3))
                  ))
              )
        LOOP
            v_bounty_to_claim := v_bounty_to_claim + v_opponent_status.current_bounty;
            v_bounty_victim := v_opponent_status.player_id;
            
            -- Insert into bounty_history - ON CONFLICT allows both winners to track their bounty claim
            INSERT INTO bounty_history (claimer_id, victim_id, match_id, gamemode, streak_broken, bounty_amount)
            VALUES (p_player_id, v_opponent_status.player_id, p_match_id, p_gamemode, v_opponent_status.current_streak, v_opponent_status.current_bounty)
            ON CONFLICT (claimer_id, victim_id, match_id) DO NOTHING;
        END LOOP;
        
        -- FIX: Split bounty between winners in 2on2 matches
        -- Each winner gets their share (half in 2on2, full in 1on1/2on1)
        IF p_gamemode = '2on2' AND v_bounty_to_claim > 0 THEN
            -- Count the number of winners on the winning team
            SELECT 
                CASE 
                    WHEN m."scoreTeam1" > m."scoreTeam2" THEN
                        (CASE WHEN m.player1 IS NOT NULL THEN 1 ELSE 0 END) +
                        (CASE WHEN m.player3 IS NOT NULL THEN 1 ELSE 0 END)
                    ELSE
                        (CASE WHEN m.player2 IS NOT NULL THEN 1 ELSE 0 END) +
                        (CASE WHEN m.player4 IS NOT NULL THEN 1 ELSE 0 END)
                END INTO v_winner_count
            FROM matches m
            WHERE m.id = p_match_id;
            
            -- Safety check: ensure at least 1 winner
            IF v_winner_count IS NULL OR v_winner_count < 1 THEN
                v_winner_count := 2;  -- Default to 2 for 2on2
            END IF;
            
            -- Split the bounty among winners (integer division)
            v_bounty_to_claim := v_bounty_to_claim / v_winner_count;
        END IF;
    END IF;
    
    -- Determine active statuses based on new streak
    v_active_statuses := '{}';
    
    FOR v_status_def IN
        SELECT key, condition
        FROM status_definitions
        WHERE type = 'streak'
        ORDER BY priority DESC
    LOOP
        IF (v_status_def.condition->>'streak_type') = 'win' AND v_new_streak >= (v_status_def.condition->>'min_streak')::int THEN
            v_active_statuses := array_append(v_active_statuses, v_status_def.key);
        ELSIF (v_status_def.condition->>'streak_type') = 'loss' AND v_new_streak <= -(v_status_def.condition->>'min_streak')::int THEN
            v_active_statuses := array_append(v_active_statuses, v_status_def.key);
        END IF;
    END LOOP;
    
    -- Check for special events
    
    -- Comeback King: Won after 5+ loss streak
    IF p_is_winner AND v_was_on_loss_streak AND v_loss_streak_before >= 5 THEN
        v_active_statuses := array_append(v_active_statuses, 'comeback_king');
        
        INSERT INTO player_monthly_status (player_id, gamemode, month, comeback_count)
        VALUES (p_player_id, p_gamemode, v_month, 1)
        ON CONFLICT (player_id, gamemode, month)
        DO UPDATE SET comeback_count = player_monthly_status.comeback_count + 1, updated_at = NOW();
    END IF;
    
    -- Underdog: Beat opponent with 200+ higher MMR
    IF p_is_winner AND (p_opponent_mmr - p_own_mmr) >= 200 THEN
        v_active_statuses := array_append(v_active_statuses, 'underdog');
        
        INSERT INTO player_monthly_status (player_id, gamemode, month, underdog_count)
        VALUES (p_player_id, p_gamemode, v_month, 1)
        ON CONFLICT (player_id, gamemode, month)
        DO UPDATE SET underdog_count = player_monthly_status.underdog_count + 1, updated_at = NOW();
    END IF;
    
    -- Dominator: 10-0 win
    IF p_is_winner AND p_score_diff = 10 THEN
        v_active_statuses := array_append(v_active_statuses, 'dominator');
        
        INSERT INTO player_monthly_status (player_id, gamemode, month, dominator_count)
        VALUES (p_player_id, p_gamemode, v_month, 1)
        ON CONFLICT (player_id, gamemode, month)
        DO UPDATE SET dominator_count = player_monthly_status.dominator_count + 1, updated_at = NOW();
    END IF;
    
    -- Humiliated: 0-10 loss
    IF NOT p_is_winner AND p_score_diff = -10 THEN
        v_active_statuses := array_append(v_active_statuses, 'humiliated');
        
        INSERT INTO player_monthly_status (player_id, gamemode, month, humiliated_count)
        VALUES (p_player_id, p_gamemode, v_month, 1)
        ON CONFLICT (player_id, gamemode, month)
        DO UPDATE SET humiliated_count = player_monthly_status.humiliated_count + 1, updated_at = NOW();
    END IF;
    
    -- Update player status
    UPDATE player_status
    SET current_streak = v_new_streak,
        current_bounty = v_new_bounty,
        active_statuses = v_active_statuses,
        last_match_id = p_match_id,
        updated_at = NOW()
    WHERE player_id = p_player_id AND gamemode = p_gamemode;
    
    -- Return results
    bounty_claimed := v_bounty_to_claim;
    bounty_victim_id := v_bounty_victim;
    new_status := v_active_statuses;
    streak := v_new_streak;
    bounty_gained := v_bounty_gained;
    old_streak := v_current_streak;
    
    RETURN NEXT;
END;
$$;


ALTER FUNCTION "public"."update_player_status_after_match"("p_player_id" bigint, "p_match_id" bigint, "p_gamemode" "text", "p_is_winner" boolean, "p_score_diff" integer, "p_own_mmr" integer, "p_opponent_mmr" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_point_collector_progress"("p_player_id" bigint, "p_achievement_key" "text", "p_total_points" integer, "p_season_id" bigint) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_achievement RECORD;
    v_current_key TEXT := p_achievement_key;
    v_parent_unlocked BOOLEAN := TRUE;
BEGIN
    -- Walk through the chain starting from the base achievement
    WHILE v_current_key IS NOT NULL AND v_parent_unlocked LOOP
        -- Get this achievement's details
        SELECT id, max_progress, parent_id, key INTO v_achievement
        FROM achievement_definitions
        WHERE key = v_current_key;

        IF v_achievement.id IS NULL THEN
            EXIT;  -- Achievement not found, stop
        END IF;

        -- Check if parent is unlocked (for chain achievements)
        IF v_achievement.parent_id IS NOT NULL THEN
            IF p_season_id IS NULL THEN
                SELECT EXISTS(
                    SELECT 1 FROM player_achievements
                    WHERE player_id = p_player_id
                    AND achievement_id = v_achievement.parent_id
                    AND season_id IS NULL
                ) INTO v_parent_unlocked;
            ELSE
                SELECT EXISTS(
                    SELECT 1 FROM player_achievements
                    WHERE player_id = p_player_id
                    AND achievement_id = v_achievement.parent_id
                    AND season_id = p_season_id
                ) INTO v_parent_unlocked;
            END IF;

            IF NOT v_parent_unlocked THEN
                EXIT;  -- Parent not unlocked, can't progress this chain
            END IF;
        END IF;

        -- Update or insert progress (idempotent - sets absolute value, only increases)
        -- Use UPDATE first, then INSERT to handle NULL season_id correctly
        -- Use absolute value (p_total_points), NOT GREATEST - we calculate the real total each time
        IF p_season_id IS NULL THEN
            -- Try UPDATE first for NULL season_id
            UPDATE player_achievement_progress
            SET current_progress = p_total_points,
                updated_at = NOW()
            WHERE player_id = p_player_id 
              AND achievement_id = v_achievement.id
              AND season_id IS NULL;
            
            -- If no row was updated, insert (no ON CONFLICT needed, we just checked)
            IF NOT FOUND THEN
                INSERT INTO player_achievement_progress (
                    player_id, achievement_id, current_progress, season_id, updated_at
                ) VALUES (
                    p_player_id, v_achievement.id, p_total_points, NULL, NOW()
                );
            END IF;
        ELSE
            -- Try UPDATE first for non-NULL season_id too
            UPDATE player_achievement_progress
            SET current_progress = p_total_points,
                updated_at = NOW()
            WHERE player_id = p_player_id 
              AND achievement_id = v_achievement.id
              AND season_id = p_season_id;
            
            -- If no row was updated, insert
            IF NOT FOUND THEN
                INSERT INTO player_achievement_progress (
                    player_id, achievement_id, current_progress, season_id, updated_at
                ) VALUES (
                    p_player_id, v_achievement.id, p_total_points, p_season_id, NOW()
                );
            END IF;
        END IF;

        -- Check if this achievement is now completed
        IF p_total_points >= v_achievement.max_progress THEN
            -- Try to award achievement (idempotent - uses WHERE NOT EXISTS)
            IF p_season_id IS NULL THEN
                INSERT INTO player_achievements (
                    player_id, achievement_id, unlocked_at, season_id
                )
                SELECT p_player_id, v_achievement.id, NOW(), NULL
                WHERE NOT EXISTS (
                    SELECT 1 FROM player_achievements
                    WHERE player_id = p_player_id
                    AND achievement_id = v_achievement.id
                    AND season_id IS NULL
                );
            ELSE
                INSERT INTO player_achievements (
                    player_id, achievement_id, unlocked_at, season_id
                )
                SELECT p_player_id, v_achievement.id, NOW(), p_season_id
                WHERE NOT EXISTS (
                    SELECT 1 FROM player_achievements
                    WHERE player_id = p_player_id
                    AND achievement_id = v_achievement.id
                    AND season_id = p_season_id
                );
            END IF;
        END IF;

        -- Move to next in chain (find child achievement)
        SELECT key INTO v_current_key
        FROM achievement_definitions
        WHERE parent_id = v_achievement.id
        AND key LIKE 'achievement_points_%'
        LIMIT 1;
    END LOOP;
END;
$$;


ALTER FUNCTION "public"."update_point_collector_progress"("p_player_id" bigint, "p_achievement_key" "text", "p_total_points" integer, "p_season_id" bigint) OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "public"."update_status_display_config"("p_kicker_id" integer, "p_status_key" character varying, "p_layer" character varying DEFAULT NULL::character varying, "p_priority" integer DEFAULT NULL::integer, "p_is_exclusive" boolean DEFAULT NULL::boolean, "p_is_enabled" boolean DEFAULT NULL::boolean) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    UPDATE status_display_config
    SET 
        layer = COALESCE(p_layer, layer),
        priority = COALESCE(p_priority, priority),
        is_exclusive = COALESCE(p_is_exclusive, is_exclusive),
        is_enabled = COALESCE(p_is_enabled, is_enabled),
        updated_at = NOW()
    WHERE kicker_id = p_kicker_id AND status_key = p_status_key;
    
    RETURN FOUND;
END;
$$;


ALTER FUNCTION "public"."update_status_display_config"("p_kicker_id" integer, "p_status_key" character varying, "p_layer" character varying, "p_priority" integer, "p_is_exclusive" boolean, "p_is_enabled" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_team_mmr"("p_team_id" bigint, "p_mmr_change" integer, "p_won" boolean) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    UPDATE teams
    SET 
        mmr = mmr + p_mmr_change,
        wins = CASE WHEN p_won THEN wins + 1 ELSE wins END,
        losses = CASE WHEN NOT p_won THEN losses + 1 ELSE losses END
    WHERE id = p_team_id AND status = 'active';
END;
$$;


ALTER FUNCTION "public"."update_team_mmr"("p_team_id" bigint, "p_mmr_change" integer, "p_won" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_team_season_ranking"("p_team_id" bigint, "p_season_id" bigint, "p_mmr_change" integer, "p_won" boolean) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Ensure ranking exists
    PERFORM get_or_create_team_season_ranking(p_team_id, p_season_id);
    
    -- Update the ranking
    UPDATE team_season_rankings
    SET 
        mmr = mmr + p_mmr_change,
        wins = CASE WHEN p_won THEN wins + 1 ELSE wins END,
        losses = CASE WHEN NOT p_won THEN losses + 1 ELSE losses END
    WHERE team_id = p_team_id AND season_id = p_season_id;
END;
$$;


ALTER FUNCTION "public"."update_team_season_ranking"("p_team_id" bigint, "p_season_id" bigint, "p_mmr_change" integer, "p_won" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_team_season_ranking_with_bounty"("p_team_id" bigint, "p_season_id" bigint, "p_mmr_change" integer, "p_won" boolean, "p_bounty_claimed" integer DEFAULT 0) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Ensure ranking exists
    PERFORM get_or_create_team_season_ranking(p_team_id, p_season_id);
    
    -- Update the ranking
    -- Add bounty_claimed to MMR for winner (same as player bounty logic)
    UPDATE team_season_rankings
    SET 
        mmr = mmr + p_mmr_change + p_bounty_claimed,
        wins = CASE WHEN p_won THEN wins + 1 ELSE wins END,
        losses = CASE WHEN NOT p_won THEN losses + 1 ELSE losses END,
        bounty_claimed = bounty_claimed + p_bounty_claimed
    WHERE team_id = p_team_id AND season_id = p_season_id;
END;
$$;


ALTER FUNCTION "public"."update_team_season_ranking_with_bounty"("p_team_id" bigint, "p_season_id" bigint, "p_mmr_change" integer, "p_won" boolean, "p_bounty_claimed" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_team_status_after_match"("p_team_id" bigint, "p_match_id" bigint, "p_is_winner" boolean, "p_opponent_team_id" bigint) RETURNS TABLE("bounty_claimed" integer, "bounty_victim_id" bigint, "new_status" "text"[], "streak" integer, "bounty_gained" integer, "old_streak" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_current_streak INT;
    v_new_streak INT;
    v_current_bounty INT;
    v_new_bounty INT;
    v_threshold_bounty INT;
    v_bounty_gained INT := 0;
    v_active_statuses TEXT[];
    v_bounty_to_claim INT := 0;
    v_bounty_victim BIGINT := NULL;
    v_opponent_status RECORD;
    v_status_def RECORD;
BEGIN
    -- Get or create team status record
    INSERT INTO team_status (team_id, current_streak, current_bounty, active_statuses)
    VALUES (p_team_id, 0, 0, '{}')
    ON CONFLICT (team_id) DO NOTHING;
    
    -- Get current status
    SELECT current_streak, current_bounty, active_statuses
    INTO v_current_streak, v_current_bounty, v_active_statuses
    FROM team_status
    WHERE team_id = p_team_id;
    
    -- Calculate new streak
    IF p_is_winner THEN
        IF v_current_streak >= 0 THEN
            v_new_streak := v_current_streak + 1;
        ELSE
            v_new_streak := 1;  -- Reset from loss streak
        END IF;
    ELSE
        IF v_current_streak <= 0 THEN
            v_new_streak := v_current_streak - 1;
        ELSE
            v_new_streak := -1;  -- Reset from win streak
        END IF;
    END IF;
    
    -- ============================================
    -- BOUNTY CALCULATION
    -- Only add bounty when crossing a threshold (3, 5, 7, 10)
    -- Uses same status_definitions as player bounty
    -- ============================================
    IF p_is_winner AND v_new_streak >= 3 THEN
        -- Keep existing bounty as base (or 0 if coming from loss streak)
        IF v_current_streak >= 0 THEN
            v_new_bounty := v_current_bounty;
        ELSE
            v_new_bounty := 0;
        END IF;
        
        -- Check if we just crossed a threshold (3, 5, 7, or 10)
        SELECT bounty_per_streak INTO v_threshold_bounty
        FROM status_definitions
        WHERE type = 'streak' 
          AND (condition->>'streak_type') = 'win'
          AND (condition->>'min_streak')::int = v_new_streak
          AND v_current_streak < v_new_streak;
        
        -- Add threshold bounty if we crossed one
        IF v_threshold_bounty IS NOT NULL AND v_threshold_bounty > 0 THEN
            v_new_bounty := v_new_bounty + v_threshold_bounty;
            v_bounty_gained := v_threshold_bounty;
        END IF;
    ELSE
        -- Not on a win streak of 3+, bounty is 0
        v_new_bounty := 0;
    END IF;
    
    -- Check if we need to claim bounty from opponent team (if we won and broke their streak)
    IF p_is_winner AND p_opponent_team_id IS NOT NULL THEN
        SELECT ts.team_id, ts.current_streak, ts.current_bounty
        INTO v_opponent_status
        FROM team_status ts
        WHERE ts.team_id = p_opponent_team_id
          AND ts.current_streak >= 3;
        
        IF v_opponent_status IS NOT NULL AND v_opponent_status.current_bounty > 0 THEN
            v_bounty_to_claim := v_opponent_status.current_bounty;
            v_bounty_victim := v_opponent_status.team_id;
            
            -- Record bounty claim in history
            INSERT INTO team_bounty_history (claimer_team_id, victim_team_id, match_id, streak_broken, bounty_amount)
            VALUES (p_team_id, v_opponent_status.team_id, p_match_id, v_opponent_status.current_streak, v_opponent_status.current_bounty);
        END IF;
    END IF;
    
    -- Determine active statuses based on new streak
    v_active_statuses := '{}';
    
    FOR v_status_def IN
        SELECT key, condition
        FROM status_definitions
        WHERE type = 'streak'
        ORDER BY priority DESC
    LOOP
        IF (v_status_def.condition->>'streak_type') = 'win' AND v_new_streak >= (v_status_def.condition->>'min_streak')::int THEN
            v_active_statuses := array_append(v_active_statuses, v_status_def.key);
        ELSIF (v_status_def.condition->>'streak_type') = 'loss' AND v_new_streak <= -(v_status_def.condition->>'min_streak')::int THEN
            v_active_statuses := array_append(v_active_statuses, v_status_def.key);
        END IF;
    END LOOP;
    
    -- Update team status
    UPDATE team_status
    SET current_streak = v_new_streak,
        current_bounty = v_new_bounty,
        active_statuses = v_active_statuses,
        last_match_id = p_match_id,
        updated_at = NOW()
    WHERE team_id = p_team_id;
    
    -- Return results
    bounty_claimed := v_bounty_to_claim;
    bounty_victim_id := v_bounty_victim;
    new_status := v_active_statuses;
    streak := v_new_streak;
    bounty_gained := v_bounty_gained;
    old_streak := v_current_streak;
    
    RETURN NEXT;
END;
$$;


ALTER FUNCTION "public"."update_team_status_after_match"("p_team_id" bigint, "p_match_id" bigint, "p_is_winner" boolean, "p_opponent_team_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."upsert_fcm_token"("p_fcm_token" "text", "p_device_info" "text" DEFAULT NULL::"text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_user_id UUID;
    v_device_fingerprint TEXT;
    v_existing_fingerprint TEXT;
BEGIN
    -- Get the current authenticated user
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;
    
    -- Delete any existing entry with this token (could be from another user on same browser)
    DELETE FROM push_subscriptions
    WHERE fcm_token = p_fcm_token;
    
    -- Create a device fingerprint from device_info for more precise matching
    -- This allows multiple devices of the same type (e.g., two iPhones)
    IF p_device_info IS NOT NULL THEN
        -- Create fingerprint: deviceType + os + osVersion + browser + browserVersion + deviceModel
        v_device_fingerprint := COALESCE(p_device_info::jsonb->>'deviceType', '') || '|' ||
                                COALESCE(p_device_info::jsonb->>'os', '') || '|' ||
                                COALESCE(p_device_info::jsonb->>'osVersion', '') || '|' ||
                                COALESCE(p_device_info::jsonb->>'browser', '') || '|' ||
                                COALESCE(p_device_info::jsonb->>'browserVersion', '') || '|' ||
                                COALESCE(p_device_info::jsonb->>'deviceModel', '');
        
        -- Only delete if there's an exact device match for this user
        -- This prevents multiple iPhones from overwriting each other
        DELETE FROM push_subscriptions ps
        WHERE ps.user_id = v_user_id
        AND (
            COALESCE(ps.device_info::jsonb->>'deviceType', '') || '|' ||
            COALESCE(ps.device_info::jsonb->>'os', '') || '|' ||
            COALESCE(ps.device_info::jsonb->>'osVersion', '') || '|' ||
            COALESCE(ps.device_info::jsonb->>'browser', '') || '|' ||
            COALESCE(ps.device_info::jsonb->>'browserVersion', '') || '|' ||
            COALESCE(ps.device_info::jsonb->>'deviceModel', '')
        ) = v_device_fingerprint;
    END IF;
    
    -- Insert the new token
    INSERT INTO push_subscriptions (user_id, fcm_token, device_info)
    VALUES (v_user_id, p_fcm_token, p_device_info);
END;
$$;


ALTER FUNCTION "public"."upsert_fcm_token"("p_fcm_token" "text", "p_device_info" "text") OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."achievement_categories" (
    "id" bigint NOT NULL,
    "key" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "icon" "text",
    "sort_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."achievement_categories" OWNER TO "postgres";


ALTER TABLE "public"."achievement_categories" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."achievement_categories_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."achievement_definitions" (
    "id" bigint NOT NULL,
    "key" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text" NOT NULL,
    "category_id" bigint NOT NULL,
    "trigger_event" "text" NOT NULL,
    "condition" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "points" integer DEFAULT 10 NOT NULL,
    "icon" "text",
    "is_hidden" boolean DEFAULT false NOT NULL,
    "is_repeatable" boolean DEFAULT false NOT NULL,
    "max_progress" integer DEFAULT 1 NOT NULL,
    "season_id" bigint,
    "parent_id" bigint,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "is_season_specific" boolean DEFAULT true NOT NULL
);


ALTER TABLE "public"."achievement_definitions" OWNER TO "postgres";


ALTER TABLE "public"."achievement_definitions" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."achievement_definitions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."bounty_history" (
    "id" bigint NOT NULL,
    "claimer_id" bigint NOT NULL,
    "victim_id" bigint NOT NULL,
    "match_id" bigint NOT NULL,
    "gamemode" "text" NOT NULL,
    "streak_broken" integer NOT NULL,
    "bounty_amount" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."bounty_history" OWNER TO "postgres";


ALTER TABLE "public"."bounty_history" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."bounty_history_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



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



CREATE TABLE IF NOT EXISTS "public"."match_comment_read_status" (
    "id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "match_id" bigint NOT NULL,
    "last_read_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."match_comment_read_status" OWNER TO "postgres";


ALTER TABLE "public"."match_comment_read_status" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."match_comment_read_status_id_seq"
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
    "season_id" bigint,
    "bounty_team1" integer DEFAULT 0,
    "bounty_team2" integer DEFAULT 0,
    "team1_id" bigint,
    "team2_id" bigint,
    "bounty_team1_team" integer DEFAULT 0,
    "bounty_team2_team" integer DEFAULT 0
);


ALTER TABLE "public"."matches" OWNER TO "postgres";


COMMENT ON COLUMN "public"."matches"."bounty_team1" IS 'Total bounty earned by team 1 in this match';



COMMENT ON COLUMN "public"."matches"."bounty_team2" IS 'Total bounty earned by team 2 in this match';



ALTER TABLE "public"."matches" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."matches_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."mention_notifications" (
    "id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "type" character varying(20) NOT NULL,
    "source_id" bigint NOT NULL,
    "match_id" bigint,
    "kicker_id" bigint NOT NULL,
    "sender_player_id" bigint NOT NULL,
    "content_preview" "text" NOT NULL,
    "is_read" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "team_invitation_id" bigint,
    CONSTRAINT "mention_notifications_type_check" CHECK ((("type")::"text" = ANY ((ARRAY['comment'::character varying, 'chat'::character varying, 'chat_all'::character varying, 'team_invite'::character varying])::"text"[])))
);

ALTER TABLE ONLY "public"."mention_notifications" REPLICA IDENTITY FULL;


ALTER TABLE "public"."mention_notifications" OWNER TO "postgres";


ALTER TABLE "public"."mention_notifications" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."mention_notifications_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."player_achievement_progress" (
    "id" bigint NOT NULL,
    "player_id" bigint NOT NULL,
    "achievement_id" bigint NOT NULL,
    "current_progress" integer DEFAULT 0 NOT NULL,
    "season_id" bigint,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."player_achievement_progress" OWNER TO "postgres";


ALTER TABLE "public"."player_achievement_progress" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."player_achievement_progress_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."player_achievements" (
    "id" bigint NOT NULL,
    "player_id" bigint NOT NULL,
    "achievement_id" bigint NOT NULL,
    "unlocked_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "times_completed" integer DEFAULT 1 NOT NULL,
    "season_id" bigint,
    "match_id" bigint
);


ALTER TABLE "public"."player_achievements" OWNER TO "postgres";


ALTER TABLE "public"."player_achievements" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."player_achievements_id_seq"
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
    "season_id" bigint,
    "bounty_claimed" integer DEFAULT 0,
    "bounty_claimed_2on2" integer DEFAULT 0
);


ALTER TABLE "public"."player_history" OWNER TO "postgres";


COMMENT ON COLUMN "public"."player_history"."bounty_claimed" IS 'Bounty claimed in 1on1 on this date';



COMMENT ON COLUMN "public"."player_history"."bounty_claimed_2on2" IS 'Bounty claimed in 2on2 on this date';



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



CREATE TABLE IF NOT EXISTS "public"."player_monthly_status" (
    "id" bigint NOT NULL,
    "player_id" bigint NOT NULL,
    "gamemode" "text" NOT NULL,
    "month" "text" NOT NULL,
    "humiliated_count" integer DEFAULT 0,
    "dominator_count" integer DEFAULT 0,
    "comeback_count" integer DEFAULT 0,
    "underdog_count" integer DEFAULT 0,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "player_monthly_status_gamemode_check" CHECK (("gamemode" = ANY (ARRAY['1on1'::"text", '2on2'::"text"])))
);


ALTER TABLE "public"."player_monthly_status" OWNER TO "postgres";


ALTER TABLE "public"."player_monthly_status" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."player_monthly_status_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."player_selected_rewards" (
    "id" bigint NOT NULL,
    "player_id" bigint NOT NULL,
    "reward_type" "text" NOT NULL,
    "reward_id" bigint,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "player_selected_rewards_reward_type_check" CHECK (("reward_type" = ANY (ARRAY['title'::"text", 'frame'::"text"])))
);


ALTER TABLE "public"."player_selected_rewards" OWNER TO "postgres";


ALTER TABLE "public"."player_selected_rewards" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."player_selected_rewards_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."player_status" (
    "id" bigint NOT NULL,
    "player_id" bigint NOT NULL,
    "gamemode" "text" NOT NULL,
    "current_streak" integer DEFAULT 0 NOT NULL,
    "current_bounty" integer DEFAULT 0 NOT NULL,
    "active_statuses" "text"[] DEFAULT '{}'::"text"[],
    "last_match_id" bigint,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "player_status_gamemode_check" CHECK (("gamemode" = ANY (ARRAY['1on1'::"text", '2on2'::"text"])))
);


ALTER TABLE "public"."player_status" OWNER TO "postgres";


ALTER TABLE "public"."player_status" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."player_status_id_seq"
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
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "notify_all_chat" boolean DEFAULT true NOT NULL,
    "notify_mentions" boolean DEFAULT true NOT NULL,
    "notify_team_invites" boolean DEFAULT true NOT NULL,
    "enabled" boolean DEFAULT true NOT NULL
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



CREATE TABLE IF NOT EXISTS "public"."reward_definitions" (
    "id" bigint NOT NULL,
    "key" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "type" "text" NOT NULL,
    "display_position" "text",
    "display_value" "text" NOT NULL,
    "achievement_key" "text",
    "icon" "text",
    "sort_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "reward_definitions_display_position_check" CHECK (("display_position" = ANY (ARRAY['prefix'::"text", 'suffix'::"text"]))),
    CONSTRAINT "reward_definitions_type_check" CHECK (("type" = ANY (ARRAY['title'::"text", 'frame'::"text", 'right'::"text"])))
);


ALTER TABLE "public"."reward_definitions" OWNER TO "postgres";


ALTER TABLE "public"."reward_definitions" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."reward_definitions_id_seq"
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
    "mmr2on2" bigint DEFAULT 1000 NOT NULL,
    "bounty_claimed" integer DEFAULT 0,
    "bounty_claimed_2on2" integer DEFAULT 0,
    "season_announcement_seen" boolean DEFAULT false
);


ALTER TABLE "public"."season_rankings" OWNER TO "postgres";


COMMENT ON COLUMN "public"."season_rankings"."bounty_claimed" IS 'Total bounty claimed in 1on1 this season';



COMMENT ON COLUMN "public"."season_rankings"."bounty_claimed_2on2" IS 'Total bounty claimed in 2on2 this season';



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



CREATE TABLE IF NOT EXISTS "public"."status_definitions" (
    "id" bigint NOT NULL,
    "key" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "type" "text" NOT NULL,
    "condition" "jsonb" NOT NULL,
    "bounty_per_streak" integer DEFAULT 0,
    "bounty_cap" integer DEFAULT 0,
    "priority" integer DEFAULT 0,
    "asset_key" "text" NOT NULL,
    "duration_seconds" integer,
    "is_stackable" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "status_definitions_type_check" CHECK (("type" = ANY (ARRAY['streak'::"text", 'event'::"text", 'monthly'::"text", 'special'::"text"])))
);


ALTER TABLE "public"."status_definitions" OWNER TO "postgres";


ALTER TABLE "public"."status_definitions" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."status_definitions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."status_display_config" (
    "id" integer NOT NULL,
    "kicker_id" integer NOT NULL,
    "status_key" character varying(50) NOT NULL,
    "display_name" character varying(100) NOT NULL,
    "layer" character varying(20) DEFAULT 'effect'::character varying NOT NULL,
    "priority" integer DEFAULT 50 NOT NULL,
    "is_exclusive" boolean DEFAULT true NOT NULL,
    "is_enabled" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."status_display_config" OWNER TO "postgres";


ALTER TABLE "public"."status_display_config" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."status_display_config_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."team_bounty_history" (
    "id" bigint NOT NULL,
    "claimer_team_id" bigint NOT NULL,
    "victim_team_id" bigint NOT NULL,
    "match_id" bigint NOT NULL,
    "streak_broken" integer NOT NULL,
    "bounty_amount" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."team_bounty_history" OWNER TO "postgres";


ALTER TABLE "public"."team_bounty_history" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."team_bounty_history_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."team_history" (
    "id" bigint NOT NULL,
    "team_id" bigint NOT NULL,
    "match_id" bigint,
    "mmr_before" integer NOT NULL,
    "mmr_after" integer NOT NULL,
    "mmr_change" integer NOT NULL,
    "wins_before" integer DEFAULT 0 NOT NULL,
    "wins_after" integer DEFAULT 0 NOT NULL,
    "losses_before" integer DEFAULT 0 NOT NULL,
    "losses_after" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."team_history" OWNER TO "postgres";


ALTER TABLE "public"."team_history" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."team_history_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."team_invitations" (
    "id" bigint NOT NULL,
    "team_id" bigint NOT NULL,
    "inviting_player_id" bigint NOT NULL,
    "invited_player_id" bigint NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "responded_at" timestamp with time zone,
    CONSTRAINT "team_invitations_different_players" CHECK (("inviting_player_id" <> "invited_player_id"))
);


ALTER TABLE "public"."team_invitations" OWNER TO "postgres";


ALTER TABLE "public"."team_invitations" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."team_invitations_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE "public"."team_season_rankings" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."team_season_rankings_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."team_status" (
    "id" bigint NOT NULL,
    "team_id" bigint NOT NULL,
    "current_streak" integer DEFAULT 0 NOT NULL,
    "current_bounty" integer DEFAULT 0 NOT NULL,
    "active_statuses" "text"[] DEFAULT '{}'::"text"[],
    "last_match_id" bigint,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."team_status" OWNER TO "postgres";


ALTER TABLE "public"."team_status" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."team_status_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."teams" (
    "id" bigint NOT NULL,
    "name" character varying(50) NOT NULL,
    "logo_url" "text",
    "player1_id" bigint NOT NULL,
    "player2_id" bigint NOT NULL,
    "kicker_id" bigint NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "mmr" integer DEFAULT 1000 NOT NULL,
    "wins" integer DEFAULT 0 NOT NULL,
    "losses" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "dissolved_at" timestamp with time zone,
    CONSTRAINT "teams_different_players" CHECK (("player1_id" <> "player2_id"))
);


ALTER TABLE "public"."teams" OWNER TO "postgres";


ALTER TABLE "public"."teams" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."teams_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."user_notification_settings" (
    "user_id" "uuid" NOT NULL,
    "notifications_enabled" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_notification_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_permissions" (
    "id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "kicker_id" bigint NOT NULL,
    "permission_type" "text" NOT NULL,
    "granted_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "granted_by" "uuid"
);


ALTER TABLE "public"."user_permissions" OWNER TO "postgres";


ALTER TABLE "public"."user_permissions" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."user_permissions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE ONLY "public"."achievement_categories"
    ADD CONSTRAINT "achievement_categories_key_key" UNIQUE ("key");



ALTER TABLE ONLY "public"."achievement_categories"
    ADD CONSTRAINT "achievement_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."achievement_definitions"
    ADD CONSTRAINT "achievement_definitions_key_key" UNIQUE ("key");



ALTER TABLE ONLY "public"."achievement_definitions"
    ADD CONSTRAINT "achievement_definitions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bounty_history"
    ADD CONSTRAINT "bounty_history_pkey" PRIMARY KEY ("id");



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



ALTER TABLE ONLY "public"."match_comment_read_status"
    ADD CONSTRAINT "match_comment_read_status_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."match_comment_read_status"
    ADD CONSTRAINT "match_comment_read_status_user_id_match_id_key" UNIQUE ("user_id", "match_id");



ALTER TABLE ONLY "public"."match_comments"
    ADD CONSTRAINT "match_comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."match_reactions"
    ADD CONSTRAINT "match_reactions_match_id_player_id_reaction_type_key" UNIQUE ("match_id", "player_id", "reaction_type");



ALTER TABLE ONLY "public"."match_reactions"
    ADD CONSTRAINT "match_reactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."matches"
    ADD CONSTRAINT "matches_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."mention_notifications"
    ADD CONSTRAINT "mention_notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."player_achievement_progress"
    ADD CONSTRAINT "player_achievement_progress_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."player_achievements"
    ADD CONSTRAINT "player_achievements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."player_achievements"
    ADD CONSTRAINT "player_achievements_unique" UNIQUE ("player_id", "achievement_id", "season_id");



ALTER TABLE ONLY "public"."player_history"
    ADD CONSTRAINT "player_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."player_monthly_status"
    ADD CONSTRAINT "player_monthly_status_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."player_monthly_status"
    ADD CONSTRAINT "player_monthly_status_unique" UNIQUE ("player_id", "gamemode", "month");



ALTER TABLE ONLY "public"."player"
    ADD CONSTRAINT "player_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."player_selected_rewards"
    ADD CONSTRAINT "player_selected_rewards_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."player_selected_rewards"
    ADD CONSTRAINT "player_selected_rewards_unique" UNIQUE ("player_id", "reward_type");



ALTER TABLE ONLY "public"."player_status"
    ADD CONSTRAINT "player_status_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."player_status"
    ADD CONSTRAINT "player_status_unique" UNIQUE ("player_id", "gamemode");



ALTER TABLE ONLY "public"."push_subscriptions"
    ADD CONSTRAINT "push_subscriptions_fcm_token_key" UNIQUE ("fcm_token");



ALTER TABLE ONLY "public"."push_subscriptions"
    ADD CONSTRAINT "push_subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reward_definitions"
    ADD CONSTRAINT "reward_definitions_key_key" UNIQUE ("key");



ALTER TABLE ONLY "public"."reward_definitions"
    ADD CONSTRAINT "reward_definitions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."season_rankings"
    ADD CONSTRAINT "season_rankings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."season_rankings"
    ADD CONSTRAINT "season_rankings_player_id_season_id_key" UNIQUE ("player_id", "season_id");



ALTER TABLE ONLY "public"."seasons"
    ADD CONSTRAINT "seasons_kicker_id_season_number_key" UNIQUE ("kicker_id", "season_number");



ALTER TABLE ONLY "public"."seasons"
    ADD CONSTRAINT "seasons_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."status_definitions"
    ADD CONSTRAINT "status_definitions_key_key" UNIQUE ("key");



ALTER TABLE ONLY "public"."status_definitions"
    ADD CONSTRAINT "status_definitions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."status_display_config"
    ADD CONSTRAINT "status_display_config_kicker_id_status_key_key" UNIQUE ("kicker_id", "status_key");



ALTER TABLE ONLY "public"."status_display_config"
    ADD CONSTRAINT "status_display_config_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."team_bounty_history"
    ADD CONSTRAINT "team_bounty_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."team_history"
    ADD CONSTRAINT "team_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."team_invitations"
    ADD CONSTRAINT "team_invitations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."team_season_rankings"
    ADD CONSTRAINT "team_season_rankings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."team_season_rankings"
    ADD CONSTRAINT "team_season_rankings_team_id_season_id_key" UNIQUE ("team_id", "season_id");



ALTER TABLE ONLY "public"."team_status"
    ADD CONSTRAINT "team_status_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."team_status"
    ADD CONSTRAINT "team_status_unique" UNIQUE ("team_id");



ALTER TABLE ONLY "public"."teams"
    ADD CONSTRAINT "teams_name_kicker_unique" UNIQUE ("name", "kicker_id");



ALTER TABLE ONLY "public"."teams"
    ADD CONSTRAINT "teams_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_notification_settings"
    ADD CONSTRAINT "user_notification_settings_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."user_permissions"
    ADD CONSTRAINT "user_permissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_permissions"
    ADD CONSTRAINT "user_permissions_user_id_kicker_id_permission_type_key" UNIQUE ("user_id", "kicker_id", "permission_type");



CREATE INDEX "idx_achievement_definitions_category" ON "public"."achievement_definitions" USING "btree" ("category_id");



CREATE INDEX "idx_achievement_definitions_parent" ON "public"."achievement_definitions" USING "btree" ("parent_id");



CREATE INDEX "idx_achievement_definitions_season" ON "public"."achievement_definitions" USING "btree" ("season_id");



CREATE INDEX "idx_achievement_definitions_trigger" ON "public"."achievement_definitions" USING "btree" ("trigger_event");



CREATE INDEX "idx_bounty_history_claimer" ON "public"."bounty_history" USING "btree" ("claimer_id");



CREATE INDEX "idx_bounty_history_created" ON "public"."bounty_history" USING "btree" ("created_at");



CREATE UNIQUE INDEX "idx_bounty_history_unique_claim" ON "public"."bounty_history" USING "btree" ("claimer_id", "victim_id", "match_id");



CREATE INDEX "idx_bounty_history_victim" ON "public"."bounty_history" USING "btree" ("victim_id");



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



CREATE INDEX "idx_match_comment_read_status_match_id" ON "public"."match_comment_read_status" USING "btree" ("match_id");



CREATE INDEX "idx_match_comment_read_status_user_id" ON "public"."match_comment_read_status" USING "btree" ("user_id");



CREATE INDEX "idx_match_comments_created_at" ON "public"."match_comments" USING "btree" ("created_at");



CREATE INDEX "idx_match_comments_kicker_id" ON "public"."match_comments" USING "btree" ("kicker_id");



CREATE INDEX "idx_match_comments_match_id" ON "public"."match_comments" USING "btree" ("match_id");



CREATE INDEX "idx_match_comments_player_id" ON "public"."match_comments" USING "btree" ("player_id");



CREATE INDEX "idx_match_reactions_match_id" ON "public"."match_reactions" USING "btree" ("match_id");



CREATE INDEX "idx_match_reactions_player_id" ON "public"."match_reactions" USING "btree" ("player_id");



CREATE INDEX "idx_matches_season_id" ON "public"."matches" USING "btree" ("season_id");



CREATE INDEX "idx_matches_team1_id" ON "public"."matches" USING "btree" ("team1_id");



CREATE INDEX "idx_matches_team2_id" ON "public"."matches" USING "btree" ("team2_id");



CREATE INDEX "idx_mention_notifications_created_at" ON "public"."mention_notifications" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_mention_notifications_kicker_id" ON "public"."mention_notifications" USING "btree" ("kicker_id");



CREATE INDEX "idx_mention_notifications_team_invitation_id" ON "public"."mention_notifications" USING "btree" ("team_invitation_id") WHERE ("team_invitation_id" IS NOT NULL);



CREATE INDEX "idx_mention_notifications_user_id" ON "public"."mention_notifications" USING "btree" ("user_id");



CREATE INDEX "idx_mention_notifications_user_unread" ON "public"."mention_notifications" USING "btree" ("user_id", "is_read") WHERE ("is_read" = false);



CREATE INDEX "idx_player_achievement_progress_achievement" ON "public"."player_achievement_progress" USING "btree" ("achievement_id");



CREATE INDEX "idx_player_achievement_progress_player" ON "public"."player_achievement_progress" USING "btree" ("player_id");



CREATE INDEX "idx_player_achievement_progress_season" ON "public"."player_achievement_progress" USING "btree" ("season_id");



CREATE UNIQUE INDEX "idx_player_achievement_progress_unique_no_season" ON "public"."player_achievement_progress" USING "btree" ("player_id", "achievement_id") WHERE ("season_id" IS NULL);



CREATE UNIQUE INDEX "idx_player_achievement_progress_unique_with_season" ON "public"."player_achievement_progress" USING "btree" ("player_id", "achievement_id", "season_id") WHERE ("season_id" IS NOT NULL);



CREATE INDEX "idx_player_achievements_achievement" ON "public"."player_achievements" USING "btree" ("achievement_id");



CREATE INDEX "idx_player_achievements_player" ON "public"."player_achievements" USING "btree" ("player_id");



CREATE INDEX "idx_player_achievements_season" ON "public"."player_achievements" USING "btree" ("season_id");



CREATE INDEX "idx_player_achievements_unlocked" ON "public"."player_achievements" USING "btree" ("unlocked_at" DESC);



CREATE INDEX "idx_player_history_season_id" ON "public"."player_history" USING "btree" ("season_id");



CREATE INDEX "idx_player_monthly_status_month" ON "public"."player_monthly_status" USING "btree" ("month");



CREATE INDEX "idx_player_monthly_status_player" ON "public"."player_monthly_status" USING "btree" ("player_id");



CREATE INDEX "idx_player_selected_rewards_player" ON "public"."player_selected_rewards" USING "btree" ("player_id");



CREATE INDEX "idx_player_status_player" ON "public"."player_status" USING "btree" ("player_id");



CREATE INDEX "idx_player_status_updated" ON "public"."player_status" USING "btree" ("updated_at");



CREATE INDEX "idx_push_subscriptions_fcm_token" ON "public"."push_subscriptions" USING "btree" ("fcm_token");



CREATE INDEX "idx_push_subscriptions_user_id" ON "public"."push_subscriptions" USING "btree" ("user_id");



CREATE INDEX "idx_reward_definitions_achievement" ON "public"."reward_definitions" USING "btree" ("achievement_key");



CREATE INDEX "idx_reward_definitions_type" ON "public"."reward_definitions" USING "btree" ("type");



CREATE INDEX "idx_season_rankings_player_id" ON "public"."season_rankings" USING "btree" ("player_id");



CREATE INDEX "idx_season_rankings_season_id" ON "public"."season_rankings" USING "btree" ("season_id");



CREATE INDEX "idx_seasons_is_active" ON "public"."seasons" USING "btree" ("is_active");



CREATE INDEX "idx_seasons_kicker_id" ON "public"."seasons" USING "btree" ("kicker_id");



CREATE INDEX "idx_status_display_config_kicker" ON "public"."status_display_config" USING "btree" ("kicker_id");



CREATE INDEX "idx_team_bounty_history_claimer" ON "public"."team_bounty_history" USING "btree" ("claimer_team_id");



CREATE INDEX "idx_team_bounty_history_created" ON "public"."team_bounty_history" USING "btree" ("created_at");



CREATE INDEX "idx_team_bounty_history_victim" ON "public"."team_bounty_history" USING "btree" ("victim_team_id");



CREATE INDEX "idx_team_history_created_at" ON "public"."team_history" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_team_history_match_id" ON "public"."team_history" USING "btree" ("match_id");



CREATE INDEX "idx_team_history_team_id" ON "public"."team_history" USING "btree" ("team_id");



CREATE INDEX "idx_team_invitations_invited_player_id" ON "public"."team_invitations" USING "btree" ("invited_player_id");



CREATE INDEX "idx_team_invitations_inviting_player_id" ON "public"."team_invitations" USING "btree" ("inviting_player_id");



CREATE INDEX "idx_team_invitations_status" ON "public"."team_invitations" USING "btree" ("status");



CREATE INDEX "idx_team_invitations_team_id" ON "public"."team_invitations" USING "btree" ("team_id");



CREATE INDEX "idx_team_status_team" ON "public"."team_status" USING "btree" ("team_id");



CREATE INDEX "idx_team_status_updated" ON "public"."team_status" USING "btree" ("updated_at");



CREATE INDEX "idx_teams_kicker_id" ON "public"."teams" USING "btree" ("kicker_id");



CREATE INDEX "idx_teams_mmr" ON "public"."teams" USING "btree" ("mmr" DESC);



CREATE INDEX "idx_teams_player1_id" ON "public"."teams" USING "btree" ("player1_id");



CREATE INDEX "idx_teams_player2_id" ON "public"."teams" USING "btree" ("player2_id");



CREATE INDEX "idx_teams_status" ON "public"."teams" USING "btree" ("status");



CREATE INDEX "idx_user_permissions_kicker_id" ON "public"."user_permissions" USING "btree" ("kicker_id");



CREATE INDEX "idx_user_permissions_type" ON "public"."user_permissions" USING "btree" ("permission_type");



CREATE INDEX "idx_user_permissions_user_id" ON "public"."user_permissions" USING "btree" ("user_id");



CREATE INDEX "team_season_rankings_season_id_idx" ON "public"."team_season_rankings" USING "btree" ("season_id");



CREATE INDEX "team_season_rankings_team_id_idx" ON "public"."team_season_rankings" USING "btree" ("team_id");



CREATE OR REPLACE TRIGGER "achievement-goal-scored_public" AFTER INSERT ON "public"."goals" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_process_achievement"('achievement-goal-scored_public');



CREATE OR REPLACE TRIGGER "achievement-match-ended_public" AFTER UPDATE ON "public"."matches" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_process_achievement"('achievement-match-ended_public');



CREATE OR REPLACE TRIGGER "achievement-season-ended_public" AFTER UPDATE ON "public"."seasons" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_process_achievement"('achievement-season-ended_public');



CREATE OR REPLACE TRIGGER "after_player_insert_create_season_ranking" AFTER INSERT ON "public"."player" FOR EACH ROW EXECUTE FUNCTION "public"."create_season_ranking_for_new_player"();



CREATE OR REPLACE TRIGGER "before_match_insert" BEFORE INSERT ON "public"."matches" FOR EACH ROW EXECUTE FUNCTION "public"."assign_match_number"();



CREATE OR REPLACE TRIGGER "notify_chat_mention" AFTER INSERT ON "public"."chat_messages" FOR EACH ROW EXECUTE FUNCTION "public"."notify_mention"();



CREATE OR REPLACE TRIGGER "notify_comment_mention" AFTER INSERT ON "public"."match_comments" FOR EACH ROW EXECUTE FUNCTION "public"."notify_mention"();



CREATE OR REPLACE TRIGGER "on_achievement_unlocked" AFTER INSERT ON "public"."player_achievements" FOR EACH ROW EXECUTE FUNCTION "public"."notify_achievement_unlocked"();



CREATE OR REPLACE TRIGGER "on_achievement_unlocked_public" AFTER INSERT ON "public"."player_achievements" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_process_achievement"('on_achievement_unlocked_public');



CREATE OR REPLACE TRIGGER "sync_point_collector_trigger" AFTER INSERT ON "public"."player_achievements" FOR EACH ROW EXECUTE FUNCTION "public"."sync_point_collector_on_achievement"();



CREATE OR REPLACE TRIGGER "trg_goal_achievement_progress" AFTER INSERT ON "public"."goals" FOR EACH ROW EXECUTE FUNCTION "public"."handle_goal_achievement_progress"();



CREATE OR REPLACE TRIGGER "trigger_chat_all" AFTER INSERT ON "public"."chat_messages" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_create_chat_all_notifications"();



CREATE OR REPLACE TRIGGER "trigger_chat_mentions" AFTER INSERT ON "public"."chat_messages" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_create_chat_mention_notifications"();



CREATE OR REPLACE TRIGGER "trigger_comment_mentions" AFTER INSERT ON "public"."match_comments" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_create_comment_mention_notifications"();



CREATE OR REPLACE TRIGGER "trigger_record_team_history" AFTER UPDATE OF "end_time" ON "public"."matches" FOR EACH ROW WHEN ((("old"."end_time" IS NULL) AND ("new"."end_time" IS NOT NULL))) EXECUTE FUNCTION "public"."record_team_history"();



CREATE OR REPLACE TRIGGER "trigger_send_push_notification" AFTER INSERT ON "public"."mention_notifications" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_send_push_notification"();



CREATE OR REPLACE TRIGGER "trigger_team_invite_notification" AFTER INSERT ON "public"."team_invitations" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_create_team_invite_notification"();



CREATE OR REPLACE TRIGGER "trigger_team_invite_response" AFTER UPDATE ON "public"."team_invitations" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_mark_team_invite_notification_read"();



CREATE OR REPLACE TRIGGER "trigger_update_push_subscription_updated_at" BEFORE UPDATE ON "public"."push_subscriptions" FOR EACH ROW EXECUTE FUNCTION "public"."update_push_subscription_updated_at"();



CREATE OR REPLACE TRIGGER "update_achievement_definitions_updated_at" BEFORE UPDATE ON "public"."achievement_definitions" FOR EACH ROW EXECUTE FUNCTION "public"."update_achievement_definition_updated_at"();



CREATE OR REPLACE TRIGGER "update_player_achievement_progress_updated_at" BEFORE UPDATE ON "public"."player_achievement_progress" FOR EACH ROW EXECUTE FUNCTION "public"."update_achievement_progress_updated_at"();



ALTER TABLE ONLY "public"."achievement_definitions"
    ADD CONSTRAINT "achievement_definitions_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."achievement_categories"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."achievement_definitions"
    ADD CONSTRAINT "achievement_definitions_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."achievement_definitions"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."achievement_definitions"
    ADD CONSTRAINT "achievement_definitions_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."bounty_history"
    ADD CONSTRAINT "bounty_history_claimer_id_fkey" FOREIGN KEY ("claimer_id") REFERENCES "public"."player"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bounty_history"
    ADD CONSTRAINT "bounty_history_victim_id_fkey" FOREIGN KEY ("victim_id") REFERENCES "public"."player"("id") ON DELETE CASCADE;



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



ALTER TABLE ONLY "public"."match_comment_read_status"
    ADD CONSTRAINT "match_comment_read_status_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."match_comment_read_status"
    ADD CONSTRAINT "match_comment_read_status_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



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



ALTER TABLE ONLY "public"."matches"
    ADD CONSTRAINT "matches_team1_id_fkey" FOREIGN KEY ("team1_id") REFERENCES "public"."teams"("id");



ALTER TABLE ONLY "public"."matches"
    ADD CONSTRAINT "matches_team2_id_fkey" FOREIGN KEY ("team2_id") REFERENCES "public"."teams"("id");



ALTER TABLE ONLY "public"."mention_notifications"
    ADD CONSTRAINT "mention_notifications_kicker_id_fkey" FOREIGN KEY ("kicker_id") REFERENCES "public"."kicker"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mention_notifications"
    ADD CONSTRAINT "mention_notifications_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mention_notifications"
    ADD CONSTRAINT "mention_notifications_sender_player_id_fkey" FOREIGN KEY ("sender_player_id") REFERENCES "public"."player"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mention_notifications"
    ADD CONSTRAINT "mention_notifications_team_invitation_id_fkey" FOREIGN KEY ("team_invitation_id") REFERENCES "public"."team_invitations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."mention_notifications"
    ADD CONSTRAINT "mention_notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."player_achievement_progress"
    ADD CONSTRAINT "player_achievement_progress_achievement_id_fkey" FOREIGN KEY ("achievement_id") REFERENCES "public"."achievement_definitions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."player_achievement_progress"
    ADD CONSTRAINT "player_achievement_progress_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "public"."player"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."player_achievement_progress"
    ADD CONSTRAINT "player_achievement_progress_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."player_achievements"
    ADD CONSTRAINT "player_achievements_achievement_id_fkey" FOREIGN KEY ("achievement_id") REFERENCES "public"."achievement_definitions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."player_achievements"
    ADD CONSTRAINT "player_achievements_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."player_achievements"
    ADD CONSTRAINT "player_achievements_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "public"."player"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."player_achievements"
    ADD CONSTRAINT "player_achievements_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE SET NULL;



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



ALTER TABLE ONLY "public"."player_monthly_status"
    ADD CONSTRAINT "player_monthly_status_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "public"."player"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."player_selected_rewards"
    ADD CONSTRAINT "player_selected_rewards_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "public"."player"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."player_selected_rewards"
    ADD CONSTRAINT "player_selected_rewards_reward_id_fkey" FOREIGN KEY ("reward_id") REFERENCES "public"."reward_definitions"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."player_status"
    ADD CONSTRAINT "player_status_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "public"."player"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."player"
    ADD CONSTRAINT "player_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."push_subscriptions"
    ADD CONSTRAINT "push_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reward_definitions"
    ADD CONSTRAINT "reward_definitions_achievement_key_fkey" FOREIGN KEY ("achievement_key") REFERENCES "public"."achievement_definitions"("key");



ALTER TABLE ONLY "public"."season_rankings"
    ADD CONSTRAINT "season_rankings_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "public"."player"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."season_rankings"
    ADD CONSTRAINT "season_rankings_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."seasons"
    ADD CONSTRAINT "seasons_kicker_id_fkey" FOREIGN KEY ("kicker_id") REFERENCES "public"."kicker"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."status_display_config"
    ADD CONSTRAINT "status_display_config_kicker_id_fkey" FOREIGN KEY ("kicker_id") REFERENCES "public"."kicker"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."team_bounty_history"
    ADD CONSTRAINT "team_bounty_history_claimer_team_id_fkey" FOREIGN KEY ("claimer_team_id") REFERENCES "public"."teams"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."team_bounty_history"
    ADD CONSTRAINT "team_bounty_history_victim_team_id_fkey" FOREIGN KEY ("victim_team_id") REFERENCES "public"."teams"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."team_history"
    ADD CONSTRAINT "team_history_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."team_history"
    ADD CONSTRAINT "team_history_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."team_invitations"
    ADD CONSTRAINT "team_invitations_invited_player_id_fkey" FOREIGN KEY ("invited_player_id") REFERENCES "public"."player"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."team_invitations"
    ADD CONSTRAINT "team_invitations_inviting_player_id_fkey" FOREIGN KEY ("inviting_player_id") REFERENCES "public"."player"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."team_invitations"
    ADD CONSTRAINT "team_invitations_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."team_season_rankings"
    ADD CONSTRAINT "team_season_rankings_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."team_season_rankings"
    ADD CONSTRAINT "team_season_rankings_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."team_status"
    ADD CONSTRAINT "team_status_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."teams"
    ADD CONSTRAINT "teams_kicker_id_fkey" FOREIGN KEY ("kicker_id") REFERENCES "public"."kicker"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."teams"
    ADD CONSTRAINT "teams_player1_id_fkey" FOREIGN KEY ("player1_id") REFERENCES "public"."player"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."teams"
    ADD CONSTRAINT "teams_player2_id_fkey" FOREIGN KEY ("player2_id") REFERENCES "public"."player"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_notification_settings"
    ADD CONSTRAINT "user_notification_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_permissions"
    ADD CONSTRAINT "user_permissions_granted_by_fkey" FOREIGN KEY ("granted_by") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."user_permissions"
    ADD CONSTRAINT "user_permissions_kicker_id_fkey" FOREIGN KEY ("kicker_id") REFERENCES "public"."kicker"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_permissions"
    ADD CONSTRAINT "user_permissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Admin can delete permissions" ON "public"."user_permissions" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."kicker"
  WHERE (("kicker"."id" = "user_permissions"."kicker_id") AND ("kicker"."admin" = "auth"."uid"())))));



CREATE POLICY "Admin can insert permissions" ON "public"."user_permissions" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."kicker"
  WHERE (("kicker"."id" = "user_permissions"."kicker_id") AND ("kicker"."admin" = "auth"."uid"())))));



CREATE POLICY "Admin can update permissions" ON "public"."user_permissions" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."kicker"
  WHERE (("kicker"."id" = "user_permissions"."kicker_id") AND ("kicker"."admin" = "auth"."uid"())))));



CREATE POLICY "Admins can delete chat messages" ON "public"."chat_messages" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."kicker"
  WHERE (("kicker"."id" = "chat_messages"."kicker_id") AND ("kicker"."admin" = "auth"."uid"())))));



CREATE POLICY "Admins can delete comments" ON "public"."match_comments" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."kicker"
  WHERE (("kicker"."id" = "match_comments"."kicker_id") AND ("kicker"."admin" = "auth"."uid"())))));



CREATE POLICY "Admins can insert seasons" ON "public"."seasons" FOR INSERT WITH CHECK (true);



CREATE POLICY "Admins can update seasons" ON "public"."seasons" FOR UPDATE USING (true);



CREATE POLICY "Anyone can view achievement categories" ON "public"."achievement_categories" FOR SELECT USING (true);



CREATE POLICY "Authenticated users can view achievement definitions" ON "public"."achievement_definitions" FOR SELECT USING ((("auth"."uid"() IS NOT NULL) AND (("is_hidden" = false) OR (EXISTS ( SELECT 1
   FROM ("public"."player_achievements" "pa"
     JOIN "public"."player" "p" ON (("pa"."player_id" = "p"."id")))
  WHERE (("pa"."achievement_id" = "achievement_definitions"."id") AND ("p"."user_id" = "auth"."uid"())))))));



CREATE POLICY "Enable read access for all users" ON "public"."player" USING (true) WITH CHECK (true);



CREATE POLICY "Invited users can update invitation" ON "public"."team_invitations" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."player"
  WHERE (("player"."id" = "team_invitations"."invited_player_id") AND ("player"."user_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."player"
  WHERE (("player"."id" = "team_invitations"."invited_player_id") AND ("player"."user_id" = "auth"."uid"())))));



CREATE POLICY "Inviting users can delete pending invitations" ON "public"."team_invitations" FOR DELETE USING ((("status" = 'pending'::"text") AND (EXISTS ( SELECT 1
   FROM "public"."player"
  WHERE (("player"."id" = "team_invitations"."inviting_player_id") AND ("player"."user_id" = "auth"."uid"()))))));



CREATE POLICY "Service role can manage achievement categories" ON "public"."achievement_categories" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role can manage achievement definitions" ON "public"."achievement_definitions" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role can manage all achievements" ON "public"."player_achievements" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service role can manage all progress" ON "public"."player_achievement_progress" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Super admin can manage achievement categories" ON "public"."achievement_categories" USING (("auth"."uid"() = 'caeedd2f-5809-41ff-8a79-0c4c64836d2b'::"uuid"));



CREATE POLICY "Super admin can manage achievement definitions" ON "public"."achievement_definitions" USING (("auth"."uid"() = 'caeedd2f-5809-41ff-8a79-0c4c64836d2b'::"uuid"));



CREATE POLICY "System can manage season_rankings" ON "public"."season_rankings" USING (true);



CREATE POLICY "Team members can update team" ON "public"."teams" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."player"
  WHERE ((("player"."id" = "teams"."player1_id") OR ("player"."id" = "teams"."player2_id")) AND ("player"."user_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."player"
  WHERE ((("player"."id" = "teams"."player1_id") OR ("player"."id" = "teams"."player2_id")) AND ("player"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can create invitations" ON "public"."team_invitations" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."player"
  WHERE (("player"."id" = "team_invitations"."inviting_player_id") AND ("player"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can create teams" ON "public"."teams" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."player"
  WHERE (("player"."id" = "teams"."player1_id") AND ("player"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can delete own chat reactions" ON "public"."chat_reactions" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."player"
  WHERE (("player"."id" = "chat_reactions"."player_id") AND ("player"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can delete own comment reactions" ON "public"."comment_reactions" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."player"
  WHERE (("player"."id" = "comment_reactions"."player_id") AND ("player"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can delete own comment read status" ON "public"."comment_read_status" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own match comment read status" ON "public"."match_comment_read_status" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own match reactions" ON "public"."match_reactions" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."player"
  WHERE (("player"."id" = "match_reactions"."player_id") AND ("player"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can delete own mention notifications" ON "public"."mention_notifications" FOR DELETE USING (("auth"."uid"() = "user_id"));



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



CREATE POLICY "Users can insert own match comment read status" ON "public"."match_comment_read_status" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own push subscriptions" ON "public"."push_subscriptions" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own read status" ON "public"."chat_read_status" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own notification settings" ON "public"."user_notification_settings" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



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



CREATE POLICY "Users can update own match comment read status" ON "public"."match_comment_read_status" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own mention notifications" ON "public"."mention_notifications" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own push subscriptions" ON "public"."push_subscriptions" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own read status" ON "public"."chat_read_status" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own typing status" ON "public"."chat_typing" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."player"
  WHERE (("player"."id" = "chat_typing"."player_id") AND ("player"."user_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."player"
  WHERE (("player"."id" = "chat_typing"."player_id") AND ("player"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can update their own notification settings" ON "public"."user_notification_settings" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view achievements for players in their kickers" ON "public"."player_achievements" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."player" "p"
     JOIN "public"."player" "p2" ON (("p"."kicker_id" = "p2"."kicker_id")))
  WHERE (("p2"."id" = "player_achievements"."player_id") AND ("p"."user_id" = "auth"."uid"())))));



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



CREATE POLICY "Users can view own invitations" ON "public"."team_invitations" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."player"
  WHERE ((("player"."id" = "team_invitations"."inviting_player_id") OR ("player"."id" = "team_invitations"."invited_player_id")) AND ("player"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view own match comment read status" ON "public"."match_comment_read_status" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own mention notifications" ON "public"."mention_notifications" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own push subscriptions" ON "public"."push_subscriptions" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own read status" ON "public"."chat_read_status" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view permissions in their kicker" ON "public"."user_permissions" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."player"
  WHERE (("player"."kicker_id" = "user_permissions"."kicker_id") AND ("player"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view season_rankings" ON "public"."season_rankings" FOR SELECT USING (true);



CREATE POLICY "Users can view seasons for their kickers" ON "public"."seasons" FOR SELECT USING (true);



CREATE POLICY "Users can view teams in their kickers" ON "public"."teams" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."player"
  WHERE (("player"."kicker_id" = "teams"."kicker_id") AND ("player"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view their own achievement progress" ON "public"."player_achievement_progress" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."player" "p"
  WHERE (("p"."id" = "player_achievement_progress"."player_id") AND ("p"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view their own notification settings" ON "public"."user_notification_settings" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view typing status" ON "public"."chat_typing" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."player"
  WHERE (("player"."kicker_id" = "chat_typing"."kicker_id") AND ("player"."user_id" = "auth"."uid"())))));



CREATE POLICY "access_control_on_goals" ON "public"."goals" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."player"
  WHERE (("player"."kicker_id" = "goals"."kicker_id") AND ("player"."user_id" = "auth"."uid"())))));



CREATE POLICY "access_control_on_matches" ON "public"."matches" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."player"
  WHERE (("player"."kicker_id" = "matches"."kicker_id") AND ("player"."user_id" = "auth"."uid"())))));



CREATE POLICY "access_control_on_team_history" ON "public"."team_history" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."teams" "t"
     JOIN "public"."player" "p" ON (("p"."kicker_id" = "t"."kicker_id")))
  WHERE (("t"."id" = "team_history"."team_id") AND ("p"."user_id" = "auth"."uid"())))));



CREATE POLICY "access_control_on_team_season_rankings" ON "public"."team_season_rankings" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."teams" "t"
     JOIN "public"."player" "p" ON (("p"."kicker_id" = "t"."kicker_id")))
  WHERE (("t"."id" = "team_season_rankings"."team_id") AND ("p"."user_id" = "auth"."uid"())))));



ALTER TABLE "public"."achievement_categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."achievement_definitions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."bounty_history" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "bounty_history_select_policy" ON "public"."bounty_history" FOR SELECT USING (true);



ALTER TABLE "public"."chat_messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."chat_reactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."chat_read_status" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."chat_typing" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."comment_reactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."comment_read_status" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "delete_control_on_goals" ON "public"."goals" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."player"
  WHERE (("player"."kicker_id" = "goals"."kicker_id") AND ("player"."user_id" = "auth"."uid"())))));



CREATE POLICY "delete_control_on_matches" ON "public"."matches" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."player"
  WHERE (("player"."kicker_id" = "matches"."kicker_id") AND ("player"."user_id" = "auth"."uid"())))));



CREATE POLICY "delete_control_on_team_history" ON "public"."team_history" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM ("public"."teams" "t"
     JOIN "public"."player" "p" ON (("p"."kicker_id" = "t"."kicker_id")))
  WHERE (("t"."id" = "team_history"."team_id") AND ("p"."user_id" = "auth"."uid"())))));



CREATE POLICY "delete_control_on_team_season_rankings" ON "public"."team_season_rankings" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM ("public"."teams" "t"
     JOIN "public"."player" "p" ON (("p"."kicker_id" = "t"."kicker_id")))
  WHERE (("t"."id" = "team_season_rankings"."team_id") AND ("p"."user_id" = "auth"."uid"())))));



ALTER TABLE "public"."goals" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "insert_control_on_goals" ON "public"."goals" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."player"
  WHERE (("player"."kicker_id" = "goals"."kicker_id") AND ("player"."user_id" = "auth"."uid"())))));



CREATE POLICY "insert_control_on_matches" ON "public"."matches" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."player"
  WHERE (("player"."kicker_id" = "matches"."kicker_id") AND ("player"."user_id" = "auth"."uid"())))));



CREATE POLICY "insert_control_on_team_history" ON "public"."team_history" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."teams" "t"
     JOIN "public"."player" "p" ON (("p"."kicker_id" = "t"."kicker_id")))
  WHERE (("t"."id" = "team_history"."team_id") AND ("p"."user_id" = "auth"."uid"())))));



CREATE POLICY "insert_control_on_team_season_rankings" ON "public"."team_season_rankings" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."teams" "t"
     JOIN "public"."player" "p" ON (("p"."kicker_id" = "t"."kicker_id")))
  WHERE (("t"."id" = "team_season_rankings"."team_id") AND ("p"."user_id" = "auth"."uid"())))));



ALTER TABLE "public"."match_comment_read_status" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."match_comments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."match_reactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."matches" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."mention_notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."player" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."player_achievement_progress" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."player_achievements" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."player_monthly_status" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "player_monthly_status_select_policy" ON "public"."player_monthly_status" FOR SELECT USING (true);



ALTER TABLE "public"."player_selected_rewards" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "player_selected_rewards_delete_policy" ON "public"."player_selected_rewards" FOR DELETE USING (("player_id" IN ( SELECT "player"."id"
   FROM "public"."player"
  WHERE ("player"."user_id" = "auth"."uid"()))));



CREATE POLICY "player_selected_rewards_insert_policy" ON "public"."player_selected_rewards" FOR INSERT WITH CHECK (("player_id" IN ( SELECT "player"."id"
   FROM "public"."player"
  WHERE ("player"."user_id" = "auth"."uid"()))));



CREATE POLICY "player_selected_rewards_select_policy" ON "public"."player_selected_rewards" FOR SELECT USING (true);



CREATE POLICY "player_selected_rewards_update_policy" ON "public"."player_selected_rewards" FOR UPDATE USING (("player_id" IN ( SELECT "player"."id"
   FROM "public"."player"
  WHERE ("player"."user_id" = "auth"."uid"()))));



ALTER TABLE "public"."player_status" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "player_status_select_policy" ON "public"."player_status" FOR SELECT USING (true);



ALTER TABLE "public"."push_subscriptions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reward_definitions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "reward_definitions_delete_policy" ON "public"."reward_definitions" FOR DELETE USING (("auth"."uid"() = 'caeedd2f-5809-41ff-8a79-0c4c64836d2b'::"uuid"));



CREATE POLICY "reward_definitions_insert_policy" ON "public"."reward_definitions" FOR INSERT WITH CHECK (("auth"."uid"() = 'caeedd2f-5809-41ff-8a79-0c4c64836d2b'::"uuid"));



CREATE POLICY "reward_definitions_select_policy" ON "public"."reward_definitions" FOR SELECT USING (true);



CREATE POLICY "reward_definitions_update_policy" ON "public"."reward_definitions" FOR UPDATE USING (("auth"."uid"() = 'caeedd2f-5809-41ff-8a79-0c4c64836d2b'::"uuid"));



ALTER TABLE "public"."season_rankings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."seasons" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."status_definitions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "status_definitions_select_policy" ON "public"."status_definitions" FOR SELECT USING (true);



ALTER TABLE "public"."status_display_config" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "status_display_config_select_policy" ON "public"."status_display_config" FOR SELECT USING (true);



CREATE POLICY "status_display_config_update_policy" ON "public"."status_display_config" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."kicker" "k"
  WHERE (("k"."id" = "status_display_config"."kicker_id") AND ("k"."admin" = "auth"."uid"())))));



ALTER TABLE "public"."team_bounty_history" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "team_bounty_history_select_policy" ON "public"."team_bounty_history" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."teams" "t"
     JOIN "public"."player" "p" ON (("p"."kicker_id" = "t"."kicker_id")))
  WHERE (("t"."id" = "team_bounty_history"."claimer_team_id") AND ("p"."user_id" = "auth"."uid"())))));



ALTER TABLE "public"."team_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."team_invitations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."team_season_rankings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."team_status" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "team_status_select_policy" ON "public"."team_status" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."teams" "t"
     JOIN "public"."player" "p" ON (("p"."kicker_id" = "t"."kicker_id")))
  WHERE (("t"."id" = "team_status"."team_id") AND ("p"."user_id" = "auth"."uid"())))));



ALTER TABLE "public"."teams" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "update_control_on_goals" ON "public"."goals" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."player"
  WHERE (("player"."kicker_id" = "goals"."kicker_id") AND ("player"."user_id" = "auth"."uid"())))));



CREATE POLICY "update_control_on_matches" ON "public"."matches" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."player"
  WHERE (("player"."kicker_id" = "matches"."kicker_id") AND ("player"."user_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."player"
  WHERE (("player"."kicker_id" = "matches"."kicker_id") AND ("player"."user_id" = "auth"."uid"())))));



CREATE POLICY "update_control_on_team_history" ON "public"."team_history" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM ("public"."teams" "t"
     JOIN "public"."player" "p" ON (("p"."kicker_id" = "t"."kicker_id")))
  WHERE (("t"."id" = "team_history"."team_id") AND ("p"."user_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."teams" "t"
     JOIN "public"."player" "p" ON (("p"."kicker_id" = "t"."kicker_id")))
  WHERE (("t"."id" = "team_history"."team_id") AND ("p"."user_id" = "auth"."uid"())))));



CREATE POLICY "update_control_on_team_season_rankings" ON "public"."team_season_rankings" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM ("public"."teams" "t"
     JOIN "public"."player" "p" ON (("p"."kicker_id" = "t"."kicker_id")))
  WHERE (("t"."id" = "team_season_rankings"."team_id") AND ("p"."user_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."teams" "t"
     JOIN "public"."player" "p" ON (("p"."kicker_id" = "t"."kicker_id")))
  WHERE (("t"."id" = "team_season_rankings"."team_id") AND ("p"."user_id" = "auth"."uid"())))));



ALTER TABLE "public"."user_notification_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_permissions" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."player" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."player" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."player" TO "service_role";



GRANT ALL ON FUNCTION "public"."accept_team_invitation"("p_invitation_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."accept_team_invitation"("p_invitation_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."accept_team_invitation"("p_invitation_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."add_bounty_to_season_rankings"("p_player_id" bigint, "p_season_id" bigint, "p_bounty_amount" integer, "p_gamemode" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."add_bounty_to_season_rankings"("p_player_id" bigint, "p_season_id" bigint, "p_bounty_amount" integer, "p_gamemode" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_bounty_to_season_rankings"("p_player_id" bigint, "p_season_id" bigint, "p_bounty_amount" integer, "p_gamemode" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."assign_match_number"() TO "anon";
GRANT ALL ON FUNCTION "public"."assign_match_number"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."assign_match_number"() TO "service_role";



GRANT ALL ON FUNCTION "public"."atomic_increment_progress"("p_player_id" bigint, "p_achievement_id" bigint, "p_increment" integer, "p_max_progress" integer, "p_season_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."atomic_increment_progress"("p_player_id" bigint, "p_achievement_id" bigint, "p_increment" integer, "p_max_progress" integer, "p_season_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."atomic_increment_progress"("p_player_id" bigint, "p_achievement_id" bigint, "p_increment" integer, "p_max_progress" integer, "p_season_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."batch_update_status_display_config"("p_kicker_id" integer, "p_configs" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."batch_update_status_display_config"("p_kicker_id" integer, "p_configs" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."batch_update_status_display_config"("p_kicker_id" integer, "p_configs" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_mention_notifications"("p_content" "text", "p_type" character varying, "p_source_id" bigint, "p_match_id" bigint, "p_kicker_id" bigint, "p_sender_player_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."create_mention_notifications"("p_content" "text", "p_type" character varying, "p_source_id" bigint, "p_match_id" bigint, "p_kicker_id" bigint, "p_sender_player_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_mention_notifications"("p_content" "text", "p_type" character varying, "p_source_id" bigint, "p_match_id" bigint, "p_kicker_id" bigint, "p_sender_player_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."create_season_end_history"("p_season_id" bigint, "p_kicker_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."create_season_end_history"("p_season_id" bigint, "p_kicker_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_season_end_history"("p_season_id" bigint, "p_kicker_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."create_season_ranking_for_new_player"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_season_ranking_for_new_player"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_season_ranking_for_new_player"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_team_with_invitation"("p_name" character varying, "p_partner_player_id" bigint, "p_kicker_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."create_team_with_invitation"("p_name" character varying, "p_partner_player_id" bigint, "p_kicker_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_team_with_invitation"("p_name" character varying, "p_partner_player_id" bigint, "p_kicker_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."decline_team_invitation"("p_invitation_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."decline_team_invitation"("p_invitation_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."decline_team_invitation"("p_invitation_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."delete_match_with_recalculation"("p_match_id" bigint, "p_kicker_id" bigint, "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."delete_match_with_recalculation"("p_match_id" bigint, "p_kicker_id" bigint, "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_match_with_recalculation"("p_match_id" bigint, "p_kicker_id" bigint, "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."delete_push_subscription"("p_subscription_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."delete_push_subscription"("p_subscription_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_push_subscription"("p_subscription_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."dissolve_team"("p_team_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."dissolve_team"("p_team_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."dissolve_team"("p_team_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."duplicate_schema_tables"() TO "anon";
GRANT ALL ON FUNCTION "public"."duplicate_schema_tables"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."duplicate_schema_tables"() TO "service_role";



GRANT ALL ON PROCEDURE "public"."fillgoalsfrommatches"() TO "anon";
GRANT ALL ON PROCEDURE "public"."fillgoalsfrommatches"() TO "authenticated";
GRANT ALL ON PROCEDURE "public"."fillgoalsfrommatches"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_bounty_leaderboard"("p_limit" integer, "p_month" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_bounty_leaderboard"("p_limit" integer, "p_month" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_bounty_leaderboard"("p_limit" integer, "p_month" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_combined_unread_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_combined_unread_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_combined_unread_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_combined_unread_count_for_user"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_combined_unread_count_for_user"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_combined_unread_count_for_user"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_kicker_invite_preview"("invite_token" "uuid", "inviter_player_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."get_kicker_invite_preview"("invite_token" "uuid", "inviter_player_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_kicker_invite_preview"("invite_token" "uuid", "inviter_player_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_kicker_permissions"("p_kicker_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."get_kicker_permissions"("p_kicker_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_kicker_permissions"("p_kicker_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_mention_notifications"("p_limit" integer, "p_offset" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_mention_notifications"("p_limit" integer, "p_offset" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_mention_notifications"("p_limit" integer, "p_offset" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_next_season_number"("p_kicker_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."get_next_season_number"("p_kicker_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_next_season_number"("p_kicker_id" bigint) TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."team_season_rankings" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."team_season_rankings" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."team_season_rankings" TO "service_role";



GRANT ALL ON FUNCTION "public"."get_or_create_team_season_ranking"("p_team_id" bigint, "p_season_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."get_or_create_team_season_ranking"("p_team_id" bigint, "p_season_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_or_create_team_season_ranking"("p_team_id" bigint, "p_season_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_pending_team_invitations"("p_player_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."get_pending_team_invitations"("p_player_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_pending_team_invitations"("p_player_id" bigint) TO "service_role";



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



GRANT ALL ON FUNCTION "public"."get_player_status"("p_player_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."get_player_status"("p_player_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_player_status"("p_player_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_player_team_stats"("p_player_id" bigint, "p_season_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."get_player_team_stats"("p_player_id" bigint, "p_season_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_player_team_stats"("p_player_id" bigint, "p_season_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_player_unlocked_rewards"("p_player_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."get_player_unlocked_rewards"("p_player_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_player_unlocked_rewards"("p_player_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_player_with_rewards"("p_player_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."get_player_with_rewards"("p_player_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_player_with_rewards"("p_player_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_players_by_kicker"("kicker_id_param" integer, "p_season_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."get_players_by_kicker"("kicker_id_param" integer, "p_season_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_players_by_kicker"("kicker_id_param" integer, "p_season_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_players_with_bounties"("p_gamemode" "text", "p_min_bounty" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_players_with_bounties"("p_gamemode" "text", "p_min_bounty" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_players_with_bounties"("p_gamemode" "text", "p_min_bounty" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_season_rankings"("p_kicker_id" bigint, "p_season_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."get_season_rankings"("p_kicker_id" bigint, "p_season_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_season_rankings"("p_kicker_id" bigint, "p_season_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_status_display_config"("p_kicker_id" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_status_display_config"("p_kicker_id" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_status_display_config"("p_kicker_id" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_team_bounty"("p_player_ids" bigint[], "p_gamemode" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_team_bounty"("p_player_ids" bigint[], "p_gamemode" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_team_bounty"("p_player_ids" bigint[], "p_gamemode" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_team_bounty_for_team"("p_team_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."get_team_bounty_for_team"("p_team_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_team_bounty_for_team"("p_team_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_team_mmr_history"("p_team_id" bigint, "p_limit" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_team_mmr_history"("p_team_id" bigint, "p_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_team_mmr_history"("p_team_id" bigint, "p_limit" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_team_season_rankings"("p_kicker_id" bigint, "p_season_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."get_team_season_rankings"("p_kicker_id" bigint, "p_season_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_team_season_rankings"("p_kicker_id" bigint, "p_season_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_teams_by_kicker"("p_kicker_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."get_teams_by_kicker"("p_kicker_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_teams_by_kicker"("p_kicker_id" bigint) TO "service_role";



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



GRANT ALL ON FUNCTION "public"."get_unread_match_comment_count"("p_match_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."get_unread_match_comment_count"("p_match_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_unread_match_comment_count"("p_match_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_unread_mention_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_unread_mention_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_unread_mention_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_permissions"("p_user_id" "uuid", "p_kicker_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_permissions"("p_user_id" "uuid", "p_kicker_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_permissions"("p_user_id" "uuid", "p_kicker_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_sessions"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_sessions"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_sessions"() TO "service_role";



GRANT ALL ON FUNCTION "public"."grant_permission"("p_user_id" "uuid", "p_kicker_id" bigint, "p_permission_type" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."grant_permission"("p_user_id" "uuid", "p_kicker_id" bigint, "p_permission_type" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."grant_permission"("p_user_id" "uuid", "p_kicker_id" bigint, "p_permission_type" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_goal_achievement_progress"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_goal_achievement_progress"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_goal_achievement_progress"() TO "service_role";



GRANT ALL ON FUNCTION "public"."has_permission"("p_user_id" "uuid", "p_kicker_id" bigint, "p_permission_type" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."has_permission"("p_user_id" "uuid", "p_kicker_id" bigint, "p_permission_type" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."has_permission"("p_user_id" "uuid", "p_kicker_id" bigint, "p_permission_type" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_achievement_progress"("p_player_id" bigint, "p_achievement_id" bigint, "p_increment" integer, "p_season_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."increment_achievement_progress"("p_player_id" bigint, "p_achievement_id" bigint, "p_increment" integer, "p_season_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_achievement_progress"("p_player_id" bigint, "p_achievement_id" bigint, "p_increment" integer, "p_season_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_nr"() TO "anon";
GRANT ALL ON FUNCTION "public"."increment_nr"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_nr"() TO "service_role";



GRANT ALL ON FUNCTION "public"."mark_all_mentions_as_read"() TO "anon";
GRANT ALL ON FUNCTION "public"."mark_all_mentions_as_read"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."mark_all_mentions_as_read"() TO "service_role";



GRANT ALL ON FUNCTION "public"."mark_mention_as_read"("p_notification_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."mark_mention_as_read"("p_notification_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."mark_mention_as_read"("p_notification_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_achievement_unlocked"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_achievement_unlocked"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_achievement_unlocked"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_mention"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_mention"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_mention"() TO "service_role";



GRANT ALL ON FUNCTION "public"."record_team_history"() TO "anon";
GRANT ALL ON FUNCTION "public"."record_team_history"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."record_team_history"() TO "service_role";



GRANT ALL ON FUNCTION "public"."revoke_permission"("p_user_id" "uuid", "p_kicker_id" bigint, "p_permission_type" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."revoke_permission"("p_user_id" "uuid", "p_kicker_id" bigint, "p_permission_type" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."revoke_permission"("p_user_id" "uuid", "p_kicker_id" bigint, "p_permission_type" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."set_device_notifications_enabled"("p_subscription_id" bigint, "p_enabled" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."set_device_notifications_enabled"("p_subscription_id" bigint, "p_enabled" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_device_notifications_enabled"("p_subscription_id" bigint, "p_enabled" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."set_global_notifications_enabled"("p_enabled" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."set_global_notifications_enabled"("p_enabled" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_global_notifications_enabled"("p_enabled" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_point_collector_on_achievement"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_point_collector_on_achievement"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_point_collector_on_achievement"() TO "service_role";



GRANT ALL ON FUNCTION "public"."terminate_other_sessions"("current_session_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."terminate_other_sessions"("current_session_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."terminate_other_sessions"("current_session_id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."terminate_session"("target_session_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."terminate_session"("target_session_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."terminate_session"("target_session_id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_create_chat_all_notifications"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_create_chat_all_notifications"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_create_chat_all_notifications"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_create_chat_mention_notifications"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_create_chat_mention_notifications"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_create_chat_mention_notifications"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_create_comment_mention_notifications"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_create_comment_mention_notifications"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_create_comment_mention_notifications"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_create_team_invite_notification"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_create_team_invite_notification"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_create_team_invite_notification"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_mark_team_invite_notification_read"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_mark_team_invite_notification_read"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_mark_team_invite_notification_read"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_process_achievement"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_process_achievement"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_process_achievement"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_send_push_notification"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_send_push_notification"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_send_push_notification"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_achievement_definition_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_achievement_definition_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_achievement_definition_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_achievement_progress_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_achievement_progress_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_achievement_progress_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_chat_read_status"("p_kicker_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."update_chat_read_status"("p_kicker_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_chat_read_status"("p_kicker_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_comment_read_status"("p_kicker_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."update_comment_read_status"("p_kicker_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_comment_read_status"("p_kicker_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_match_comment_read_status"("p_match_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."update_match_comment_read_status"("p_match_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_match_comment_read_status"("p_match_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_notification_preferences"("p_subscription_id" bigint, "p_notify_all_chat" boolean, "p_notify_mentions" boolean, "p_notify_team_invites" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."update_notification_preferences"("p_subscription_id" bigint, "p_notify_all_chat" boolean, "p_notify_mentions" boolean, "p_notify_team_invites" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_notification_preferences"("p_subscription_id" bigint, "p_notify_all_chat" boolean, "p_notify_mentions" boolean, "p_notify_team_invites" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_player_history"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_player_history"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_player_history"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_player_selected_reward"("p_player_id" bigint, "p_reward_type" "text", "p_reward_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."update_player_selected_reward"("p_player_id" bigint, "p_reward_type" "text", "p_reward_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_player_selected_reward"("p_player_id" bigint, "p_reward_type" "text", "p_reward_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_player_status_after_match"("p_player_id" bigint, "p_match_id" bigint, "p_gamemode" "text", "p_is_winner" boolean, "p_score_diff" integer, "p_own_mmr" integer, "p_opponent_mmr" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."update_player_status_after_match"("p_player_id" bigint, "p_match_id" bigint, "p_gamemode" "text", "p_is_winner" boolean, "p_score_diff" integer, "p_own_mmr" integer, "p_opponent_mmr" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_player_status_after_match"("p_player_id" bigint, "p_match_id" bigint, "p_gamemode" "text", "p_is_winner" boolean, "p_score_diff" integer, "p_own_mmr" integer, "p_opponent_mmr" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_point_collector_progress"("p_player_id" bigint, "p_achievement_key" "text", "p_total_points" integer, "p_season_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."update_point_collector_progress"("p_player_id" bigint, "p_achievement_key" "text", "p_total_points" integer, "p_season_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_point_collector_progress"("p_player_id" bigint, "p_achievement_key" "text", "p_total_points" integer, "p_season_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_push_subscription_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_push_subscription_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_push_subscription_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_sequences"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_sequences"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_sequences"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_sequences_in_kopecht"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_sequences_in_kopecht"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_sequences_in_kopecht"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_status_display_config"("p_kicker_id" integer, "p_status_key" character varying, "p_layer" character varying, "p_priority" integer, "p_is_exclusive" boolean, "p_is_enabled" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."update_status_display_config"("p_kicker_id" integer, "p_status_key" character varying, "p_layer" character varying, "p_priority" integer, "p_is_exclusive" boolean, "p_is_enabled" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_status_display_config"("p_kicker_id" integer, "p_status_key" character varying, "p_layer" character varying, "p_priority" integer, "p_is_exclusive" boolean, "p_is_enabled" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_team_mmr"("p_team_id" bigint, "p_mmr_change" integer, "p_won" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."update_team_mmr"("p_team_id" bigint, "p_mmr_change" integer, "p_won" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_team_mmr"("p_team_id" bigint, "p_mmr_change" integer, "p_won" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_team_season_ranking"("p_team_id" bigint, "p_season_id" bigint, "p_mmr_change" integer, "p_won" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."update_team_season_ranking"("p_team_id" bigint, "p_season_id" bigint, "p_mmr_change" integer, "p_won" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_team_season_ranking"("p_team_id" bigint, "p_season_id" bigint, "p_mmr_change" integer, "p_won" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_team_season_ranking_with_bounty"("p_team_id" bigint, "p_season_id" bigint, "p_mmr_change" integer, "p_won" boolean, "p_bounty_claimed" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."update_team_season_ranking_with_bounty"("p_team_id" bigint, "p_season_id" bigint, "p_mmr_change" integer, "p_won" boolean, "p_bounty_claimed" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_team_season_ranking_with_bounty"("p_team_id" bigint, "p_season_id" bigint, "p_mmr_change" integer, "p_won" boolean, "p_bounty_claimed" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_team_status_after_match"("p_team_id" bigint, "p_match_id" bigint, "p_is_winner" boolean, "p_opponent_team_id" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."update_team_status_after_match"("p_team_id" bigint, "p_match_id" bigint, "p_is_winner" boolean, "p_opponent_team_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_team_status_after_match"("p_team_id" bigint, "p_match_id" bigint, "p_is_winner" boolean, "p_opponent_team_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."upsert_fcm_token"("p_fcm_token" "text", "p_device_info" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."upsert_fcm_token"("p_fcm_token" "text", "p_device_info" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."upsert_fcm_token"("p_fcm_token" "text", "p_device_info" "text") TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."achievement_categories" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."achievement_categories" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."achievement_categories" TO "service_role";



GRANT ALL ON SEQUENCE "public"."achievement_categories_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."achievement_categories_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."achievement_categories_id_seq" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."achievement_definitions" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."achievement_definitions" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."achievement_definitions" TO "service_role";



GRANT ALL ON SEQUENCE "public"."achievement_definitions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."achievement_definitions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."achievement_definitions_id_seq" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."bounty_history" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."bounty_history" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."bounty_history" TO "service_role";



GRANT ALL ON SEQUENCE "public"."bounty_history_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."bounty_history_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."bounty_history_id_seq" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."chat_messages" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."chat_messages" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."chat_messages" TO "service_role";



GRANT ALL ON SEQUENCE "public"."chat_messages_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."chat_messages_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."chat_messages_id_seq" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."chat_reactions" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."chat_reactions" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."chat_reactions" TO "service_role";



GRANT ALL ON SEQUENCE "public"."chat_reactions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."chat_reactions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."chat_reactions_id_seq" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."chat_read_status" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."chat_read_status" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."chat_read_status" TO "service_role";



GRANT ALL ON SEQUENCE "public"."chat_read_status_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."chat_read_status_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."chat_read_status_id_seq" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."chat_typing" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."chat_typing" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."chat_typing" TO "service_role";



GRANT ALL ON SEQUENCE "public"."chat_typing_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."chat_typing_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."chat_typing_id_seq" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."comment_reactions" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."comment_reactions" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."comment_reactions" TO "service_role";



GRANT ALL ON SEQUENCE "public"."comment_reactions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."comment_reactions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."comment_reactions_id_seq" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."comment_read_status" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."comment_read_status" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."comment_read_status" TO "service_role";



GRANT ALL ON SEQUENCE "public"."comment_read_status_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."comment_read_status_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."comment_read_status_id_seq" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."goals" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."goals" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."goals" TO "service_role";



GRANT ALL ON SEQUENCE "public"."goals_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."goals_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."goals_id_seq" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."kicker" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."kicker" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."kicker" TO "service_role";



GRANT ALL ON SEQUENCE "public"."kicker_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."kicker_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."kicker_id_seq" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."match_comment_read_status" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."match_comment_read_status" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."match_comment_read_status" TO "service_role";



GRANT ALL ON SEQUENCE "public"."match_comment_read_status_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."match_comment_read_status_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."match_comment_read_status_id_seq" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."match_comments" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."match_comments" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."match_comments" TO "service_role";



GRANT ALL ON SEQUENCE "public"."match_comments_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."match_comments_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."match_comments_id_seq" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."match_reactions" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."match_reactions" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."match_reactions" TO "service_role";



GRANT ALL ON SEQUENCE "public"."match_reactions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."match_reactions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."match_reactions_id_seq" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."matches" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."matches" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."matches" TO "service_role";



GRANT ALL ON SEQUENCE "public"."matches_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."matches_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."matches_id_seq" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."mention_notifications" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."mention_notifications" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."mention_notifications" TO "service_role";



GRANT ALL ON SEQUENCE "public"."mention_notifications_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."mention_notifications_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."mention_notifications_id_seq" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."player_achievement_progress" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."player_achievement_progress" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."player_achievement_progress" TO "service_role";



GRANT ALL ON SEQUENCE "public"."player_achievement_progress_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."player_achievement_progress_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."player_achievement_progress_id_seq" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."player_achievements" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."player_achievements" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."player_achievements" TO "service_role";



GRANT ALL ON SEQUENCE "public"."player_achievements_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."player_achievements_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."player_achievements_id_seq" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."player_history" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."player_history" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."player_history" TO "service_role";



GRANT ALL ON SEQUENCE "public"."player_history_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."player_history_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."player_history_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."player_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."player_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."player_id_seq" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."player_monthly_status" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."player_monthly_status" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."player_monthly_status" TO "service_role";



GRANT ALL ON SEQUENCE "public"."player_monthly_status_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."player_monthly_status_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."player_monthly_status_id_seq" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."player_selected_rewards" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."player_selected_rewards" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."player_selected_rewards" TO "service_role";



GRANT ALL ON SEQUENCE "public"."player_selected_rewards_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."player_selected_rewards_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."player_selected_rewards_id_seq" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."player_status" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."player_status" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."player_status" TO "service_role";



GRANT ALL ON SEQUENCE "public"."player_status_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."player_status_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."player_status_id_seq" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."push_subscriptions" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."push_subscriptions" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."push_subscriptions" TO "service_role";



GRANT ALL ON SEQUENCE "public"."push_subscriptions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."push_subscriptions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."push_subscriptions_id_seq" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."reward_definitions" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."reward_definitions" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."reward_definitions" TO "service_role";



GRANT ALL ON SEQUENCE "public"."reward_definitions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."reward_definitions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."reward_definitions_id_seq" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."season_rankings" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."season_rankings" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."season_rankings" TO "service_role";



GRANT ALL ON SEQUENCE "public"."season_rankings_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."season_rankings_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."season_rankings_id_seq" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."seasons" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."seasons" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."seasons" TO "service_role";



GRANT ALL ON SEQUENCE "public"."seasons_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."seasons_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."seasons_id_seq" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."status_definitions" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."status_definitions" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."status_definitions" TO "service_role";



GRANT ALL ON SEQUENCE "public"."status_definitions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."status_definitions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."status_definitions_id_seq" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."status_display_config" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."status_display_config" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."status_display_config" TO "service_role";



GRANT ALL ON SEQUENCE "public"."status_display_config_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."status_display_config_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."status_display_config_id_seq" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."team_bounty_history" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."team_bounty_history" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."team_bounty_history" TO "service_role";



GRANT ALL ON SEQUENCE "public"."team_bounty_history_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."team_bounty_history_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."team_bounty_history_id_seq" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."team_history" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."team_history" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."team_history" TO "service_role";



GRANT ALL ON SEQUENCE "public"."team_history_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."team_history_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."team_history_id_seq" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."team_invitations" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."team_invitations" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."team_invitations" TO "service_role";



GRANT ALL ON SEQUENCE "public"."team_invitations_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."team_invitations_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."team_invitations_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."team_season_rankings_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."team_season_rankings_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."team_season_rankings_id_seq" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."team_status" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."team_status" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."team_status" TO "service_role";



GRANT ALL ON SEQUENCE "public"."team_status_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."team_status_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."team_status_id_seq" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."teams" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."teams" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."teams" TO "service_role";



GRANT ALL ON SEQUENCE "public"."teams_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."teams_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."teams_id_seq" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."user_notification_settings" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."user_notification_settings" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."user_notification_settings" TO "service_role";



GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."user_permissions" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."user_permissions" TO "authenticated";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLE "public"."user_permissions" TO "service_role";



GRANT ALL ON SEQUENCE "public"."user_permissions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."user_permissions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."user_permissions_id_seq" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,UPDATE ON TABLES TO "service_role";







