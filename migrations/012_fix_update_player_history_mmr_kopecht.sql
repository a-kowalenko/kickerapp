-- Migration: Fix update_player_history to get MMR from season_rankings (kopecht schema)
-- The mmr and mmr2on2 values should come from season_rankings for the current active season
-- instead of directly from the player table

CREATE OR REPLACE FUNCTION kopecht.update_player_history()
RETURNS void AS $$
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
        SELECT * FROM kopecht.player
    LOOP
        -- Get current season for this player's kicker
        SELECT current_season_id INTO seasonId
        FROM kopecht.kicker
        WHERE id = currentPlayer.kicker_id;

        -- Get MMR values: from season_rankings if season is active, otherwise from player
        IF seasonId IS NOT NULL THEN
            SELECT sr.mmr, sr.mmr2on2
            INTO playerMmr, playerMmr2on2
            FROM kopecht.season_rankings sr
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
        FROM kopecht.matches
        WHERE DATE(created_at) = CURRENT_DATE
        AND gamemode = '1on1'
        AND ((player1 = currentPlayer.id AND "scoreTeam1" > "scoreTeam2") OR
             (player2 = currentPlayer.id AND "scoreTeam1" < "scoreTeam2"));

        SELECT COUNT(*) INTO lossCount
        FROM kopecht.matches
        WHERE DATE(created_at) = CURRENT_DATE
        AND gamemode = '1on1'
        AND ((player1 = currentPlayer.id AND "scoreTeam1" < "scoreTeam2") OR
             (player2 = currentPlayer.id AND "scoreTeam1" > "scoreTeam2"));

        -- Calculate wins2on2 and losses2on2 for 2on2 on the current day
        SELECT COUNT(*) INTO win2on2Count
        FROM kopecht.matches
        WHERE DATE(created_at) = CURRENT_DATE
        AND gamemode = '2on2'
        AND ((player1 = currentPlayer.id AND "scoreTeam1" > "scoreTeam2") OR
             (player2 = currentPlayer.id AND "scoreTeam1" < "scoreTeam2"));

        SELECT COUNT(*) INTO loss2on2Count
        FROM kopecht.matches
        WHERE DATE(created_at) = CURRENT_DATE
        AND gamemode = '2on2'
        AND ((player1 = currentPlayer.id AND "scoreTeam1" < "scoreTeam2") OR
             (player2 = currentPlayer.id AND "scoreTeam1" > "scoreTeam2"));

        -- Calculate wins2on1 and losses2on1 for 2on1 on the current day
        SELECT COUNT(*) INTO win2on1Count
        FROM kopecht.matches
        WHERE DATE(created_at) = CURRENT_DATE
        AND gamemode = '2on1'
        AND ((player1 = currentPlayer.id AND "scoreTeam1" > "scoreTeam2") OR
             (player2 = currentPlayer.id AND "scoreTeam1" < "scoreTeam2"));

        SELECT COUNT(*) INTO loss2on1Count
        FROM kopecht.matches
        WHERE DATE(created_at) = CURRENT_DATE
        AND gamemode = '2on1'
        AND ((player1 = currentPlayer.id AND "scoreTeam1" < "scoreTeam2") OR
             (player2 = currentPlayer.id AND "scoreTeam1" > "scoreTeam2"));

        -- Calculate total play time for 1on1, 2on2, 2on1 on the current day
        SELECT SUM(EXTRACT(EPOCH FROM (end_time - start_time))) INTO totalDuration
        FROM kopecht.matches
        WHERE DATE(created_at) = CURRENT_DATE
        AND gamemode = '1on1'
        AND (player1 = currentPlayer.id OR player2 = currentPlayer.id);

        SELECT SUM(EXTRACT(EPOCH FROM (end_time - start_time))) INTO totalDuration2on2
        FROM kopecht.matches
        WHERE DATE(created_at) = CURRENT_DATE
        AND gamemode = '2on2'
        AND (player1 = currentPlayer.id OR player2 = currentPlayer.id OR player3 = currentPlayer.id OR player4 = currentPlayer.id);

        SELECT SUM(EXTRACT(EPOCH FROM (end_time - start_time))) INTO totalDuration2on1
        FROM kopecht.matches
        WHERE DATE(created_at) = CURRENT_DATE
        AND gamemode = '2on1'
        AND (player1 = currentPlayer.id OR player2 = currentPlayer.id OR player3 = currentPlayer.id OR player4 = currentPlayer.id);

        -- Insert the calculated values into player_history with season_id
        INSERT INTO kopecht.player_history (
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
$$ LANGUAGE plpgsql;
