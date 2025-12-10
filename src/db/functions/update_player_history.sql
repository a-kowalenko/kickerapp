-- Function: public.update_player_history()
-- Description: Daily job to snapshot player statistics into player_history table
-- Type: Regular Function
-- Security: Invoker
-- Usage: Called by scheduled job (cron) daily

CREATE OR REPLACE FUNCTION public.update_player_history()
RETURNS void AS $$
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
$$ LANGUAGE plpgsql;
