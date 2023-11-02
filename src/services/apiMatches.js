import { MATCHES, PAGE_SIZE, PLAYER } from "../utils/constants";
import { calculateMmrChange } from "../utils/helpers";
import { getPlayerByName } from "./apiPlayer";
import supabase from "./supabase";

export async function getPlayers() {
    const { data, error } = await supabase.from(PLAYER).select("*");

    if (error) {
        console.error(error);
        throw new Error("Players could not be loaded");
    }

    return data;
}

export async function getPlayerById(id) {
    const { data, error } = await supabase
        .from(PLAYER)
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
        .from(MATCHES)
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
        .from(MATCHES)
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
        .from(MATCHES)
        .select(
            `
            *,
            player1: ${PLAYER}!${MATCHES}_player1_fkey (*),
            player2: ${PLAYER}!${MATCHES}_player2_fkey (*),
            player3: ${PLAYER}!${MATCHES}_player3_fkey (*),
            player4: ${PLAYER}!${MATCHES}_player4_fkey (*)
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

export async function getMatches({ currentPage, filter }) {
    let query = supabase.from(MATCHES).select(
        `
        *,
        player1: ${PLAYER}!${MATCHES}_player1_fkey (*),
        player2: ${PLAYER}!${MATCHES}_player2_fkey (*),
        player3: ${PLAYER}!${MATCHES}_player3_fkey (*),
        player4: ${PLAYER}!${MATCHES}_player4_fkey (*)
    `,
        { count: "exact" }
    );

    if (filter?.name) {
        const player = await getPlayerByName(filter.name);
        const { id } = player;
        query = query.or(
            `player1.eq.${id},player2.eq.${id},player3.eq.${id},player4.eq.${id}`
        );
    }

    if (filter?.today) {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const end = new Date();
        end.setHours(23, 59, 59, 999);

        query = query
            .filter("created_at", "gte", start.toISOString())
            .filter("created_at", "lt", end.toISOString());
    }

    query = query.order("created_at", { ascending: false });

    if (currentPage) {
        const from = (currentPage - 1) * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;
        query = query.range(from, to);
    }

    const { data, error, count } = await query;

    if (error) {
        console.error(error);
        throw new Error("There was an error selecting the matches");
    }

    return { data, count };
}

export async function getActiveMatch() {
    const { data, error } = await supabase
        .from(MATCHES)
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

    const { player1, player2, player3, player4 } = match;
    const gameMode = !player3 && !player4 ? "1on1" : "2on2";
    const team1Wins = score1 > score2;

    let mmrChangeForTeam1;
    let mmrChangeForTeam2;

    if (gameMode === "1on1") {
        mmrChangeForTeam1 = calculateMmrChange(
            player1.mmr,
            player2.mmr,
            team1Wins ? 1 : 0
        );
        mmrChangeForTeam2 = -mmrChangeForTeam1;

        const newPlayer1Wins = team1Wins ? player1.wins + 1 : player1.wins;
        const newPlayer1Losses = team1Wins
            ? player1.losses
            : player1.losses + 1;
        const newPlayer2Wins = team1Wins ? player2.wins : player2.wins + 1;
        const newPlayer2Losses = team1Wins
            ? player2.losses + 1
            : player2.losses;

        await supabase
            .from(PLAYER)
            .update({
                wins: newPlayer1Wins,
                losses: newPlayer1Losses,
                mmr: player1.mmr + mmrChangeForTeam1,
            })
            .eq("id", player1.id);
        await supabase
            .from(PLAYER)
            .update({
                wins: newPlayer2Wins,
                losses: newPlayer2Losses,
                mmr: player2.mmr + mmrChangeForTeam2,
            })
            .eq("id", player2.id);
    }

    // 2on2, 1on2, 2on1
    if (gameMode === "2on2") {
        // if it's a 1on2, check which team is the single player and assign his own mmr2on2
        mmrChangeForTeam1 = calculateMmrChange(
            player3
                ? Math.round((player1.mmr2on2 + player3.mmr2on2) / 2)
                : player1.mmr2on2,
            player4
                ? Math.round((player2.mmr2on2 + player4.mmr2on2) / 2)
                : player2.mmr2on2,
            team1Wins ? 1 : 0
        );
        mmrChangeForTeam2 = -mmrChangeForTeam1;

        const newPlayer1Wins = team1Wins
            ? player1.wins2on2 + 1
            : player1.wins2on2;
        const newPlayer3Wins = team1Wins
            ? player3?.wins2on2 + 1
            : player3?.wins2on2;
        const newPlayer1Losses = team1Wins
            ? player1.losses2on2
            : player1.losses2on2 + 1;
        const newPlayer3Losses = team1Wins
            ? player3?.losses2on2
            : player3?.losses2on2 + 1;
        const newPlayer2Wins = team1Wins
            ? player2.wins2on2
            : player2.wins2on2 + 1;
        const newPlayer4Wins = team1Wins
            ? player4?.wins2on2
            : player4?.wins2on2 + 1;
        const newPlayer2Losses = team1Wins
            ? player2.losses2on2 + 1
            : player2.losses2on2;
        const newPlayer4Losses = team1Wins
            ? player4?.losses2on2 + 1
            : player4?.losses2on2;

        await supabase
            .from(PLAYER)
            .update({
                wins2on2: newPlayer1Wins,
                losses2on2: newPlayer1Losses,
                mmr2on2: player1.mmr2on2 + mmrChangeForTeam1,
            })
            .eq("id", player1.id);
        await supabase
            .from(PLAYER)
            .update({
                wins2on2: newPlayer2Wins,
                losses2on2: newPlayer2Losses,
                mmr2on2: player2.mmr2on2 + mmrChangeForTeam2,
            })
            .eq("id", player2.id);
        if (player3) {
            await supabase
                .from(PLAYER)
                .update({
                    wins2on2: newPlayer3Wins,
                    losses2on2: newPlayer3Losses,
                    mmr2on2: player3.mmr2on2 + mmrChangeForTeam1,
                })
                .eq("id", player3.id);
        }
        if (player4) {
            await supabase
                .from(PLAYER)
                .update({
                    wins2on2: newPlayer4Wins,
                    losses2on2: newPlayer4Losses,
                    mmr2on2: player4.mmr2on2 + mmrChangeForTeam2,
                })
                .eq("id", player4.id);
        }
    }

    const { data, error } = await supabase
        .from(MATCHES)
        .update({
            status: "ended",
            scoreTeam1: score1,
            scoreTeam2: score2,
            mmrChangeTeam1: mmrChangeForTeam1,
            mmrChangeTeam2: mmrChangeForTeam2,
            mmrPlayer1: gameMode === "1on1" ? player1.mmr : player1.mmr2on2,
            mmrPlayer2: gameMode === "1on1" ? player2.mmr : player2.mmr2on2,
            mmrPlayer3: gameMode === "2on2" ? player3?.mmr2on2 : null,
            mmrPlayer4: gameMode === "2on2" ? player4?.mmr2on2 : null,
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

export async function getDisgraces(filter = {}) {
    let query = supabase
        .from(MATCHES)
        .select(
            `
        *,
        player1: ${PLAYER}!${MATCHES}_player1_fkey (*),
        player2: ${PLAYER}!${MATCHES}_player2_fkey (*),
        player3: ${PLAYER}!${MATCHES}_player3_fkey (*),
        player4: ${PLAYER}!${MATCHES}_player4_fkey (*)
    `,
            { count: "exact" }
        )
        .or("scoreTeam1.eq.0, scoreTeam2.eq.0");

    if (filter.month) {
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

    const { data, error, count } = await query;

    if (error) {
        throw new Error("Error while selecting the disgraces");
    }

    return { data, error, count };
}
