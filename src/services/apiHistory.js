import supabase from "./supabase";

export async function getPlayerHistory(kicker, filter) {
    let query = supabase
        .from("player_history")
        .select("*")
        .eq("kicker_id", kicker);

    // Season filter
    if (filter?.seasonId !== undefined) {
        if (filter.seasonId === null) {
            // Off-season: records without a season
            query = query.is("season_id", null);
        } else {
            query = query.eq("season_id", filter.seasonId);
        }
    }
    // If seasonValue is SEASON_ALL_TIME or not provided, no season filter is applied

    if (filter?.month !== undefined && filter.month !== null) {
        const start = new Date(
            filter.year || new Date().getFullYear(),
            filter.month,
            1
        );
        const end = new Date(
            filter.year || new Date().getFullYear(),
            filter.month + 1,
            1
        );

        query = query
            .filter("created_at", "gte", start.toISOString())
            .filter("created_at", "lt", end.toISOString());
    }

    query = query
        .order("created_at", {
            ascending: true,
        })
        .order("player_id", {
            ascending: true,
        });

    const { data, error } = await query;

    if (error) {
        throw new Error(error.message);
    }

    return data;
}
