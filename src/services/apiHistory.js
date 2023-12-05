import { PLAYER_HISTORY } from "../utils/constants";
import supabase from "./supabase";

export async function getPlayerHistory(kicker, filter) {
    let query = supabase
        .from(PLAYER_HISTORY)
        .select("*")
        .eq("kicker_id", kicker);

    if (filter?.month) {
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
