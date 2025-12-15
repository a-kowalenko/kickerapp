-- Rollback: 002_add_season_to_player_history_sql
-- This script reverts all changes made by adding season_id to player_history for public schema (PRODUCTION)
-- Run this BEFORE rolling back 001_create_seasons_sql

SET search_path TO public;

-- 1. Restore original update_player_history function (without season_id)
CREATE OR REPLACE FUNCTION update_player_history()
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
    -- Iteriere Ã¼ber alle Spieler in der player-Tabelle
    FOR currentPlayer IN
        SELECT * FROM player
    LOOP
        -- Berechne wins und losses fÃ¼r 1on1 am aktuellen Tag
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

        -- Berechne wins2on2 und losses2on2 fÃ¼r 2on2 am aktuellen Tag
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

        -- Berechne wins2on1 und losses2on1 fÃ¼r 2on1 am aktuellen Tag
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

        -- Berechne die gesamte Spielzeit fÃ¼r 1on1, 2on2, 2on1 am aktuellen Tag
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

        -- FÃ¼gen Sie die berechneten Werte in player_history ein
        INSERT INTO player_history (player_name, player_id, user_id, mmr, mmr2on2, wins, losses, wins2on2, losses2on2, wins2on1, losses2on1, duration, duration2on2, duration2on1, kicker_id)
        VALUES (currentPlayer.name, currentPlayer.id, currentPlayer.user_id, currentPlayer.mmr, currentPlayer.mmr2on2, winCount, lossCount, win2on2Count, loss2on2Count, win2on1Count, loss2on1Count, COALESCE(totalDuration, 0), COALESCE(totalDuration2on2, 0), COALESCE(totalDuration2on1, 0), currentPlayer.kicker_id);
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 2. Drop the index on season_id
DROP INDEX IF EXISTS idx_player_history_season_id;

-- 3. Remove season_id column from player_history
ALTER TABLE player_history DROP COLUMN IF EXISTS season_id;
