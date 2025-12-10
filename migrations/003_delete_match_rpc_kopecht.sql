-- Migration: Create delete_match_with_recalculation RPC function for kopecht schema
-- This function atomically deletes a match and recalculates all subsequent matches' MMR
-- Admin-only operation

-- Constants used in MMR calculation (must match frontend constants.js)
-- K_FACTOR = 32
-- FATALITY_FAKTOR = 2

SET search_path TO kopecht;

CREATE OR REPLACE FUNCTION kopecht.delete_match_with_recalculation(
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
BEGIN
    -- 1. Validate kicker exists and user is admin
    SELECT * INTO v_kicker FROM kopecht.kicker WHERE id = p_kicker_id;
    
    IF v_kicker IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Kicker not found');
    END IF;
    
    IF v_kicker.admin IS NULL OR v_kicker.admin != p_user_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'Only admins can delete matches');
    END IF;

    -- 2. Fetch and validate the match
    SELECT m.*
    INTO v_match
    FROM kopecht.matches m
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
    DELETE FROM kopecht.goals WHERE match_id = p_match_id;

    -- 4. Reverse player table stats (wins/losses only, no MMR in player table)
    IF v_gamemode = '1on1' THEN
        IF v_team1_wins THEN
            UPDATE kopecht.player SET wins = wins - 1 WHERE id = v_match.player1;
            UPDATE kopecht.player SET losses = losses - 1 WHERE id = v_match.player2;
        ELSE
            UPDATE kopecht.player SET losses = losses - 1 WHERE id = v_match.player1;
            UPDATE kopecht.player SET wins = wins - 1 WHERE id = v_match.player2;
        END IF;
    ELSIF v_gamemode = '2on2' THEN
        IF v_team1_wins THEN
            UPDATE kopecht.player SET wins2on2 = wins2on2 - 1 WHERE id = v_match.player1;
            UPDATE kopecht.player SET wins2on2 = wins2on2 - 1 WHERE id = v_match.player3;
            UPDATE kopecht.player SET losses2on2 = losses2on2 - 1 WHERE id = v_match.player2;
            UPDATE kopecht.player SET losses2on2 = losses2on2 - 1 WHERE id = v_match.player4;
        ELSE
            UPDATE kopecht.player SET losses2on2 = losses2on2 - 1 WHERE id = v_match.player1;
            UPDATE kopecht.player SET losses2on2 = losses2on2 - 1 WHERE id = v_match.player3;
            UPDATE kopecht.player SET wins2on2 = wins2on2 - 1 WHERE id = v_match.player2;
            UPDATE kopecht.player SET wins2on2 = wins2on2 - 1 WHERE id = v_match.player4;
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
                UPDATE kopecht.season_rankings 
                SET wins = wins - 1, mmr = COALESCE(v_match."mmrPlayer1", 1000)
                WHERE season_id = v_season_id AND player_id = v_match.player1;
                
                UPDATE kopecht.season_rankings 
                SET losses = losses - 1, mmr = COALESCE(v_match."mmrPlayer2", 1000)
                WHERE season_id = v_season_id AND player_id = v_match.player2;
            ELSE
                UPDATE kopecht.season_rankings 
                SET losses = losses - 1, mmr = COALESCE(v_match."mmrPlayer1", 1000)
                WHERE season_id = v_season_id AND player_id = v_match.player1;
                
                UPDATE kopecht.season_rankings 
                SET wins = wins - 1, mmr = COALESCE(v_match."mmrPlayer2", 1000)
                WHERE season_id = v_season_id AND player_id = v_match.player2;
            END IF;
        ELSIF v_gamemode = '2on2' THEN
            IF v_team1_wins THEN
                UPDATE kopecht.season_rankings 
                SET wins2on2 = wins2on2 - 1, mmr2on2 = COALESCE(v_match."mmrPlayer1", 1000)
                WHERE season_id = v_season_id AND player_id = v_match.player1;
                
                UPDATE kopecht.season_rankings 
                SET wins2on2 = wins2on2 - 1, mmr2on2 = COALESCE(v_match."mmrPlayer3", 1000)
                WHERE season_id = v_season_id AND player_id = v_match.player3;
                
                UPDATE kopecht.season_rankings 
                SET losses2on2 = losses2on2 - 1, mmr2on2 = COALESCE(v_match."mmrPlayer2", 1000)
                WHERE season_id = v_season_id AND player_id = v_match.player2;
                
                UPDATE kopecht.season_rankings 
                SET losses2on2 = losses2on2 - 1, mmr2on2 = COALESCE(v_match."mmrPlayer4", 1000)
                WHERE season_id = v_season_id AND player_id = v_match.player4;
            ELSE
                UPDATE kopecht.season_rankings 
                SET losses2on2 = losses2on2 - 1, mmr2on2 = COALESCE(v_match."mmrPlayer1", 1000)
                WHERE season_id = v_season_id AND player_id = v_match.player1;
                
                UPDATE kopecht.season_rankings 
                SET losses2on2 = losses2on2 - 1, mmr2on2 = COALESCE(v_match."mmrPlayer3", 1000)
                WHERE season_id = v_season_id AND player_id = v_match.player3;
                
                UPDATE kopecht.season_rankings 
                SET wins2on2 = wins2on2 - 1, mmr2on2 = COALESCE(v_match."mmrPlayer2", 1000)
                WHERE season_id = v_season_id AND player_id = v_match.player2;
                
                UPDATE kopecht.season_rankings 
                SET wins2on2 = wins2on2 - 1, mmr2on2 = COALESCE(v_match."mmrPlayer4", 1000)
                WHERE season_id = v_season_id AND player_id = v_match.player4;
            END IF;
        END IF;
    END IF;

    -- 6. Delete player_history entries for affected players from match date onward
    DELETE FROM kopecht.player_history 
    WHERE player_id = ANY(v_affected_player_ids) 
    AND DATE(created_at) >= v_match_date;

    -- 7. Delete the match
    DELETE FROM kopecht.matches WHERE id = p_match_id;

    -- 8. Recalculate MMR for all subsequent matches
    -- We track each player's running MMR in v_player_mmr_map/v_player_mmr2on2_map
    -- Starting from the MMR before the deleted match, we recalculate each subsequent match
    FOR v_subsequent_match IN
        SELECT m.*
        FROM kopecht.matches m
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
                FROM kopecht.season_rankings 
                WHERE season_id = v_subsequent_match.season_id AND player_id = v_subsequent_match.player1;
                v_p1_mmr_before := COALESCE(v_p1_mmr_before, 1000);
            END IF;
            
            v_player_id_str := v_subsequent_match.player2::TEXT;
            IF v_player_mmr_map ? v_player_id_str THEN
                v_p2_mmr_before := (v_player_mmr_map ->> v_player_id_str)::INT;
            ELSE
                SELECT COALESCE(mmr, 1000) INTO v_p2_mmr_before
                FROM kopecht.season_rankings 
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
            UPDATE kopecht.matches 
            SET "mmrChangeTeam1" = v_mmr_change_team1,
                "mmrChangeTeam2" = v_mmr_change_team2,
                "mmrPlayer1" = v_p1_mmr_before,
                "mmrPlayer2" = v_p2_mmr_before
            WHERE id = v_subsequent_match.id;

            -- Update running MMR for next iteration
            v_player_mmr_map := jsonb_set(v_player_mmr_map, ARRAY[v_subsequent_match.player1::TEXT], to_jsonb(v_p1_mmr_before + v_mmr_change_team1));
            v_player_mmr_map := jsonb_set(v_player_mmr_map, ARRAY[v_subsequent_match.player2::TEXT], to_jsonb(v_p2_mmr_before + v_mmr_change_team2));

            -- Update season_rankings with final MMR after this match
            UPDATE kopecht.season_rankings 
            SET mmr = v_p1_mmr_before + v_mmr_change_team1
            WHERE season_id = v_subsequent_match.season_id AND player_id = v_subsequent_match.player1;

            UPDATE kopecht.season_rankings 
            SET mmr = v_p2_mmr_before + v_mmr_change_team2
            WHERE season_id = v_subsequent_match.season_id AND player_id = v_subsequent_match.player2;

        ELSIF v_subsequent_match.gamemode = '2on2' THEN
            -- Get current running MMR for players (2on2)
            v_player_id_str := v_subsequent_match.player1::TEXT;
            IF v_player_mmr2on2_map ? v_player_id_str THEN
                v_p1_mmr_before := (v_player_mmr2on2_map ->> v_player_id_str)::INT;
            ELSE
                SELECT COALESCE(mmr2on2, 1000) INTO v_p1_mmr_before
                FROM kopecht.season_rankings 
                WHERE season_id = v_subsequent_match.season_id AND player_id = v_subsequent_match.player1;
                v_p1_mmr_before := COALESCE(v_p1_mmr_before, 1000);
            END IF;
            
            v_player_id_str := v_subsequent_match.player2::TEXT;
            IF v_player_mmr2on2_map ? v_player_id_str THEN
                v_p2_mmr_before := (v_player_mmr2on2_map ->> v_player_id_str)::INT;
            ELSE
                SELECT COALESCE(mmr2on2, 1000) INTO v_p2_mmr_before
                FROM kopecht.season_rankings 
                WHERE season_id = v_subsequent_match.season_id AND player_id = v_subsequent_match.player2;
                v_p2_mmr_before := COALESCE(v_p2_mmr_before, 1000);
            END IF;
            
            v_player_id_str := v_subsequent_match.player3::TEXT;
            IF v_player_mmr2on2_map ? v_player_id_str THEN
                v_p3_mmr_before := (v_player_mmr2on2_map ->> v_player_id_str)::INT;
            ELSE
                SELECT COALESCE(mmr2on2, 1000) INTO v_p3_mmr_before
                FROM kopecht.season_rankings 
                WHERE season_id = v_subsequent_match.season_id AND player_id = v_subsequent_match.player3;
                v_p3_mmr_before := COALESCE(v_p3_mmr_before, 1000);
            END IF;
            
            v_player_id_str := v_subsequent_match.player4::TEXT;
            IF v_player_mmr2on2_map ? v_player_id_str THEN
                v_p4_mmr_before := (v_player_mmr2on2_map ->> v_player_id_str)::INT;
            ELSE
                SELECT COALESCE(mmr2on2, 1000) INTO v_p4_mmr_before
                FROM kopecht.season_rankings 
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
            UPDATE kopecht.matches 
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
            UPDATE kopecht.season_rankings 
            SET mmr2on2 = v_p1_mmr_before + v_mmr_change_team1
            WHERE season_id = v_subsequent_match.season_id AND player_id = v_subsequent_match.player1;

            UPDATE kopecht.season_rankings 
            SET mmr2on2 = v_p3_mmr_before + v_mmr_change_team1
            WHERE season_id = v_subsequent_match.season_id AND player_id = v_subsequent_match.player3;

            UPDATE kopecht.season_rankings 
            SET mmr2on2 = v_p2_mmr_before + v_mmr_change_team2
            WHERE season_id = v_subsequent_match.season_id AND player_id = v_subsequent_match.player2;

            UPDATE kopecht.season_rankings 
            SET mmr2on2 = v_p4_mmr_before + v_mmr_change_team2
            WHERE season_id = v_subsequent_match.season_id AND player_id = v_subsequent_match.player4;
        END IF;

        -- Also delete player_history for this subsequent match's affected players from its date
        DELETE FROM kopecht.player_history 
        WHERE player_id IN (v_subsequent_match.player1, v_subsequent_match.player2, 
                           COALESCE(v_subsequent_match.player3, -1), COALESCE(v_subsequent_match.player4, -1))
        AND DATE(created_at) >= DATE(v_subsequent_match.start_time);
    END LOOP;

    RETURN jsonb_build_object('success', true, 'message', 'Match deleted successfully');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users (admin check is done inside the function)
GRANT EXECUTE ON FUNCTION kopecht.delete_match_with_recalculation(BIGINT, BIGINT, UUID) TO authenticated;
