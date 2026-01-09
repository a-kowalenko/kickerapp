-- Migration 014: Create trigger to send push notifications on mention_notifications INSERT (public)
-- This trigger calls the send-push-notification edge function via pg_net

-- Create the trigger function that calls the edge function via pg_net
CREATE OR REPLACE FUNCTION public.trigger_send_push_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_supabase_url TEXT;
    v_service_role_key TEXT;
    v_request_id BIGINT;
BEGIN
    -- Get Supabase URL and service role key from vault
    SELECT decrypted_secret INTO v_supabase_url 
    FROM vault.decrypted_secrets 
    WHERE name = 'supabase_url';
    
    SELECT decrypted_secret INTO v_service_role_key 
    FROM vault.decrypted_secrets 
    WHERE name = 'service_role_key';
    
    -- Only send push if we have the secrets configured
    IF v_supabase_url IS NOT NULL AND v_service_role_key IS NOT NULL THEN
        SELECT net.http_post(
            url := v_supabase_url || '/functions/v1/send-push-notification',
            headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'Authorization', 'Bearer ' || v_service_role_key
            ),
            body := jsonb_build_object(
                'type', 'INSERT',
                'table', 'mention_notifications',
                'schema', 'public',
                'record', jsonb_build_object(
                    'id', NEW.id,
                    'user_id', NEW.user_id,
                    'type', NEW.type,
                    'source_id', NEW.source_id,
                    'match_id', NEW.match_id,
                    'kicker_id', NEW.kicker_id,
                    'sender_player_id', NEW.sender_player_id,
                    'content_preview', NEW.content_preview,
                    'team_invitation_id', NEW.team_invitation_id,
                    'is_read', NEW.is_read,
                    'created_at', NEW.created_at
                )
            )
        ) INTO v_request_id;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger on mention_notifications table
DROP TRIGGER IF EXISTS trigger_send_push_notification ON public.mention_notifications;
CREATE TRIGGER trigger_send_push_notification
    AFTER INSERT ON public.mention_notifications
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_send_push_notification();
