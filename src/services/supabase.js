import { createClient } from "@supabase/supabase-js";
import { DEFAULT_DATABASE_SCHEMA } from "../utils/constants";

export const databaseSchema =
    import.meta.env.VITE_DB_ENV || DEFAULT_DATABASE_SCHEMA;

export const supabaseUrl = "https://dixhaxicjwqchhautpje.supabase.co";
export const avatarHighlightsUrl = `${supabaseUrl}/storage/v1/object/public/avatar_highlights`;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey, {
    db: { schema: databaseSchema },
});

export default supabase;
