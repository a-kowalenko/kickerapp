import { addDays, format, parseISO } from "date-fns";
import {
    DISGRACE_FAKTOR,
    GAMEMODE_1ON1,
    GAMEMODE_2ON1,
    GAMEMODE_2ON2,
    GOALS,
    MATCHES,
    OWN_GOAL,
    PAGE_SIZE,
    PLAYER,
    STANDARD_GOAL,
} from "../utils/constants";
import { calculateMmrChange, formatTime } from "../utils/helpers";
import { getPlayerByName } from "./apiPlayer";
import supabase from "./supabase";
import { getGoalStatisticsByPlayer } from "./apiGoals";

export async function getPlayers({ filter }) {
    const { data, error } = await supabase
        .from(PLAYER)
        .select("*")
        .eq("kicker_id", filter.kicker);

    if (error) {
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
        throw new Error("Player could not be loaded");
    }

    return data;
}

export async function createMatch({ players, kicker }) {
    const { data: activeMatches, activeMatchesError } = await supabase
        .from(MATCHES)
        .select("*")
        .eq("status", "active")
        .eq("kicker_id", kicker);

    if (activeMatchesError) {
        throw new Error(
            "There was an error while checking for active matches",
            activeMatchesError.message
        );
    }

    if (activeMatches.length > 0) {
        throw new Error("There already is an active match");
    }

    const { player1, player2, player3, player4 } = players;
    const gameMode =
        !player3 && !player4
            ? GAMEMODE_1ON1
            : player3 && player4
            ? GAMEMODE_2ON2
            : GAMEMODE_2ON1;

    const { data, error } = await supabase
        .from(MATCHES)
        .insert([
            {
                player1: player1.id,
                player2: player2.id,
                player3: player3?.id,
                player4: player4?.id,
                gamemode: gameMode,
                start_time: new Date(),
                kicker_id: kicker,
            },
        ])
        .select()
        .single();

    if (error) {
        throw new Error("There was an error creating the match", error.message);
    }

    return data;
}

export async function getMatch({ matchId, kicker }) {
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
        .eq("kicker_id", kicker)
        .eq("id", matchId)
        .single();

    if (error) {
        throw new Error(
            "There was an error selecting the match",
            error.message
        );
    }

    return data;
}

export async function getMatches({ currentPage, filter }) {
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
        .eq("kicker_id", filter.kicker);

    if (filter?.field) {
        query = query[filter.method || "eq"](filter.field, filter.value);
    }

    if (filter?.name) {
        const player = await getPlayerByName({
            name: filter.name,
            kicker: filter.kicker,
        });
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
            .filter("start_time", "gte", start.toISOString())
            .filter("start_time", "lt", end.toISOString());
    }

    query = query.order("start_time", { ascending: false });

    if (currentPage) {
        const from = (currentPage - 1) * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;
        query = query.range(from, to);
    }

    const { data, error, count } = await query;

    if (error) {
        throw new Error(
            "There was an error selecting the matches",
            error.message
        );
    }

    return { data, count };
}

export async function getActiveMatch({ kicker }) {
    const { data, error } = await supabase
        .from(MATCHES)
        .select("*")
        .eq("status", "active")
        .eq("kicker_id", kicker);

    if (error) {
        throw new Error(
            "There was an error while checking for active matches",
            error.message
        );
    }

    return { data, error };
}

export async function endMatch({ id, score1, score2, kicker }) {
    const match = await getMatch({ matchId: id, kicker });

    if (match.status !== "active") {
        throw new Error("Match has already ended");
    }

    const { player1, player2, player3, player4, scoreTeam1, scoreTeam2 } =
        match;
    const gameMode = !player3 && !player4 ? GAMEMODE_1ON1 : GAMEMODE_2ON2;

    const finalScore1 = score1 ? score1 : scoreTeam1;
    const finalScore2 = score2 ? score2 : scoreTeam2;

    if (finalScore1 === finalScore2) {
        throw new Error(
            "Draws are not allowed.\nKeep playing until someone wins!"
        );
    }

    const team1Wins = finalScore1 > finalScore2;
    const isDisgrace = finalScore1 === 0 || finalScore2 === 0;

    let mmrChangeForTeam1;
    let mmrChangeForTeam2;

    if (gameMode === GAMEMODE_1ON1) {
        mmrChangeForTeam1 = calculateMmrChange(
            player1.mmr,
            player2.mmr,
            team1Wins ? 1 : 0
        );

        if (isDisgrace) {
            mmrChangeForTeam1 = mmrChangeForTeam1 * DISGRACE_FAKTOR;
        }

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
    if (gameMode === GAMEMODE_2ON2) {
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

        if (isDisgrace) {
            mmrChangeForTeam1 = mmrChangeForTeam1 * DISGRACE_FAKTOR;
        }

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
            scoreTeam1: finalScore1,
            scoreTeam2: finalScore2,
            mmrChangeTeam1: mmrChangeForTeam1,
            mmrChangeTeam2: mmrChangeForTeam2,
            mmrPlayer1:
                gameMode === GAMEMODE_1ON1 ? player1.mmr : player1.mmr2on2,
            mmrPlayer2:
                gameMode === GAMEMODE_1ON1 ? player2.mmr : player2.mmr2on2,
            mmrPlayer3: gameMode === GAMEMODE_2ON2 ? player3?.mmr2on2 : null,
            mmrPlayer4: gameMode === GAMEMODE_2ON2 ? player4?.mmr2on2 : null,
            end_time: new Date(),
        })
        .eq("id", id)
        .select()
        .single();

    if (error) {
        throw new Error("There was an error ending the match", error.message);
    }

    return data;
}

export async function getDisgraces({ filter }) {
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
        .eq("kicker_id", filter.kicker)
        .or("scoreTeam1.eq.0, scoreTeam2.eq.0")
        .order("created_at", { ascending: false });

    if (filter?.field) {
        query = query[filter.method || "eq"](filter.field, filter.value);
    }

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
            .filter("start_time", "gte", start.toISOString())
            .filter("start_time", "lt", end.toISOString());
    }

    if (filter.currentPage) {
        const from = (filter.currentPage - 1) * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;
        query = query.range(from, to);
    }

    const { data, error, count } = await query.eq("status", "ended");

    if (error) {
        throw new Error("Error while selecting the disgraces");
    }

    return { data, error, count };
}

export async function getMmrHistory({ filter }) {
    if (!filter.name) {
        throw new Error("A username is needed to get the MMR history");
    }

    const { data, count } = await getMatches({
        filter,
    });

    const player = await getPlayerByName({
        name: filter.name,
        kicker: filter.kicker,
    });

    data.sort((a, b) => b.end_time - a.end_time);

    const latestPerDay = data.reduce((acc, item) => {
        if (!item.end_time) {
            return acc;
        }
        const day = item.end_time.split("T")[0];
        if (!acc[day] || acc[day].end_time < item.end_time) {
            acc[day] = item;
        }
        return acc;
    }, {});

    // Ermitteln des Start- und Enddatums
    const dates = Object.keys(latestPerDay).map((date) => new Date(date));
    const startDate = new Date(Math.min(...dates));
    const endDate = addDays(new Date(), -1);

    // Erstellen einer Liste aller Tage zwischen Start- und Enddatum
    const dateList = [];
    for (
        let dt = new Date(startDate);
        dt <= endDate;
        dt.setDate(dt.getDate() + 1)
    ) {
        dateList.push(new Date(dt));
    }

    let buffer;
    // Füllen der fehlenden Tage auf
    const completeList = dateList.map((date) => {
        const dayStr = date.toISOString().split("T")[0];
        if (latestPerDay[dayStr]) {
            const playerNumber = getPlayersNumberFromMatch(
                filter.name,
                latestPerDay[dayStr]
            );
            const mmrChange =
                playerNumber === 1 || playerNumber === 3
                    ? latestPerDay[dayStr].mmrChangeTeam1
                    : latestPerDay[dayStr].mmrChangeTeam2;

            buffer = {
                date: format(
                    parseISO(latestPerDay[dayStr].start_time),
                    "dd.MM.yyyy"
                ),
                mmr: latestPerDay[dayStr][`mmrPlayer${playerNumber}`],
            };

            if (mmrChange) {
                buffer.mmr += mmrChange;
            }

            return buffer;
        } else {
            // Erstellen eines neuen Objekts mit dem Datum als end_time
            return {
                ...buffer,
                date: format(parseISO(date.toISOString()), "dd.MM.yyyy"),
            };
        }
    });

    const result = completeList.filter((item) => item.mmr !== null);
    result.push({
        date: format(new Date(), "dd.MM.yyyy"),
        mmr: filter.value === GAMEMODE_1ON1 ? player.mmr : player.mmr2on2,
    });

    return { data: result, count };
}

function getPlayersNumberFromMatch(username, match) {
    for (let i = 1; i <= 4; i++) {
        if (match[`player${i}`]?.name === username) {
            return i;
        }
    }

    return null;
}

export async function getOpponentStats({ username, filter }) {
    if (!username) {
        throw new Error("No username was provided");
    }

    const { data: matches } = await getMatches({
        filter: { name: username, ...filter },
    });

    const stats = matches.reduce((acc, cur) => {
        const { isWinner, opponents } = getResultData(username, cur);
        for (const opponent of opponents) {
            if (!acc[opponent.name]) {
                acc[opponent.name] = { wins: 0, losses: 0, total: 0 };
            }

            if (isWinner) {
                acc[opponent.name].wins += 1;
            } else {
                acc[opponent.name].losses += 1;
            }
            acc[opponent.name].total += 1;
        }

        return acc;
    }, {});

    const goalData = await getGoalStatisticsByPlayer(filter.kicker, username);

    const data = Object.keys(stats).map((key) => {
        return {
            name: key,
            wins: stats[key].wins,
            losses: stats[key].losses,
            winrate: parseFloat(stats[key].wins / stats[key].total), // toFixed returns a string, so wrap it with parseFloat
            total: stats[key].total,
            goals: goalData[key]?.standardGoals,
            ownGoals: goalData[key]?.ownGoals,
        };
    });

    data.sort((a, b) => {
        if (b.total !== a.total) {
            return b.total - a.total;
        }

        return b.winrate - a.winrate;
    });

    return data;
}

export async function getPlaytime({ name, kicker }) {
    const { data } = await getMatches({ filter: { name, kicker } });

    const playtime = data
        .filter((match) => match.status === "ended")
        .reduce(
            (acc, cur) => {
                const duration =
                    new Date(cur.end_time).getTime() -
                    new Date(cur.start_time).getTime();
                if (cur.gamemode === GAMEMODE_1ON1) {
                    acc.solo += duration;
                }
                if (cur.gamemode === GAMEMODE_2ON2) {
                    acc.duo += duration;
                }
                return acc;
            },
            { solo: 0, duo: 0 }
        );

    const playtimeSolo = formatTime(playtime.solo);
    const playtimeDuo = formatTime(playtime.duo);
    const playtimeOverall = formatTime(playtime.solo + playtime.duo);

    return { playtimeSolo, playtimeDuo, playtimeOverall };
}

function getResultData(username, match) {
    const playerNumber = getPlayersNumberFromMatch(username, match);
    const team1Won = match.scoreTeam1 > match.scoreTeam2;
    const opponents = [];
    if (playerNumber === 1 || playerNumber === 3) {
        opponents.push(match.player2, match.player4);
    }

    if (playerNumber === 2 || playerNumber === 4) {
        opponents.push(match.player1, match.player3);
    }

    return {
        isWinner:
            playerNumber === 1 || playerNumber === 3 ? team1Won : !team1Won,
        opponents: opponents.filter(Boolean),
    };
}

export async function scoreGoal(playerId, matchId, kicker) {
    return updateGoal(playerId, matchId, kicker, STANDARD_GOAL);
}

export async function scoreOwnGoal(playerId, matchId, kicker) {
    return updateGoal(playerId, matchId, kicker, OWN_GOAL);
}

async function updateGoal(playerId, matchId, kicker, goalType) {
    const match = await getMatch({ matchId, kicker });
    const { player1, player3 } = match;
    const team = isPlayerInTeam(playerId, player1, player3) ? 1 : 2;
    const opposingTeam = team === 1 ? 2 : 1;

    let scoreColumn;
    let updatedScore;
    let amount = 1;
    const ownTeamScoreColumn = `scoreTeam${team}`;
    const opposingTeamScoreColumn = `scoreTeam${opposingTeam}`;

    if (goalType === STANDARD_GOAL) {
        scoreColumn = ownTeamScoreColumn;
        updatedScore = match[scoreColumn] + 1;
    }
    if (goalType === OWN_GOAL) {
        if (match[ownTeamScoreColumn] === 0) {
            scoreColumn = opposingTeamScoreColumn;
            updatedScore = match[scoreColumn] + 1;
        }
        if (match[ownTeamScoreColumn] > 0) {
            scoreColumn = ownTeamScoreColumn;
            updatedScore = match[scoreColumn] - 1;
            amount = -1;
        }
    }

    const newMatchValues = {
        [scoreColumn]: updatedScore,
    };

    const updatedMatch = await updateMatch(matchId, newMatchValues);

    const newGoal = {
        match_id: matchId,
        player_id: playerId,
        kicker_id: kicker,
        goal_type: goalType,
        amount,
        team,
        scoreTeam1: updatedMatch.scoreTeam1,
        scoreTeam2: updatedMatch.scoreTeam2,
    };

    const { data, error } = await supabase
        .from(GOALS)
        .insert(newGoal)
        .select()
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return updatedMatch;
}

async function updateMatch(matchId, values) {
    const { data, error } = await supabase
        .from(MATCHES)
        .update(values)
        .eq("id", matchId)
        .select(
            `
            *,
            player1: ${PLAYER}!${MATCHES}_player1_fkey (*),
            player2: ${PLAYER}!${MATCHES}_player2_fkey (*),
            player3: ${PLAYER}!${MATCHES}_player3_fkey (*),
            player4: ${PLAYER}!${MATCHES}_player4_fkey (*)
        `
        )
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

export async function undoLastAction(matchId, kicker) {
    const { data, error } = await supabase
        .from(GOALS)
        .select("*")
        .eq("match_id", matchId)
        .eq("kicker_id", kicker)
        .order("created_at", { ascending: false });

    if (error) {
        throw new Error(error.message);
    }

    if (data.length === 0) {
        throw new Error("There is nothing to undo");
    }

    const match = await getMatch({ matchId, kicker });
    const { player1, player3 } = match;

    const latestGoal = data.at(0);
    const { id, player_id, goal_type, amount } = latestGoal;

    const team = isPlayerInTeam(player_id, player1, player3) ? 1 : 2;
    const opposingTeam = team === 1 ? 2 : 1;

    let scoreColumn;
    let updatedScore;

    if (goal_type === STANDARD_GOAL) {
        scoreColumn = `scoreTeam${team}`;
        updatedScore = match[scoreColumn] - 1;
    }
    if (goal_type === OWN_GOAL) {
        if (amount === -1) {
            scoreColumn = `scoreTeam${team}`;
            updatedScore = match[scoreColumn] + 1;
        }
        if (amount === 1) {
            scoreColumn = `scoreTeam${opposingTeam}`;
            updatedScore = match[scoreColumn] - 1;
        }
    }

    const newMatchValues = {
        [scoreColumn]: updatedScore,
    };

    const updatedMatch = await updateMatch(matchId, newMatchValues);

    // DELETE GOAL RECORD
    const { error: deleteError } = await supabase
        .from(GOALS)
        .delete()
        .eq("id", id);

    if (deleteError) {
        throw new Error(deleteError.message);
    }

    return updatedMatch;
}

function isPlayerInTeam(playerId, ...teamPlayers) {
    return teamPlayers.some((player) => player?.id === playerId);
}
