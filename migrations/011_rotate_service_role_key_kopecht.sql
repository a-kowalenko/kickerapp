-- Migration: Rotate service_role_key after key leak
-- Schema: kopecht
-- 
-- INSTRUCTIONS:
-- 1. Replace <DEIN_NEUER_SERVICE_ROLE_KEY> with your new secret key from:
--    Supabase Dashboard → Settings → API Keys → Secret keys → "default"
-- 2. Run this migration in the Supabase SQL Editor
-- 3. Then disable legacy keys in the Dashboard
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
                'Authorization', 'Bearer <DEIN_NEUER_SERVICE_ROLE_KEY>'
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
  -- Configuration
  endpoint_url text := 'https://dixhaxicjwqchhautpje.supabase.co/functions/v1/process-achievement';
  
  -- Authentication - New rotated service_role key
  service_role_key text := '<DEIN_NEUER_SERVICE_ROLE_KEY>';
  
  webhook_name text := TG_ARGV[0];
  
begin
  perform net.http_post(
      url := endpoint_url,
      headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || service_role_key
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
