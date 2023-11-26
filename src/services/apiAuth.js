import { PLAYER } from "../utils/constants";
import { getBaseUrl } from "../utils/helpers";
import { getUserKickers } from "./apiKicker";
import { getPlayerByName, updatePlayerByUserId } from "./apiPlayer";
import supabase, { supabaseUrl } from "./supabase";

export async function register({ username, email, password }) {
    if (await existsUsername(username)) {
        throw new Error("Username is already taken");
    }

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                username,
                avatar: "",
            },
        },
    });

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

export async function login({ email, password }) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        throw new Error(error.message);
    }

    const kickers = await getUserKickers();

    return { ...data, kickers };
}

export async function getCurrentUser() {
    const { data: session } = await supabase.auth.getSession();

    if (!session.session) {
        return null;
    }

    const { data, error } = await supabase.auth.getUser();

    if (error) {
        throw new Error(error.message);
    }

    return data?.user;
}

export async function logout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
        throw new Error(error.message);
    }
}

export async function updateCurrentUser({ username, avatar, kicker }) {
    const user = await getCurrentUser();
    const { id } = user;
    const player = await getPlayerByName({ name: username, kicker });

    if (player && player.user_id !== id) {
        throw new Error("Username is already taken");
    }

    let avatarLink;

    // If avatar is provided, handle its upload
    if (avatar) {
        const filename = `avatars-${user.id}-${Math.random()}`;

        const { error: storageError } = await supabase.storage
            .from("avatars")
            .upload(filename, avatar);

        if (storageError) {
            throw new Error(storageError.message);
        }

        avatarLink = `${supabaseUrl}/storage/v1/object/public/avatars/${filename}`;
    }

    const updatedPlayer = await updatePlayerByUserId({
        username,
        avatar: avatarLink,
        userId: user.id,
        kicker,
    });

    return updatedPlayer;
}

async function existsUsername(username) {
    const { data: checkPlayers, error: checkPlayerError } = await supabase
        .from(PLAYER)
        .select("*")
        .eq("name", username);

    if (checkPlayerError) {
        throw new Error(checkPlayerError.message);
    }

    return checkPlayers.length > 0;
}

export async function recover({ email }) {
    const baseUrl = getBaseUrl();
    const redirectUrl = `${baseUrl}/update-password`;

    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
    });

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

export async function updatePassword({ password }) {
    const { data, error } = await supabase.auth.updateUser({ password });

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

export async function verifyRecoveryToken({ token_hash, type }) {
    const { data, error } = await supabase.auth.verifyOtp({ token_hash, type });

    if (error) {
        throw new Error(error.message);
    }

    return data;
}

export async function setLastKicker(kickerId) {
    const { data, error } = await supabase.auth.updateUser({
        data: { last_kicker: kickerId },
    });

    if (error) {
        throw new Error(error.message);
    }

    return data;
}
