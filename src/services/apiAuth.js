import { createPlayer, updatePlayerByUserId } from "./apiPlayer";
import supabase, { supabaseUrl } from "./supabase";

export async function register({ username, email, password }) {
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

    await createPlayer(data.user);

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

    return data;
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

export async function updateCurrentUser({ username, avatar }) {
    const { data, error } = await supabase.auth.updateUser({
        data: { username },
    });

    if (error) {
        throw new Error(error.message);
    }

    console.log("updated data", data);

    let avatarLink;

    // If avatar is provided, handle its upload
    if (avatar) {
        const filename = `avatars-${data.user.id}-${Math.random()}`;

        const { error: storageError } = await supabase.storage
            .from("avatars")
            .upload(filename, avatar);

        if (storageError) {
            throw new Error(storageError.message);
        }

        avatarLink = `${supabaseUrl}/storage/v1/object/public/avatars/${filename}`;

        const { error: avatarError } = await supabase.auth.updateUser({
            data: {
                avatar: avatarLink,
            },
        });

        if (avatarError) {
            throw new Error(avatarError.message);
        }
    }

    await updatePlayerByUserId({
        username,
        avatar: avatarLink,
        userId: data.user.id,
    });

    return data;
}
