import { KICKER, SEASON } from "../utils/constants";
import supabase from "./supabase";

export async function getCurrentSeason(kicker) {
    const { data, error } = await supabase
        .from(SEASON)
        .select("*")
        .eq("kicker_id", kicker)
        .neq("status", "ended");

    if (error) {
        throw new Error(error.message);
    }

    if (data.length > 1) {
        throw new Error("Multiple active seasons detected");
    }

    if (data.length === 0) {
        return null;
    }

    return data[0];
}

export async function updateSeasonConfig({ frequency, season_mode, kicker }) {
    const { data: kickerData, error: errorSeasonConfig } = await supabase
        .from(KICKER)
        .select("season_config")
        .eq("id", kicker)
        .single();
    if (errorSeasonConfig) {
        throw new Error(errorSeasonConfig.message);
    }

    const updatedConfig = { ...kickerData.season_config };

    if (frequency !== undefined) {
        updatedConfig.frequency = frequency;
    }
    if (season_mode !== undefined) {
        updatedConfig.season_mode = season_mode;
    }

    const { data, error } = await supabase
        .from(KICKER)
        .update({ season_config: updatedConfig })
        .eq("id", kicker);

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

export async function updateSeason(season) {
    console.log("updateSeason called!", season);
    const { data, error } = await supabase
        .from(SEASON)
        .update(season)
        .eq("id", season.id);

    if (error) {
        throw new Error(error.message);
    }

    return data;
}
