import { KICKER, PLAYER } from "../utils/constants";
import { getCurrentUser } from "./apiAuth";
import { createPlayer } from "./apiPlayer";
import supabase from "./supabase";

export async function createKicker({ name }) {
    if (!name) {
        throw new Error("Kicker cannot be created without a name");
    }

    // 1. Create a new kicker record
    const { data, error } = await supabase
        .from(KICKER)
        .insert({ name })
        .select()
        .single();

    if (error) {
        throw new Error(error.message);
    }

    const kickerId = data.id;

    // 2. Get current user
    const user = await getCurrentUser();

    // 3. Create the first player of the kicker (admin)
    const player = await createPlayer({ user, kickerId });

    // 4. Set player as admin of the kicker
    const { data: updateData, error: updateError } = await supabase
        .from(KICKER)
        .update({ admin: user.id })
        .eq("id", kickerId)
        .select()
        .single();

    if (updateError) {
        throw new Error(updateError.message);
    }

    return updateData;
}

export async function joinKicker({ accessToken }) {
    if (!accessToken) {
        throw new Error("Kicker cannot be joined without an access token");
    }

    // 1. Select desired kicker
    const { data, error } = await supabase
        .from(KICKER)
        .select("*")
        .eq("access_token", accessToken)
        .single();

    if (error) {
        throw new Error(error.message);
    }

    const { id: kickerId } = data;

    // 2. Get current user
    const user = await getCurrentUser();

    // 3. Check if player already exists for this user in this kicker
    const { data: playerData, error: playerError } = await supabase
        .from(PLAYER)
        .select("*")
        .eq("user_id", user.id)
        .eq("kicker_id", kickerId);

    if (playerData.length > 0) {
        throw new Error("You are already a member of this kicker");
    }

    // 4. Create new player for kicker
    await createPlayer({ user, kickerId });

    return data;
}

export async function verifyKickerMembership(userId, kickerId) {
    if (!userId || !kickerId) {
        return false;
    }

    const { data, error } = await supabase
        .from(PLAYER)
        .select()
        .eq("user_id", userId)
        .eq("kicker_id", kickerId)
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return data?.id > 0;
}

export async function getUserKickers() {
    const user = await getCurrentUser();

    if (!user) {
        return null;
    }
    // First, get the kicker IDs associated with the user
    const { data: playerData, error: playerError } = await supabase
        .from(PLAYER)
        .select("kicker_id")
        .eq("user_id", user.id);

    if (playerError) {
        throw new Error(playerError.message);
    }

    // Extract the kicker IDs from the player data
    const kickerIds = playerData.map((p) => p.kicker_id);

    // Then, use these IDs in the main query
    const { data: kickerData, error: kickerError } = await supabase
        .from(KICKER)
        .select("*")
        .in("id", kickerIds);

    if (kickerError) {
        throw new Error(kickerError.message);
    }

    return kickerData;
}

export async function getKickerInfo(kickerId) {
    const { data, error } = await supabase
        .from(KICKER)
        .select("*")
        .eq("id", kickerId)
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

export async function currentUserIsKickerAdmin(kicker) {
    const kickerInfo = await getKickerInfo(kicker);
    const user = await getCurrentUser();

    return kickerInfo.admin === user.id;
}
