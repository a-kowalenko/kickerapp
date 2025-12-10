-- Migration: Create delete_match_with_recalculation RPC function for public schema (PRODUCTION)
-- This function atomically deletes a match and recalculates all subsequent matches' MMR
-- Admin-only operation

-- Constants used in MMR calculation (must match frontend constants.js)
-- K_FACTOR = 32
-- FATALITY_FAKTOR = 2

CREATE OR REPLACE FUNCTION public.delete_match_with_recalculation(
    p_match_id BIGINT,
    p_kicker_id BIGINT,
    p_user_id UUID
)
RETURNS JSONB AS $$
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

    -- 6. Delete player_history entries for ALL players of this kicker from match date onward
    -- We need to recreate history for all players to maintain consistency
    DELETE FROM public.player_history 
    WHERE kicker_id = p_kicker_id 
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
    END LOOP;

    -- 9. Recreate player_history entries for all players of this kicker from match_date to today

    -- For each day from match_date to today
    v_current_date := v_match_date;
    WHILE v_current_date <= CURRENT_DATE LOOP
        -- For each player of this kicker (not just affected ones, to maintain complete history)
        FOR v_player_record IN
            SELECT p.*
            FROM public.player p
            WHERE p.kicker_id = p_kicker_id
        LOOP
            -- Get season_id that was active on v_current_date for this kicker
            SELECT s.id INTO v_history_season_id
            FROM public.seasons s
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
            FROM public.matches
            WHERE DATE(created_at) = v_current_date
            AND gamemode = '1on1'
            AND kicker_id = v_player_record.kicker_id
            AND status = 'ended'
            AND ((player1 = v_player_record.id AND "scoreTeam1" > "scoreTeam2") OR
                 (player2 = v_player_record.id AND "scoreTeam1" < "scoreTeam2"));

            SELECT COUNT(*) INTO v_lossCount
            FROM public.matches
            WHERE DATE(created_at) = v_current_date
            AND gamemode = '1on1'
            AND kicker_id = v_player_record.kicker_id
            AND status = 'ended'
            AND ((player1 = v_player_record.id AND "scoreTeam1" < "scoreTeam2") OR
                 (player2 = v_player_record.id AND "scoreTeam1" > "scoreTeam2"));

            -- Calculate wins2on2 and losses2on2 for 2on2 on this day
            -- FIXED: Include player3 and player4 in team membership check
            SELECT COUNT(*) INTO v_win2on2Count
            FROM public.matches
            WHERE DATE(created_at) = v_current_date
            AND gamemode = '2on2'
            AND kicker_id = v_player_record.kicker_id
            AND status = 'ended'
            AND (((player1 = v_player_record.id OR player3 = v_player_record.id) AND "scoreTeam1" > "scoreTeam2") OR
                 ((player2 = v_player_record.id OR player4 = v_player_record.id) AND "scoreTeam1" < "scoreTeam2"));

            SELECT COUNT(*) INTO v_loss2on2Count
            FROM public.matches
            WHERE DATE(created_at) = v_current_date
            AND gamemode = '2on2'
            AND kicker_id = v_player_record.kicker_id
            AND status = 'ended'
            AND (((player1 = v_player_record.id OR player3 = v_player_record.id) AND "scoreTeam1" < "scoreTeam2") OR
                 ((player2 = v_player_record.id OR player4 = v_player_record.id) AND "scoreTeam1" > "scoreTeam2"));

            -- Calculate wins2on1 and losses2on1 for 2on1 on this day
            -- FIXED: Include player3 and player4 in team membership check
            SELECT COUNT(*) INTO v_win2on1Count
            FROM public.matches
            WHERE DATE(created_at) = v_current_date
            AND gamemode = '2on1'
            AND kicker_id = v_player_record.kicker_id
            AND status = 'ended'
            AND (((player1 = v_player_record.id OR player3 = v_player_record.id) AND "scoreTeam1" > "scoreTeam2") OR
                 ((player2 = v_player_record.id OR player4 = v_player_record.id) AND "scoreTeam1" < "scoreTeam2"));

            SELECT COUNT(*) INTO v_loss2on1Count
            FROM public.matches
            WHERE DATE(created_at) = v_current_date
            AND gamemode = '2on1'
            AND kicker_id = v_player_record.kicker_id
            AND status = 'ended'
            AND (((player1 = v_player_record.id OR player3 = v_player_record.id) AND "scoreTeam1" < "scoreTeam2") OR
                 ((player2 = v_player_record.id OR player4 = v_player_record.id) AND "scoreTeam1" > "scoreTeam2"));

            -- Calculate total play time for 1on1 on this day
            SELECT COALESCE(SUM(EXTRACT(EPOCH FROM (end_time - start_time))), 0) INTO v_totalDuration
            FROM public.matches
            WHERE DATE(created_at) = v_current_date
            AND gamemode = '1on1'
            AND kicker_id = v_player_record.kicker_id
            AND status = 'ended'
            AND (player1 = v_player_record.id OR player2 = v_player_record.id);

            -- Calculate total play time for 2on2 on this day
            SELECT COALESCE(SUM(EXTRACT(EPOCH FROM (end_time - start_time))), 0) INTO v_totalDuration2on2
            FROM public.matches
            WHERE DATE(created_at) = v_current_date
            AND gamemode = '2on2'
            AND kicker_id = v_player_record.kicker_id
            AND status = 'ended'
            AND (player1 = v_player_record.id OR player2 = v_player_record.id OR player3 = v_player_record.id OR player4 = v_player_record.id);

            -- Calculate total play time for 2on1 on this day
            SELECT COALESCE(SUM(EXTRACT(EPOCH FROM (end_time - start_time))), 0) INTO v_totalDuration2on1
            FROM public.matches
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
                FROM public.season_rankings sr
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
                FROM public.matches m
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
                    FROM public.player_history ph
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
                FROM public.matches m
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
                    FROM public.player_history ph
                    WHERE ph.player_id = v_player_record.id
                    AND DATE(ph.created_at) < v_current_date
                    ORDER BY ph.created_at DESC
                    LIMIT 1;
                    
                    v_end_of_day_mmr2on2 := COALESCE(v_end_of_day_mmr2on2, 1000);
                END IF;
            END IF;

            -- Insert player_history entry for this day
            INSERT INTO public.player_history (
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users (admin check is done inside the function)
GRANT EXECUTE ON FUNCTION public.delete_match_with_recalculation(BIGINT, BIGINT, UUID) TO authenticated;
