-- Migration: Fix update_player_history function for kopecht schema
-- This migration fixes a bug where player3 and player4 were not counted for wins/losses in 2on2 and 2on1 gamemodes
-- The original function only checked player1 and player2 positions, ignoring teammates

SET search_path TO kopecht;

-- Update the update_player_history function to fix player3/player4 bug
CREATE OR REPLACE FUNCTION kopecht.update_player_history()
RETURNS void AS $$
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
        SELECT * FROM kopecht.player
    LOOP
        -- Get current season for this player's kicker
        SELECT current_season_id INTO seasonId
        FROM kopecht.kicker
        WHERE id = currentPlayer.kicker_id;

        -- Calculate wins and losses for 1on1 on the current day
        SELECT COUNT(*) INTO winCount
        FROM kopecht.matches
        WHERE DATE(created_at) = CURRENT_DATE
        AND gamemode = '1on1'
        AND status = 'ended'
        AND ((player1 = currentPlayer.id AND "scoreTeam1" > "scoreTeam2") OR
             (player2 = currentPlayer.id AND "scoreTeam1" < "scoreTeam2"));

        SELECT COUNT(*) INTO lossCount
        FROM kopecht.matches
        WHERE DATE(created_at) = CURRENT_DATE
        AND gamemode = '1on1'
        AND status = 'ended'
        AND ((player1 = currentPlayer.id AND "scoreTeam1" < "scoreTeam2") OR
             (player2 = currentPlayer.id AND "scoreTeam1" > "scoreTeam2"));

        -- Calculate wins2on2 and losses2on2 for 2on2 on the current day
        -- FIXED: Include player3 and player4 in team membership check
        -- Team 1 = player1 + player3, Team 2 = player2 + player4
        SELECT COUNT(*) INTO win2on2Count
        FROM kopecht.matches
        WHERE DATE(created_at) = CURRENT_DATE
        AND gamemode = '2on2'
        AND status = 'ended'
        AND (((player1 = currentPlayer.id OR player3 = currentPlayer.id) AND "scoreTeam1" > "scoreTeam2") OR
             ((player2 = currentPlayer.id OR player4 = currentPlayer.id) AND "scoreTeam1" < "scoreTeam2"));

        SELECT COUNT(*) INTO loss2on2Count
        FROM kopecht.matches
        WHERE DATE(created_at) = CURRENT_DATE
        AND gamemode = '2on2'
        AND status = 'ended'
        AND (((player1 = currentPlayer.id OR player3 = currentPlayer.id) AND "scoreTeam1" < "scoreTeam2") OR
             ((player2 = currentPlayer.id OR player4 = currentPlayer.id) AND "scoreTeam1" > "scoreTeam2"));

        -- Calculate wins2on1 and losses2on1 for 2on1 on the current day
        -- FIXED: Include player3 and player4 in team membership check
        SELECT COUNT(*) INTO win2on1Count
        FROM kopecht.matches
        WHERE DATE(created_at) = CURRENT_DATE
        AND gamemode = '2on1'
        AND status = 'ended'
        AND (((player1 = currentPlayer.id OR player3 = currentPlayer.id) AND "scoreTeam1" > "scoreTeam2") OR
             ((player2 = currentPlayer.id OR player4 = currentPlayer.id) AND "scoreTeam1" < "scoreTeam2"));

        SELECT COUNT(*) INTO loss2on1Count
        FROM kopecht.matches
        WHERE DATE(created_at) = CURRENT_DATE
        AND gamemode = '2on1'
        AND status = 'ended'
        AND (((player1 = currentPlayer.id OR player3 = currentPlayer.id) AND "scoreTeam1" < "scoreTeam2") OR
             ((player2 = currentPlayer.id OR player4 = currentPlayer.id) AND "scoreTeam1" > "scoreTeam2"));

        -- Calculate total play time for 1on1 on the current day
        SELECT SUM(EXTRACT(EPOCH FROM (end_time - start_time))) INTO totalDuration
        FROM kopecht.matches
        WHERE DATE(created_at) = CURRENT_DATE
        AND gamemode = '1on1'
        AND status = 'ended'
        AND (player1 = currentPlayer.id OR player2 = currentPlayer.id);

        -- Calculate total play time for 2on2 on the current day
        SELECT SUM(EXTRACT(EPOCH FROM (end_time - start_time))) INTO totalDuration2on2
        FROM kopecht.matches
        WHERE DATE(created_at) = CURRENT_DATE
        AND gamemode = '2on2'
        AND status = 'ended'
        AND (player1 = currentPlayer.id OR player2 = currentPlayer.id OR player3 = currentPlayer.id OR player4 = currentPlayer.id);

        -- Calculate total play time for 2on1 on the current day
        SELECT SUM(EXTRACT(EPOCH FROM (end_time - start_time))) INTO totalDuration2on1
        FROM kopecht.matches
        WHERE DATE(created_at) = CURRENT_DATE
        AND gamemode = '2on1'
        AND status = 'ended'
        AND (player1 = currentPlayer.id OR player2 = currentPlayer.id OR player3 = currentPlayer.id OR player4 = currentPlayer.id);

        -- Insert the calculated values into player_history with season_id
        INSERT INTO kopecht.player_history (
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
$$ LANGUAGE plpgsql;
