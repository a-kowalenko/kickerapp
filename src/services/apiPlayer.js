import { PLAYER } from "../utils/constants";
import { getCurrentUser } from "./apiAuth";
import supabase from "./supabase";

export async function createPlayer({ user, kickerId }) {
    const {
        id: user_id,
        user_metadata: { avatar, username: name },
    } = user;

    const { data, error } = await supabase
        .from(PLAYER)
        .insert({
            user_id,
            name,
            avatar,
            kicker_id: kickerId,
        })
        .select()
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

export async function updatePlayerByUserId({ username, avatar, userId }) {
    const { data, error } = await supabase
        .from(PLAYER)
        .update({ name: username, avatar })
        .eq("user_id", userId)
        .select()
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

export async function getMostPlayed({ filter }) {
    const kickerId = filter.kicker;

    const { data, error } = await supabase.rpc("get_player_matches_count", {
        kicker_id: kickerId,
    });

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

export async function getPlayerByName({ name, kicker }) {
    const { data, error } = await supabase
        .from(PLAYER)
        .select("*")
        .eq("kicker_id", kicker)
        .eq("name", name)
        .single();

    if (error) {
        throw new Error("Player could not be loaded");
    }

    return data;
}

export async function getOwnPlayer(kicker) {
    const user = await getCurrentUser();

    const { data, error } = await supabase
        .from(PLAYER)
        .select("*")
        .eq("kicker_id", kicker)
        .eq("user_id", user.id);

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

export async function getPlayersByKicker(kickerId) {
    const { data, error } = await supabase.rpc("get_players_by_kicker", {
        kicker_id_param: kickerId,
    });

    if (error) {
        throw new Error(error.message);
    }

    return data;
}
