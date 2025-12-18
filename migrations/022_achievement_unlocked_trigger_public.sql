-- Migration: Create trigger for ACHIEVEMENT_UNLOCKED event
-- This triggers the process-achievement Edge Function when a player unlocks an achievement

-- Create the webhook trigger for player_achievements inserts
CREATE OR REPLACE FUNCTION public.notify_achievement_unlocked()
RETURNS TRIGGER AS $$
DECLARE
    payload JSON;
BEGIN
    -- Build payload matching the webhook format
    payload := json_build_object(
        'type', 'INSERT',
        'table', 'player_achievements',
        'schema', 'public',
        'record', row_to_json(NEW),
        'old_record', NULL
    );
    
    -- Call the Edge Function via pg_net (if available) or http extension
    -- Note: You may need to adjust this based on your Supabase setup
    PERFORM
        net.http_post(
            url := current_setting('app.settings.edge_function_url', true) || '/process-achievement',
            headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
            ),
            body := payload::jsonb
        );
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail the insert
        RAISE WARNING 'Failed to notify achievement unlocked: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS on_achievement_unlocked ON public.player_achievements;
CREATE TRIGGER on_achievement_unlocked
    AFTER INSERT ON public.player_achievements
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_achievement_unlocked();

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.notify_achievement_unlocked() TO service_role;

COMMENT ON FUNCTION public.notify_achievement_unlocked() IS 
    'Triggers the process-achievement Edge Function when a player unlocks an achievement';
