import { addDays, format, parseISO } from "date-fns";
import {
    FATALITY_FAKTOR,
    GAMEMODE_1ON1,
    GAMEMODE_2ON1,
    GAMEMODE_2ON2,
    GENERATED_GOAL,
    GOALS,
    MATCHES,
    MATCH_ACTIVE,
    MATCH_ENDED,
    OWN_GOAL,
    PAGE_SIZE,
    PLAYER,
    SEASON_RANKINGS,
    STANDARD_GOAL,
} from "../utils/constants";
import { calculateMmrChange } from "../utils/helpers";
import { getPlayerByName } from "./apiPlayer";
import supabase from "./supabase";
import {
    createGoal,
    getGoalStatisticsByPlayer,
    getGoalsByMatch,
} from "./apiGoals";

// Helper function to update season rankings after a match ends
async function updateSeasonRankings({
    match,
    gameMode,
    team1Wins,
    mmrChangeForTeam1,
    mmrChangeForTeam2,
    seasonRankingsMap,
}) {
    const { player1, player2, player3, player4 } = match;

    // Use the passed seasonRankingsMap
    const rankingsMap = seasonRankingsMap;

    if (gameMode === GAMEMODE_1ON1) {
        // Update player 1
        const p1Ranking = rankingsMap[player1.id];
        if (p1Ranking) {
            await supabase
                .from(SEASON_RANKINGS)
                .update({
                    wins: team1Wins ? p1Ranking.wins + 1 : p1Ranking.wins,
                    losses: team1Wins ? p1Ranking.losses : p1Ranking.losses + 1,
                    mmr: p1Ranking.mmr + mmrChangeForTeam1,
                })
                .eq("id", p1Ranking.id);
        }

        // Update player 2
        const p2Ranking = rankingsMap[player2.id];
        if (p2Ranking) {
            await supabase
                .from(SEASON_RANKINGS)
                .update({
                    wins: team1Wins ? p2Ranking.wins : p2Ranking.wins + 1,
                    losses: team1Wins ? p2Ranking.losses + 1 : p2Ranking.losses,
                    mmr: p2Ranking.mmr + mmrChangeForTeam2,
                })
                .eq("id", p2Ranking.id);
        }
    }

    if (gameMode === GAMEMODE_2ON2) {
        // Update player 1
        const p1Ranking = rankingsMap[player1.id];
        if (p1Ranking) {
            await supabase
                .from(SEASON_RANKINGS)
                .update({
                    wins2on2: team1Wins
                        ? p1Ranking.wins2on2 + 1
                        : p1Ranking.wins2on2,
                    losses2on2: team1Wins
                        ? p1Ranking.losses2on2
                        : p1Ranking.losses2on2 + 1,
                    mmr2on2: p1Ranking.mmr2on2 + mmrChangeForTeam1,
                })
                .eq("id", p1Ranking.id);
        }

        // Update player 2
        const p2Ranking = rankingsMap[player2.id];
        if (p2Ranking) {
            await supabase
                .from(SEASON_RANKINGS)
                .update({
                    wins2on2: team1Wins
                        ? p2Ranking.wins2on2
                        : p2Ranking.wins2on2 + 1,
                    losses2on2: team1Wins
                        ? p2Ranking.losses2on2 + 1
                        : p2Ranking.losses2on2,
                    mmr2on2: p2Ranking.mmr2on2 + mmrChangeForTeam2,
                })
                .eq("id", p2Ranking.id);
        }

        // Update player 3 if exists
        if (player3) {
            const p3Ranking = rankingsMap[player3.id];
            if (p3Ranking) {
                await supabase
                    .from(SEASON_RANKINGS)
                    .update({
                        wins2on2: team1Wins
                            ? p3Ranking.wins2on2 + 1
                            : p3Ranking.wins2on2,
                        losses2on2: team1Wins
                            ? p3Ranking.losses2on2
                            : p3Ranking.losses2on2 + 1,
                        mmr2on2: p3Ranking.mmr2on2 + mmrChangeForTeam1,
                    })
                    .eq("id", p3Ranking.id);
            }
        }

        // Update player 4 if exists
        if (player4) {
            const p4Ranking = rankingsMap[player4.id];
            if (p4Ranking) {
                await supabase
                    .from(SEASON_RANKINGS)
                    .update({
                        wins2on2: team1Wins
                            ? p4Ranking.wins2on2
                            : p4Ranking.wins2on2 + 1,
                        losses2on2: team1Wins
                            ? p4Ranking.losses2on2 + 1
                            : p4Ranking.losses2on2,
                        mmr2on2: p4Ranking.mmr2on2 + mmrChangeForTeam2,
                    })
                    .eq("id", p4Ranking.id);
            }
        }
    }
}

export async function getPlayers({ filter }) {
    const { data, error } = await supabase
        .from(PLAYER)
        .select("*")
        .eq("kicker_id", filter.kicker)
        .order("name", { ascending: true });

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
        .select(
            `
        *,
        player1: ${PLAYER}!${MATCHES}_player1_fkey (*),
        player2: ${PLAYER}!${MATCHES}_player2_fkey (*),
        player3: ${PLAYER}!${MATCHES}_player3_fkey (*),
        player4: ${PLAYER}!${MATCHES}_player4_fkey (*)
    `
        )
        .eq("status", MATCH_ACTIVE)
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

    // Get current season from kicker
    const { data: kickerData, error: kickerError } = await supabase
        .from("kicker")
        .select("current_season_id")
        .eq("id", kicker)
        .single();

    if (kickerError) {
        throw new Error("Error fetching kicker data", kickerError.message);
    }

    const currentSeasonId = kickerData?.current_season_id || null;

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
                season_id: currentSeasonId,
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

    // Season filter
    if (filter?.seasonId !== undefined) {
        if (filter.seasonId === null) {
            // Off-season: matches without a season
            query = query.is("season_id", null);
        } else {
            // Specific season
            query = query.eq("season_id", filter.seasonId);
        }
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

export async function getActiveMatch(kicker) {
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
        .eq("status", MATCH_ACTIVE)
        .eq("kicker_id", kicker);

    if (error) {
        throw new Error(
            "There was an error while checking for active matches",
            error.message
        );
    }

    if (data.length === 0) {
        return null;
    }

    return data[0];
}

export async function endMatch({ id, score1, score2, kicker }) {
    const match = await getMatch({ matchId: id, kicker });

    if (match.status !== MATCH_ACTIVE) {
        throw new Error("Match has already ended");
    }

    const {
        player1,
        player2,
        player3,
        player4,
        scoreTeam1,
        scoreTeam2,
        season_id,
    } = match;
    const gameMode = !player3 && !player4 ? GAMEMODE_1ON1 : GAMEMODE_2ON2;

    const finalScore1 = score1 ? score1 : scoreTeam1;
    const finalScore2 = score2 ? score2 : scoreTeam2;

    if (finalScore1 === finalScore2) {
        throw new Error(
            "Draws are not allowed.\nKeep playing until someone wins!"
        );
    }

    const team1Wins = finalScore1 > finalScore2;
    const isFatality = finalScore1 === 0 || finalScore2 === 0;

    let mmrChangeForTeam1 = 0;
    let mmrChangeForTeam2 = 0;
    let seasonRankingsMap = {};

    // Get season rankings for MMR calculation (only if match has a season)
    if (season_id) {
        const playerIds = [player1.id, player2.id];
        if (player3) playerIds.push(player3.id);
        if (player4) playerIds.push(player4.id);

        const { data: currentRankings, error: rankingsError } = await supabase
            .from(SEASON_RANKINGS)
            .select("*")
            .eq("season_id", season_id)
            .in("player_id", playerIds);

        if (rankingsError) {
            throw new Error(
                "Error fetching season rankings: " + rankingsError.message
            );
        }

        // Create a map for easy lookup
        currentRankings?.forEach((r) => {
            seasonRankingsMap[r.player_id] = r;
        });

        // Calculate MMR change based on season rankings
        if (gameMode === GAMEMODE_1ON1) {
            const p1SeasonMmr = seasonRankingsMap[player1.id]?.mmr || 1000;
            const p2SeasonMmr = seasonRankingsMap[player2.id]?.mmr || 1000;

            mmrChangeForTeam1 = calculateMmrChange(
                p1SeasonMmr,
                p2SeasonMmr,
                team1Wins ? 1 : 0
            );

            if (isFatality) {
                mmrChangeForTeam1 = mmrChangeForTeam1 * FATALITY_FAKTOR;
            }

            mmrChangeForTeam2 = -mmrChangeForTeam1;
        }

        // 2on2, 1on2, 2on1
        if (gameMode === GAMEMODE_2ON2) {
            const p1SeasonMmr = seasonRankingsMap[player1.id]?.mmr2on2 || 1000;
            const p2SeasonMmr = seasonRankingsMap[player2.id]?.mmr2on2 || 1000;
            const p3SeasonMmr = player3
                ? seasonRankingsMap[player3.id]?.mmr2on2 || 1000
                : null;
            const p4SeasonMmr = player4
                ? seasonRankingsMap[player4.id]?.mmr2on2 || 1000
                : null;

            mmrChangeForTeam1 = calculateMmrChange(
                p3SeasonMmr
                    ? Math.round((p1SeasonMmr + p3SeasonMmr) / 2)
                    : p1SeasonMmr,
                p4SeasonMmr
                    ? Math.round((p2SeasonMmr + p4SeasonMmr) / 2)
                    : p2SeasonMmr,
                team1Wins ? 1 : 0
            );

            if (isFatality) {
                mmrChangeForTeam1 = mmrChangeForTeam1 * FATALITY_FAKTOR;
            }

            mmrChangeForTeam2 = -mmrChangeForTeam1;
        }

        // Update season_rankings with MMR changes
        await updateSeasonRankings({
            match,
            gameMode,
            team1Wins,
            mmrChangeForTeam1,
            mmrChangeForTeam2,
            seasonRankingsMap,
        });
    }

    // Update player table with wins/losses only (no MMR changes)
    if (gameMode === GAMEMODE_1ON1) {
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
            })
            .eq("id", player1.id);
        await supabase
            .from(PLAYER)
            .update({
                wins: newPlayer2Wins,
                losses: newPlayer2Losses,
            })
            .eq("id", player2.id);
    }

    if (gameMode === GAMEMODE_2ON2) {
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
            })
            .eq("id", player1.id);
        await supabase
            .from(PLAYER)
            .update({
                wins2on2: newPlayer2Wins,
                losses2on2: newPlayer2Losses,
            })
            .eq("id", player2.id);
        if (player3) {
            await supabase
                .from(PLAYER)
                .update({
                    wins2on2: newPlayer3Wins,
                    losses2on2: newPlayer3Losses,
                })
                .eq("id", player3.id);
        }
        if (player4) {
            await supabase
                .from(PLAYER)
                .update({
                    wins2on2: newPlayer4Wins,
                    losses2on2: newPlayer4Losses,
                })
                .eq("id", player4.id);
        }
    }

    // Get MMR values for match record from season_rankings (or null if off-season)
    const mmrPlayer1 = season_id
        ? gameMode === GAMEMODE_1ON1
            ? seasonRankingsMap[player1.id]?.mmr
            : seasonRankingsMap[player1.id]?.mmr2on2
        : null;
    const mmrPlayer2 = season_id
        ? gameMode === GAMEMODE_1ON1
            ? seasonRankingsMap[player2.id]?.mmr
            : seasonRankingsMap[player2.id]?.mmr2on2
        : null;
    const mmrPlayer3 =
        season_id && gameMode === GAMEMODE_2ON2 && player3
            ? seasonRankingsMap[player3.id]?.mmr2on2
            : null;
    const mmrPlayer4 =
        season_id && gameMode === GAMEMODE_2ON2 && player4
            ? seasonRankingsMap[player4.id]?.mmr2on2
            : null;

    const { data, error } = await supabase
        .from(MATCHES)
        .update({
            status: MATCH_ENDED,
            scoreTeam1: finalScore1,
            scoreTeam2: finalScore2,
            mmrChangeTeam1: season_id ? mmrChangeForTeam1 : null,
            mmrChangeTeam2: season_id ? mmrChangeForTeam2 : null,
            mmrPlayer1,
            mmrPlayer2,
            mmrPlayer3,
            mmrPlayer4,
            end_time: new Date(),
        })
        .eq("id", id)
        .select()
        .single();

    if (error) {
        throw new Error("There was an error ending the match", error.message);
    }

    // Falls Spiel ohne goal tracking, erstelle goal datensätze
    const { count: goalsCount } = await getGoalsByMatch(kicker, id);
    if (!goalsCount) {
        // Keine goals vorhanden, erstelle Datensätze
        // Nur für 1on1, da nicht bekannt ist, wer die Tore geschossen hat
        if (data.gamemode == GAMEMODE_1ON1) {
            // TEAM 1
            for (let i = 0; i < data.scoreTeam1; i++) {
                const newGoal = {
                    match_id: id,
                    player_id: data.player1,
                    kicker_id: kicker,
                    goal_type: GENERATED_GOAL,
                    amount: 1,
                    team: 1,
                    scoreTeam1: null,
                    scoreTeam2: null,
                    gamemode: data.gamemode,
                };

                createGoal(newGoal);
            }

            // TEAM 2
            for (let i = 0; i < data.scoreTeam2; i++) {
                const newGoal = {
                    match_id: id,
                    player_id: data.player2,
                    kicker_id: kicker,
                    goal_type: GENERATED_GOAL,
                    amount: 1,
                    team: 2,
                    scoreTeam1: null,
                    scoreTeam2: null,
                    gamemode: data.gamemode,
                };

                createGoal(newGoal);
            }
        }
    }

    return data;
}

export async function getFatalities({ filter }) {
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

    // Season filter
    if (filter?.seasonId !== undefined) {
        if (filter.seasonId === null) {
            // Off-season: matches without a season
            query = query.is("season_id", null);
        } else {
            // Specific season
            query = query.eq("season_id", filter.seasonId);
        }
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

    const { data, error, count } = await query.eq("status", MATCH_ENDED);

    if (error) {
        throw new Error("Error while selecting the fatalities");
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

    // Get season's MMR for the player
    // If seasonId is specified in filter, use that; otherwise use current active season
    let currentSeasonMmr = null;
    let targetSeasonId = filter.seasonId;

    if (!targetSeasonId) {
        // Get current active season from kicker
        const { data: kickerData } = await supabase
            .from("kicker")
            .select("current_season_id")
            .eq("id", filter.kicker)
            .single();
        targetSeasonId = kickerData?.current_season_id;
    }

    if (targetSeasonId) {
        const { data: seasonRanking } = await supabase
            .from(SEASON_RANKINGS)
            .select("*")
            .eq("season_id", targetSeasonId)
            .eq("player_id", player.id)
            .single();

        if (seasonRanking) {
            currentSeasonMmr =
                filter.value === GAMEMODE_1ON1
                    ? seasonRanking.mmr
                    : seasonRanking.mmr2on2;
        }
    }

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

    // Use current season MMR if available, otherwise null (no MMR during off-season)
    if (currentSeasonMmr !== null) {
        result.push({
            date: format(new Date(), "dd.MM.yyyy"),
            mmr: currentSeasonMmr,
        });
    }

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

    const goalData = await getGoalStatisticsByPlayer(filter, username);

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

export async function getPlaytime({ name, kicker, seasonId }) {
    const { data } = await getMatches({ filter: { name, kicker, seasonId } });

    const playtime = data
        .filter((match) => match.status === MATCH_ENDED)
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

    const playtimeSolo = playtime.solo;
    const playtimeDuo = playtime.duo;
    const playtimeOverall = playtime.solo + playtime.duo;

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
        gamemode: match.gamemode,
    };

    await createGoal(newGoal);

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
