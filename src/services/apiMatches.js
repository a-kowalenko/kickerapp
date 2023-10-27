import supabase from "./supabase";

export async function getPlayers() {
    const { data, error } = await supabase.from("player").select("*");

    if (error) {
        console.error(error);
        throw new Error("Players could not be loaded");
    }

    return data;
}

export async function createMatch(players) {
    const { data: activeMatches, activeMatchesError } = await supabase
        .from("matches")
        .select("*")
        .eq("status", "active");

    if (activeMatchesError) {
        console.error(activeMatchesError);
        throw new Error("There was an error while checking for active matches");
    }

    console.log(activeMatches);

    if (activeMatches.length > 0) {
        throw new Error("There already is an active match");
    }

    const { data, error } = await supabase
        .from("matches")
        .insert([
            {
                player1: players.player1.id,
                player2: players.player2.id,
                player3: players.player3?.id,
                player4: players.player4?.id,
            },
        ])
        .select()
        .single();

    if (error) {
        console.error(error);
        throw new Error("There was an error creating the match");
    }

    return data;
}
