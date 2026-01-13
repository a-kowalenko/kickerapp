-- Migration 054: Create fatality notification trigger (kopecht schema)
-- Sends push notifications to all kicker players (except match participants) when a match ends 0-10

SET search_path TO kopecht;

-- 1. Create trigger function for fatality notifications
CREATE OR REPLACE FUNCTION kopecht.trigger_create_fatality_notifications()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_player_record RECORD;
    v_loser_team INT;
    v_loser1_id BIGINT;
    v_loser2_id BIGINT;
    v_loser1_name TEXT;
    v_loser2_name TEXT;
    v_content_preview TEXT;
    v_winner_score INT;
    v_loser_score INT;
BEGIN
    -- Only process when match just ended (status changed to 'ended')
    IF NEW.status != 'ended' OR OLD.status = 'ended' THEN
        RETURN NEW;
    END IF;
    
    -- Check for fatality (10-0 or 0-10)
    IF NOT ((NEW."scoreTeam1" = 10 AND NEW."scoreTeam2" = 0) OR 
            (NEW."scoreTeam1" = 0 AND NEW."scoreTeam2" = 10)) THEN
        RETURN NEW;
    END IF;
    
    -- Determine losing team and scores
    IF NEW."scoreTeam1" = 0 THEN
        v_loser_team := 1;
        v_loser1_id := NEW.player1;
        v_loser2_id := NEW.player3;  -- NULL for 1v1
        v_winner_score := NEW."scoreTeam2";
        v_loser_score := NEW."scoreTeam1";
    ELSE
        v_loser_team := 2;
        v_loser1_id := NEW.player2;
        v_loser2_id := NEW.player4;  -- NULL for 1v1
        v_winner_score := NEW."scoreTeam1";
        v_loser_score := NEW."scoreTeam2";
    END IF;
    
    -- Get loser player names
    SELECT name INTO v_loser1_name
    FROM kopecht.player
    WHERE id = v_loser1_id;
    
    IF v_loser2_id IS NOT NULL THEN
        SELECT name INTO v_loser2_name
        FROM kopecht.player
        WHERE id = v_loser2_id;
    END IF;
    
    -- Build content preview: "X got destroyed 0-10" or "X and Y got destroyed 0-10"
    IF v_loser2_id IS NOT NULL AND v_loser2_name IS NOT NULL THEN
        v_content_preview := v_loser1_name || ' and ' || v_loser2_name || ' got destroyed ' || v_loser_score || '-' || v_winner_score;
    ELSE
        v_content_preview := v_loser1_name || ' got destroyed ' || v_loser_score || '-' || v_winner_score;
    END IF;
    
    -- Insert notification for ALL players in kicker EXCEPT match participants
    -- who have notify_fatalities enabled on at least one subscription
    FOR v_player_record IN 
        SELECT DISTINCT pl.id, pl.user_id 
        FROM kopecht.player pl 
        INNER JOIN kopecht.push_subscriptions ps ON ps.user_id = pl.user_id
        WHERE pl.kicker_id = NEW.kicker_id 
          AND pl.user_id IS NOT NULL
          AND ps.notify_fatalities = TRUE
          AND ps.enabled = TRUE
          -- Exclude all match participants (both teams)
          AND pl.id NOT IN (
              NEW.player1, 
              NEW.player2, 
              COALESCE(NEW.player3, -1), 
              COALESCE(NEW.player4, -1)
          )
    LOOP
        INSERT INTO kopecht.mention_notifications (
            user_id, type, source_id, match_id, kicker_id, 
            sender_player_id, content_preview, is_read, created_at
        )
        VALUES (
            v_player_record.user_id, 
            'fatality', 
            NEW.id, 
            NEW.id, 
            NEW.kicker_id,
            v_loser1_id,  -- Use first loser as sender for reference
            v_content_preview, 
            FALSE, 
            NOW()
        )
        ON CONFLICT DO NOTHING;
    END LOOP;
    
    RETURN NEW;
END;
$$;

-- 2. Create trigger for fatality notifications on matches table
DROP TRIGGER IF EXISTS trigger_fatality_notification ON kopecht.matches;
CREATE TRIGGER trigger_fatality_notification
    AFTER UPDATE ON kopecht.matches
    FOR EACH ROW
    EXECUTE FUNCTION kopecht.trigger_create_fatality_notifications();
