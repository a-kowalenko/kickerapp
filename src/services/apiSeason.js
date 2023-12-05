import { addDays, addMonths, format } from "date-fns";
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

export async function getSeasonConfig(kicker) {
    const { data, error } = await supabase
        .from(KICKER)
        .select("season_config")
        .eq("id", kicker)
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

export async function updateSeasonConfig({
    frequency,
    season_mode,
    auto_renew,
    kicker,
}) {
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
        if (season_mode === false) {
            await deletePendingSeason(kicker);
        }
        updatedConfig.season_mode = season_mode;
    }
    if (auto_renew !== undefined) {
        updatedConfig.auto_renew = auto_renew;
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

export async function createNewSeason(seasonData, kicker) {
    const seasonConfig = await getSeasonConfig(kicker);
    const currentSeason = await getCurrentSeason(kicker);
    if (currentSeason) {
        throw new Error(
            "Cannot create a new season while another one is active"
        );
    }

    console.log("seasonData", seasonData);
    console.log("seasonConfig", seasonConfig);
    const start_date = seasonData.start_date;

    // Calculate end_date

    const { frequency } = seasonConfig;
    let end_date;
    switch (frequency) {
        case "monthly":
            end_date = addMonths(start_date, 1);
            break;
        case "quarterly":
            end_date = addMonths(start_date, 3);
            break;
        case "halfYearly":
            end_date = addMonths(start_date, 6);
            break;
        case "yearly":
            end_date = addMonths(start_date, 12);
            break;
        default:
            end_date = addMonths(start_date, 3);
            break;
    }
    end_date = addDays(end_date, -1);

    // Calculate status
    let status;
    if (format(start_date, "dd.MM.yyyy") === format(new Date(), "dd.MM.yyyy")) {
        status = "active";
    } else {
        status = "pending";
    }

    const finalSeasonData = {
        ...seasonData,
        status,
        end_date,
        kicker_id: kicker,
    };

    console.log("finalSeasonData", finalSeasonData);

    const { data, error } = await supabase
        .from(SEASON)
        .insert(finalSeasonData)
        .select("*")
        .single();

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

export async function deletePendingSeason(kicker) {
    const result = await supabase
        .from(SEASON)
        .delete()
        .eq("kicker_id", kicker)
        .eq("status", "pending");

    if (result.error) {
        throw new Error(result.error.message);
    }

    return result;
}
