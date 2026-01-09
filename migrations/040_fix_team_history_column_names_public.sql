-- Migration: Fix team history trigger column names (public schema)
-- The original trigger used snake_case column names but matches table uses camelCase

SET search_path TO public;

-- Fix the trigger function to use correct column names
CREATE OR REPLACE FUNCTION public.record_team_history()
RETURNS TRIGGER AS $$
BEGIN
    -- Only process if this is a team match (has team1_id and team2_id)
    IF NEW.team1_id IS NOT NULL AND NEW.team2_id IS NOT NULL THEN
        -- Record history for team 1
        INSERT INTO public.team_history (
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
        FROM public.teams t
        WHERE t.id = NEW.team1_id;

        -- Record history for team 2
        INSERT INTO public.team_history (
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
        FROM public.teams t
        WHERE t.id = NEW.team2_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
