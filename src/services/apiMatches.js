import supabase from "./supabase";

export async function getPlayers() {
    const { data, error } = await supabase.from("player").select("*");

    if (error) {
        console.error(error);
        throw new Error("Players could not be loaded");
    }

    return data;
}

export async function getPlayerById(id) {
    const { data, error } = await supabase
        .from("player")
        .select("*")
        .eq("id", id);

    if (error) {
        console.error(error);
        throw new Error("Player could not be loaded");
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

export async function getMatch(matchId) {
    console.log("getMatch called", matchId);
    const { data, error } = await supabase
        .from("matches")
        .select(
            `
            *,
            player1: player!matches_player1_fkey (id, name),
            player2: player!matches_player2_fkey (id, name),
            player3: player!matches_player3_fkey (id, name),
            player4: player!matches_player4_fkey (id, name)
        `
        )
        .eq("id", matchId);

    if (error) {
        console.error(error);
        throw new Error("There was an error selecting the match");
    }

    return data;
}
