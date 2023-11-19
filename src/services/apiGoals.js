import {
    GOALS,
    MATCHES,
    OWN_GOAL,
    PLAYER,
    STANDARD_GOAL,
} from "../utils/constants";
import { getPlayerByName } from "./apiPlayer";
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
            `*, player: ${PLAYER}!${GOALS}_player_id_fkey (*), match: ${MATCHES}!${GOALS}_match_id_fkey (
                *, 
                player1: ${PLAYER}!${MATCHES}_player1_fkey (*),
                player2: ${PLAYER}!${MATCHES}_player2_fkey (*),
                player3: ${PLAYER}!${MATCHES}_player3_fkey (*),
                player4: ${PLAYER}!${MATCHES}_player4_fkey (*)
             )`,
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

export async function getGoalStatisticsByPlayer(kicker, playerName) {
    const player = await getPlayerByName({ name: playerName, kicker });
    const playerId = player.id;

    const sortBy = {
        field: "created_at",
        direction: "asc",
    };

    const { data } = await getGoalsByPlayer(kicker, playerId, sortBy);

    const playerGoalData = data.reduce((acc, cur) => {
        const { match } = cur;
        const { player1, player2, player3, player4 } = match;
        const ownTeam =
            player1.id === playerId || player3?.id === playerId ? 1 : 2;
        const enemies = ownTeam === 1 ? [player2, player4] : [player1, player3];

        for (const enemy of enemies) {
            if (!enemy) {
                continue;
            }
            if (!acc[enemy.name]) {
                acc[enemy.name] = {
                    standardGoals: 0,
                    ownGoals: 0,
                };
            }

            if (cur.goal_type === STANDARD_GOAL) {
                acc[enemy.name].standardGoals += 1;
            }
            if (cur.goal_type === OWN_GOAL) {
                acc[enemy.name].ownGoals += 1;
            }
        }

        return acc;
    }, {});

    return playerGoalData;
}
