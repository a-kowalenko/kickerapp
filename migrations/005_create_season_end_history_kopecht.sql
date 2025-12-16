-- Migration: Create function to generate player_history entries when a season ends (kopecht schema)
-- This function creates final snapshots of player statistics at the end of a season
-- It works like update_player_history but for the season end date instead of CURRENT_DATE

SET search_path TO kopecht;

-- Create the function to generate season end history entries
CREATE OR REPLACE FUNCTION kopecht.create_season_end_history(p_season_id BIGINT, p_kicker_id BIGINT)
RETURNS void AS $$
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
    FROM kopecht.seasons
    WHERE id = p_season_id AND kicker_id = p_kicker_id;
    
    -- If no end_date found (season not ended or doesn't exist), use current date
    IF v_end_date IS NULL THEN
        v_end_date := CURRENT_DATE;
    END IF;

    -- Iterate over all players of this kicker
    FOR currentPlayer IN
        SELECT * FROM kopecht.player
        WHERE kicker_id = p_kicker_id
    LOOP
        -- Check for duplicate: skip if entry already exists for this player, season, and date
        IF EXISTS (
            SELECT 1 FROM kopecht.player_history
            WHERE player_id = currentPlayer.id
            AND season_id = p_season_id
            AND DATE(created_at) = v_end_date
        ) THEN
            CONTINUE;
        END IF;

        -- Get mmr and mmr2on2 from season_rankings
        SELECT sr.mmr, sr.mmr2on2 INTO v_mmr, v_mmr2on2
        FROM kopecht.season_rankings sr
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
        FROM kopecht.matches
        WHERE DATE(created_at) = v_end_date
        AND gamemode = '1on1'
        AND status = 'ended'
        AND ((player1 = currentPlayer.id AND "scoreTeam1" > "scoreTeam2") OR
             (player2 = currentPlayer.id AND "scoreTeam1" < "scoreTeam2"));

        SELECT COUNT(*) INTO lossCount
        FROM kopecht.matches
        WHERE DATE(created_at) = v_end_date
        AND gamemode = '1on1'
        AND status = 'ended'
        AND ((player1 = currentPlayer.id AND "scoreTeam1" < "scoreTeam2") OR
             (player2 = currentPlayer.id AND "scoreTeam1" > "scoreTeam2"));

        -- Calculate wins2on2 and losses2on2 for 2on2 on the end date
        -- Team 1 = player1 + player3, Team 2 = player2 + player4
        SELECT COUNT(*) INTO win2on2Count
        FROM kopecht.matches
        WHERE DATE(created_at) = v_end_date
        AND gamemode = '2on2'
        AND status = 'ended'
        AND (((player1 = currentPlayer.id OR player3 = currentPlayer.id) AND "scoreTeam1" > "scoreTeam2") OR
             ((player2 = currentPlayer.id OR player4 = currentPlayer.id) AND "scoreTeam1" < "scoreTeam2"));

        SELECT COUNT(*) INTO loss2on2Count
        FROM kopecht.matches
        WHERE DATE(created_at) = v_end_date
        AND gamemode = '2on2'
        AND status = 'ended'
        AND (((player1 = currentPlayer.id OR player3 = currentPlayer.id) AND "scoreTeam1" < "scoreTeam2") OR
             ((player2 = currentPlayer.id OR player4 = currentPlayer.id) AND "scoreTeam1" > "scoreTeam2"));

        -- Calculate wins2on1 and losses2on1 for 2on1 on the end date
        SELECT COUNT(*) INTO win2on1Count
        FROM kopecht.matches
        WHERE DATE(created_at) = v_end_date
        AND gamemode = '2on1'
        AND status = 'ended'
        AND (((player1 = currentPlayer.id OR player3 = currentPlayer.id) AND "scoreTeam1" > "scoreTeam2") OR
             ((player2 = currentPlayer.id OR player4 = currentPlayer.id) AND "scoreTeam1" < "scoreTeam2"));

        SELECT COUNT(*) INTO loss2on1Count
        FROM kopecht.matches
        WHERE DATE(created_at) = v_end_date
        AND gamemode = '2on1'
        AND status = 'ended'
        AND (((player1 = currentPlayer.id OR player3 = currentPlayer.id) AND "scoreTeam1" < "scoreTeam2") OR
             ((player2 = currentPlayer.id OR player4 = currentPlayer.id) AND "scoreTeam1" > "scoreTeam2"));

        -- Calculate total play time for 1on1 on the end date
        SELECT SUM(EXTRACT(EPOCH FROM (end_time - start_time))) INTO totalDuration
        FROM kopecht.matches
        WHERE DATE(created_at) = v_end_date
        AND gamemode = '1on1'
        AND status = 'ended'
        AND (player1 = currentPlayer.id OR player2 = currentPlayer.id);

        -- Calculate total play time for 2on2 on the end date
        SELECT SUM(EXTRACT(EPOCH FROM (end_time - start_time))) INTO totalDuration2on2
        FROM kopecht.matches
        WHERE DATE(created_at) = v_end_date
        AND gamemode = '2on2'
        AND status = 'ended'
        AND (player1 = currentPlayer.id OR player2 = currentPlayer.id OR player3 = currentPlayer.id OR player4 = currentPlayer.id);

        -- Calculate total play time for 2on1 on the end date
        SELECT SUM(EXTRACT(EPOCH FROM (end_time - start_time))) INTO totalDuration2on1
        FROM kopecht.matches
        WHERE DATE(created_at) = v_end_date
        AND gamemode = '2on1'
        AND status = 'ended'
        AND (player1 = currentPlayer.id OR player2 = currentPlayer.id OR player3 = currentPlayer.id OR player4 = currentPlayer.id);

        -- Insert the calculated values into player_history with season_id
        INSERT INTO kopecht.player_history (
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
$$ LANGUAGE plpgsql;
