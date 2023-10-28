import { calculateMmrChange } from "../utils/helpers";
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
    const { data, error } = await supabase
        .from("matches")
        .select(
            `
            *,
            player1: player!matches_player1_fkey (id, name, mmr, wins, losses, avatar),
            player2: player!matches_player2_fkey (id, name, mmr, wins, losses, avatar),
            player3: player!matches_player3_fkey (id, name, mmr, wins, losses, avatar),
            player4: player!matches_player4_fkey (id, name, mmr, wins, losses, avatar)
        `
        )
        .eq("id", matchId)
        .single();

    if (error) {
        console.error(error);
        throw new Error("There was an error selecting the match");
    }

    return data;
}

export async function getMatches() {
    const { data, error, count } = await supabase.from("matches").select(
        `
        *,
        player1: player!matches_player1_fkey (id, name, mmr, wins, losses, avatar),
        player2: player!matches_player2_fkey (id, name, mmr, wins, losses, avatar),
        player3: player!matches_player3_fkey (id, name, mmr, wins, losses, avatar),
        player4: player!matches_player4_fkey (id, name, mmr, wins, losses, avatar)
    `,
        { count: "exact" }
    );

    if (error) {
        console.error(error);
        throw new Error("There was an error selecting the matches");
    }

    return { data, error, count };
}

export async function getActiveMatch() {
    const { data, error } = await supabase
        .from("matches")
        .select("*")
        .eq("status", "active");

    if (error) {
        console.error(error);
        throw new Error("There was an error while checking for active matches");
    }

    return { data, error };
}

export async function endMatch({ id, score1, score2 }) {
    const match = await getMatch(id);

    if (match.status !== "active") {
        throw new Error("Match has already ended");
    }

    if (!match.player3 && !match.player4) {
        const { player1, player2 } = match;
        let resultForPlayer1;
        const hasWonPlayer1 = score1 > score2;
        if (hasWonPlayer1) {
            resultForPlayer1 = 1;
        } else {
            resultForPlayer1 = 0;
        }

        const mmrChangeForPlayer1 = calculateMmrChange(
            player1.mmr,
            player2.mmr,
            resultForPlayer1
        );
        const mmrChangeForPlayer2 = -mmrChangeForPlayer1;

        const newPlayer1Wins = hasWonPlayer1 ? player1.wins + 1 : player1.wins;
        const newPlayer1Losses = hasWonPlayer1
            ? player1.losses
            : player1.losses + 1;
        const newPlayer2Wins = hasWonPlayer1 ? player2.wins : player2.wins + 1;
        const newPlayer2Losses = hasWonPlayer1
            ? player2.losses + 1
            : player2.losses;

        await supabase
            .from("player")
            .update({
                wins: newPlayer1Wins,
                losses: newPlayer1Losses,
                mmr: player1.mmr + mmrChangeForPlayer1,
            })
            .eq("id", player1.id);
        await supabase
            .from("player")
            .update({
                wins: newPlayer2Wins,
                losses: newPlayer2Losses,
                mmr: player2.mmr + mmrChangeForPlayer2,
            })
            .eq("id", player2.id);
    }

    const { data, error } = await supabase
        .from("matches")
        .update({
            status: "ended",
            scoreTeam1: score1,
            scoreTeam2: score2,
            end_time: new Date(),
        })
        .eq("id", id)
        .select()
        .single();

    if (error) {
        console.error(error);
        throw new Error("There was an error ending the match");
    }

    return data;
}

export async function getDisgraces() {
    const { data, error, count } = await supabase
        .from("matches")
        .select(
            `
        *,
        player1: player!matches_player1_fkey (id, name, mmr, wins, losses),
        player2: player!matches_player2_fkey (id, name, mmr, wins, losses),
        player3: player!matches_player3_fkey (id, name, mmr, wins, losses),
        player4: player!matches_player4_fkey (id, name, mmr, wins, losses)
    `
        )
        .or("scoreTeam1.eq.0, scoreTeam2.eq.0")
        .not("scoreTeam1", "eq", 0, "scoreTeam2", "eq", 0);

    if (error) {
        throw new Error("Error while selecting the disgraces");
    }

    return { data, error, count };
}
