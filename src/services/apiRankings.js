import { PLAYER, SEASON_ALL_TIME, SEASON_OFF_SEASON } from "../utils/constants";
import supabase from "./supabase";

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

        // Filter: only players with at least 1 match in this season (for the selected gamemode)
        const sortField = field === "mmr2on2" ? "mmr2on2" : "mmr";
        const winsField = field === "mmr2on2" ? "wins2on2" : "wins";
        const lossesField = field === "mmr2on2" ? "losses2on2" : "losses";

        const filteredData = (data || []).filter((player) => {
            const totalGames =
                (player[winsField] || 0) + (player[lossesField] || 0);
            return totalGames > 0;
        });

        // Sort by the appropriate field
        const sortedData = [...filteredData].sort(
            (a, b) => b[sortField] - a[sortField]
        );

        const rankedData = sortedData.map((player, index) => ({
            ...player,
            id: player.player_id, // Use player_id as id for consistency
            rank: index + 1,
        }));

        return { data: rankedData, error: null, count: rankedData.length };
    }

    // Default: All-time rankings from player table
    let query = supabase
        .from(PLAYER)
        .select("*", { count: "exact" })
        .eq("kicker_id", kicker);

    // Filter: only players with at least 1 match (for the selected gamemode)
    if (field === "mmr2on2") {
        query = query.or("wins2on2.gt.0,losses2on2.gt.0");
    } else {
        query = query.or("wins.gt.0,losses.gt.0");
    }

    if (field) {
        query = query.order(field, { ascending: false });
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

        const sortedBy1on1MMR = [...(data || [])].sort((a, b) => b.mmr - a.mmr);
        const sortedBy2on2MMR = [...(data || [])].sort(
            (a, b) => b.mmr2on2 - a.mmr2on2
        );

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

    // Default: All-time rankings
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
