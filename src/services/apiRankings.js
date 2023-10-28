import supabase from "./supabase";

export async function getRankings() {
    const { data, error, count } = await supabase
        .from("player")
        .select("*")
        .order("mmr", { ascending: false });

    if (error) {
        throw new Error("Error while selecting the rankings");
    }

    const rankedData = data.map((player, index) => ({
        ...player,
        rank: index + 1,
    }));

    return { data: rankedData, error, count };
}
