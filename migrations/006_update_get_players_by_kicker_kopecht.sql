-- Migration: Update get_players_by_kicker to include season-specific MMR from season_rankings (kopecht schema)
-- This migration adds a season_id parameter and returns MMR values from season_rankings

SET search_path TO kopecht;

-- Drop existing function first (to change signature)
DROP FUNCTION IF EXISTS kopecht.get_players_by_kicker(INTEGER);

-- Create a custom type for the return value
DROP TYPE IF EXISTS kopecht.player_with_season_mmr;
CREATE TYPE kopecht.player_with_season_mmr AS (
    id BIGINT,
    created_at TIMESTAMP WITH TIME ZONE,
    name TEXT,
    wins BIGINT,
    losses BIGINT,
    mmr BIGINT,
    avatar TEXT,
    user_id UUID,
    mmr2on2 BIGINT,
    wins2on2 BIGINT,
    losses2on2 BIGINT,
    kicker_id BIGINT
);

-- Update the function to accept season_id and return season-specific MMR
CREATE OR REPLACE FUNCTION kopecht.get_players_by_kicker(kicker_id_param INTEGER, p_season_id BIGINT DEFAULT NULL)
RETURNS SETOF kopecht.player_with_season_mmr AS $$
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
        FROM kopecht.player p
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
        FROM kopecht.player p
        LEFT JOIN kopecht.season_rankings sr ON sr.player_id = p.id AND sr.season_id = p_season_id
        WHERE p.kicker_id = kicker_id_param
        ORDER BY LOWER(p.name);
    END IF;
END;
$$ LANGUAGE plpgsql;
