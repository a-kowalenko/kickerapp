import { PLAYER, SEASON_ALL_TIME, SEASON_OFF_SEASON } from "../utils/constants";
import supabase from "./supabase";

const MIN_GAMES_FOR_RANKED = 10;

export async function getRankings({ filter }) {
    const { kicker, field, seasonId } = filter;

    // If seasonId is a number (actual season ID), fetch from season_rankings
    // If seasonId is "all-time" or undefined, fetch from player table (all-time stats)
    // If seasonId is "off-season", we show all-time stats (off-season doesn't have separate rankings)

    if (
        seasonId &&
        seasonId !== SEASON_ALL_TIME &&
        seasonId !== SEASON_OFF_SEASON
    ) {
        // Fetch from season_rankings using RPC function
        const { data, error } = await supabase.rpc("get_season_rankings", {
            p_kicker_id: kicker,
            p_season_id: parseInt(seasonId),
        });

        if (error) {
            throw new Error("Error while selecting the season rankings");
        }

        const sortField = field === "mmr2on2" ? "mmr2on2" : "mmr";
        const winsField = field === "mmr2on2" ? "wins2on2" : "wins";
        const lossesField = field === "mmr2on2" ? "losses2on2" : "losses";

        // Separate ranked and unranked players
        const rankedPlayers = (data || []).filter((player) => {
            const totalGames =
                (player[winsField] || 0) + (player[lossesField] || 0);
            return totalGames >= MIN_GAMES_FOR_RANKED;
        });

        const unrankedPlayers = (data || []).filter((player) => {
            const totalGames =
                (player[winsField] || 0) + (player[lossesField] || 0);
            return totalGames > 0 && totalGames < MIN_GAMES_FOR_RANKED;
        });

        // Sort ranked players by MMR
        const sortedRanked = [...rankedPlayers].sort(
            (a, b) => b[sortField] - a[sortField]
        );

        // Sort unranked players by MMR
        const sortedUnranked = [...unrankedPlayers].sort(
            (a, b) => b[sortField] - a[sortField]
        );

        // Add rank numbers and unranked flag
        const rankedData = sortedRanked.map((player, index) => ({
            ...player,
            id: player.player_id,
            rank: index + 1,
            isUnranked: false,
        }));

        const unrankedData = sortedUnranked.map((player) => ({
            ...player,
            id: player.player_id,
            rank: null,
            isUnranked: true,
        }));

        // Combine: ranked first, then unranked
        const allData = [...rankedData, ...unrankedData];

        return { data: allData, error: null, count: allData.length };
    }

    // Default: All-time rankings from player table
    let query = supabase
        .from(PLAYER)
        .select("*", { count: "exact" })
        .eq("kicker_id", kicker);

    const { data, error } = await query;

    if (error) {
        throw new Error("Error while selecting the rankings");
    }

    const winsField = field === "mmr2on2" ? "wins2on2" : "wins";
    const lossesField = field === "mmr2on2" ? "losses2on2" : "losses";
    const sortField = field === "mmr2on2" ? "mmr2on2" : "mmr";

    // Separate ranked and unranked players
    const rankedPlayers = data.filter((player) => {
        const totalGames =
            (player[winsField] || 0) + (player[lossesField] || 0);
        return totalGames >= MIN_GAMES_FOR_RANKED;
    });

    const unrankedPlayers = data.filter((player) => {
        const totalGames =
            (player[winsField] || 0) + (player[lossesField] || 0);
        return totalGames > 0 && totalGames < MIN_GAMES_FOR_RANKED;
    });

    // Sort ranked players by MMR
    const sortedRanked = [...rankedPlayers].sort(
        (a, b) => b[sortField] - a[sortField]
    );

    // Sort unranked players by MMR
    const sortedUnranked = [...unrankedPlayers].sort(
        (a, b) => b[sortField] - a[sortField]
    );

    // Add rank numbers and unranked flag
    const rankedData = sortedRanked.map((player, index) => ({
        ...player,
        rank: index + 1,
        isUnranked: false,
    }));

    const unrankedData = sortedUnranked.map((player) => ({
        ...player,
        rank: null,
        isUnranked: true,
    }));

    // Combine: ranked first, then unranked
    const allData = [...rankedData, ...unrankedData];

    return { data: allData, error: null, count: allData.length };
}

export async function getRankByPlayerName(kicker, playerName, seasonId = null) {
    let rank1on1;
    let rank2on2;

    // If we have a season ID, get rankings from season_rankings
    if (
        seasonId &&
        seasonId !== SEASON_ALL_TIME &&
        seasonId !== SEASON_OFF_SEASON
    ) {
        const { data, error } = await supabase.rpc("get_season_rankings", {
            p_kicker_id: kicker,
            p_season_id: parseInt(seasonId),
        });

        if (error) {
            throw new Error(error.message);
        }

        // Filter players with minimum games for 1on1
        const qualified1on1 = (data || []).filter(
            (p) => (p.wins || 0) + (p.losses || 0) >= MIN_GAMES_FOR_RANKED
        );
        const sortedBy1on1MMR = [...qualified1on1].sort(
            (a, b) => b.mmr - a.mmr
        );

        // Filter players with minimum games for 2on2
        const qualified2on2 = (data || []).filter(
            (p) =>
                (p.wins2on2 || 0) + (p.losses2on2 || 0) >= MIN_GAMES_FOR_RANKED
        );
        const sortedBy2on2MMR = [...qualified2on2].sort(
            (a, b) => b.mmr2on2 - a.mmr2on2
        );

        // Find player's rank in 1on1 (only if they have enough games)
        const playerData = (data || []).find((p) => p.name === playerName);
        if (playerData) {
            const games1on1 = (playerData.wins || 0) + (playerData.losses || 0);
            if (games1on1 >= MIN_GAMES_FOR_RANKED) {
                for (let i = 0; i < sortedBy1on1MMR.length; i++) {
                    if (sortedBy1on1MMR[i].name === playerName) {
                        rank1on1 = i + 1;
                        break;
                    }
                }
            }

            const games2on2 =
                (playerData.wins2on2 || 0) + (playerData.losses2on2 || 0);
            if (games2on2 >= MIN_GAMES_FOR_RANKED) {
                for (let i = 0; i < sortedBy2on2MMR.length; i++) {
                    if (sortedBy2on2MMR[i].name === playerName) {
                        rank2on2 = i + 1;
                        break;
                    }
                }
            }
        }

        return { rank1on1, rank2on2 };
    }

    // Default: All-time rankings
    const { data, error } = await supabase
        .from(PLAYER)
        .select("*")
        .eq("kicker_id", kicker);

    if (error) {
        throw new Error(error.message);
    }

    // Filter players with minimum games for 1on1
    const qualified1on1 = data.filter(
        (p) => (p.wins || 0) + (p.losses || 0) >= MIN_GAMES_FOR_RANKED
    );
    const sortedBy1on1MMR = [...qualified1on1].sort((a, b) => b.mmr - a.mmr);

    // Filter players with minimum games for 2on2
    const qualified2on2 = data.filter(
        (p) => (p.wins2on2 || 0) + (p.losses2on2 || 0) >= MIN_GAMES_FOR_RANKED
    );
    const sortedBy2on2MMR = [...qualified2on2].sort(
        (a, b) => b.mmr2on2 - a.mmr2on2
    );

    // Find player's rank in 1on1 (only if they have enough games)
    const playerData = data.find((p) => p.name === playerName);
    if (playerData) {
        const games1on1 = (playerData.wins || 0) + (playerData.losses || 0);
        if (games1on1 >= MIN_GAMES_FOR_RANKED) {
            for (let i = 0; i < sortedBy1on1MMR.length; i++) {
                if (sortedBy1on1MMR[i].name === playerName) {
                    rank1on1 = i + 1;
                    break;
                }
            }
        }

        const games2on2 =
            (playerData.wins2on2 || 0) + (playerData.losses2on2 || 0);
        if (games2on2 >= MIN_GAMES_FOR_RANKED) {
            for (let i = 0; i < sortedBy2on2MMR.length; i++) {
                if (sortedBy2on2MMR[i].name === playerName) {
                    rank2on2 = i + 1;
                    break;
                }
            }
        }
    }

    return { rank1on1, rank2on2 };
}
