import { createClient } from "@supabase/supabase-js";

const databaseSchema = import.meta.env.VITE_DB_ENV || "kopecht";

export const supabaseUrl = "https://dixhaxicjwqchhautpje.supabase.co";
const supabaseKey =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpeGhheGljandxY2hoYXV0cGplIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTg0Mjg1MDUsImV4cCI6MjAxNDAwNDUwNX0.Rc8ZKPBB6aqkKPbEflY6_oIGkcmKk8gWy2G9TbJ_Cjw";
const supabase = createClient(supabaseUrl, supabaseKey, {
    db: { schema: databaseSchema },
});

export default supabase;
