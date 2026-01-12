-- Rollback: Restore legacy mention triggers (public schema)

-- Recreate the legacy function
CREATE OR REPLACE FUNCTION public.notify_mention() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    IF NEW.content LIKE '%@%' THEN
        PERFORM net.http_post(
            url := 'https://dixhaxicjwqchhautpje.supabase.co/functions/v1/send-push-notification',
            headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'apikey', 'sb_secret_###########################',
                'Authorization', 'Bearer sb_secret_###########################'
            ),
            body := jsonb_build_object(
                'type', 'INSERT',
                'table', TG_TABLE_NAME,
                'schema', 'public',
                'record', row_to_json(NEW)
            )
        );
    END IF;
    RETURN NEW;
END;
$$;

-- Recreate legacy triggers
CREATE TRIGGER notify_chat_mention 
    AFTER INSERT ON public.chat_messages 
    FOR EACH ROW EXECUTE FUNCTION public.notify_mention();

CREATE TRIGGER notify_comment_mention 
    AFTER INSERT ON public.match_comments 
    FOR EACH ROW EXECUTE FUNCTION public.notify_mention();
