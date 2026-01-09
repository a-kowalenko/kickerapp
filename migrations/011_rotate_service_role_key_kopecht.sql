-- Migration: Rotate service_role_key after key leak
-- Schema: kopecht
-- 
-- INSTRUCTIONS:
-- 1. Replace <DEIN_NEUER_SECRET_KEY> with your new secret key from:
--    Supabase Dashboard → Settings → API Keys → Secret keys → "default"
--    (The key starting with sb_secret_...)
-- 2. Run this migration in the Supabase SQL Editor
-- 3. Then disable legacy JWT keys in the Dashboard
--
-- ⚠️  DO NOT COMMIT THIS FILE WITH THE ACTUAL KEY! ⚠️

-- 1. Update notify_mention function (for chat mentions)
CREATE OR REPLACE FUNCTION "kopecht"."notify_mention"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    IF NEW.content LIKE '%@%' THEN
        PERFORM net.http_post(
            url := 'https://dixhaxicjwqchhautpje.supabase.co/functions/v1/send-push-notification',
            headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'apikey', '<DEIN_NEUER_SECRET_KEY>',
                'Authorization', 'Bearer <DEIN_NEUER_SECRET_KEY>'
            ),
            body := jsonb_build_object(
                'type', 'INSERT',
                'table', TG_TABLE_NAME,
                'schema', 'kopecht',
                'record', row_to_json(NEW)
            )
        );
    END IF;
    RETURN NEW;
END;
$$;

-- 2. Update trigger_process_achievement function (for achievement notifications)
CREATE OR REPLACE FUNCTION "kopecht"."trigger_process_achievement"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'kopecht', 'extensions'
    AS $$
declare
  endpoint_url text := 'https://dixhaxicjwqchhautpje.supabase.co/functions/v1/process-achievement';
  secret_key text := '<DEIN_NEUER_SECRET_KEY>';
  webhook_name text := TG_ARGV[0];
begin
  perform net.http_post(
      url := endpoint_url,
      headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'apikey', secret_key,
          'Authorization', 'Bearer ' || secret_key
      ),
      body := jsonb_build_object(
          'webhook_name', webhook_name, 
          'type', TG_OP,
          'table', TG_TABLE_NAME,
          'schema', TG_TABLE_SCHEMA,
          'record', new,                
          'old_record', old             
      )
  );
  return new;
end;
$$;
