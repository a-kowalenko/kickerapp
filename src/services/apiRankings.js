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

export async function getRankByPlayerName(kicker, playerName) {
    let rank1on1;
    let rank2on2;

    const { data, error } = await supabase
        .from(PLAYER)
        .select("*")
        .eq("kicker_id", kicker);

    if (error) {
        throw new Error(error.message);
    }

    const sortedBy1on1MMR = [...data].sort((a, b) => b.mmr - a.mmr);
    const sortedBy2on2MMR = [...data].sort((a, b) => b.mmr2on2 - a.mmr2on2);

    for (let i = 0; i < sortedBy1on1MMR.length; i++) {
        if (sortedBy1on1MMR[i].name === playerName) {
            rank1on1 = i + 1;
        }
    }

    for (let i = 0; i < sortedBy2on2MMR.length; i++) {
        if (sortedBy2on2MMR[i].name === playerName) {
            rank2on2 = i + 1;
        }
    }

    return { rank1on1, rank2on2 };
}
