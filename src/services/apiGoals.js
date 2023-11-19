import { GOALS, MATCHES, PLAYER } from "../utils/constants";
import supabase from "./supabase";

export async function getGoalsByMatch(kicker, matchId, sortBy) {
    const filter = {
        method: "eq",
        field: "match_id",
        value: matchId,
    };

    const { data, count } = await getGoals(kicker, filter, sortBy);

    return { data, count };
}

export async function getGoalsByPlayer(kicker, playerId, sortBy) {
    const filter = {
        method: "eq",
        field: "player_id",
        value: playerId,
    };

    const { data, count } = await getGoals(kicker, filter, sortBy);

    return { data, count };
}

async function getGoals(kicker, filter, sortBy) {
    let query = supabase
        .from(GOALS)
        .select(
            `*, player: ${PLAYER}!${GOALS}_player_id_fkey (*), match: ${MATCHES}!${GOALS}_match_id_fkey (*)`,
            {
                count: "exact",
            }
        )
        .eq("kicker_id", kicker);

    if (filter) {
        query = query[filter.method || "eq"](filter.field, filter.value);
    }

    query = query.order(sortBy.field, {
        ascending: sortBy.direction === "asc",
    });

    const { data, error, count } = await query;

    if (error) {
        throw new Error(error.message);
    }

    return { data, count };
}
