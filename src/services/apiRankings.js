import { PLAYER } from "../utils/constants";
import supabase from "./supabase";

export async function getRankings({ filter }) {
    let query = supabase
        .from(PLAYER)
        .select("*", { count: "exact" })
        .eq("kicker_id", filter.kicker);

    if (filter) {
        query = query.order(filter.field, { ascending: false });
    }

    const { data, error, count } = await query;

    if (error) {
        throw new Error("Error while selecting the rankings");
    }

    const rankedData = data.map((player, index) => ({
        ...player,
        rank: index + 1,
    }));

    return { data: rankedData, error, count };
}
