-- Migration: Create status_display_config table for admin-configurable status display settings
-- Schema: public

-- Table to store status display configuration per kicker
CREATE TABLE IF NOT EXISTS public.status_display_config (
    id SERIAL PRIMARY KEY,
    kicker_id INTEGER NOT NULL REFERENCES public.kicker(id) ON DELETE CASCADE,
    status_key VARCHAR(50) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    layer VARCHAR(20) NOT NULL DEFAULT 'effect', -- 'effect', 'overlay', 'background'
    priority INTEGER NOT NULL DEFAULT 50, -- Higher = shown first when conflicts
    is_exclusive BOOLEAN NOT NULL DEFAULT true, -- If true, only one per layer
    is_enabled BOOLEAN NOT NULL DEFAULT true, -- Can be disabled without deleting
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(kicker_id, status_key)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_status_display_config_kicker ON public.status_display_config(kicker_id);

-- Insert default configuration for all existing kickers
INSERT INTO public.status_display_config (kicker_id, status_key, display_name, layer, priority, is_exclusive, is_enabled)
SELECT 
    k.id,
    s.status_key,
    s.display_name,
    s.layer,
    s.priority,
    s.is_exclusive,
    s.is_enabled
FROM public.kicker k
CROSS JOIN (VALUES
    -- Effect layer (exclusive - only highest priority shown)
    ('legendary', 'Legendary', 'effect', 100, true, true),
    ('onFire', 'On Fire', 'effect', 90, true, true),
    ('hotStreak', 'Hot Streak', 'effect', 80, true, true),
    ('warmingUp', 'Warming Up', 'effect', 70, true, true),
    ('frozen', 'Frozen', 'effect', 65, true, true),
    ('iceCold', 'Ice Cold', 'effect', 60, true, true),
    ('cold', 'Cold', 'effect', 50, true, true),
    
    -- Overlay layer (non-exclusive - can show with effect layer)
    ('dominator', 'Dominator', 'overlay', 85, false, true),
    ('giantSlayer', 'Giant Slayer', 'overlay', 80, false, true),
    ('comeback', 'Comeback', 'overlay', 75, false, true),
    ('underdog', 'Underdog', 'overlay', 70, false, true),
    
    -- Background layer (non-exclusive - shown behind others)
    ('humiliated', 'Humiliated', 'background', 50, false, true)
) AS s(status_key, display_name, layer, priority, is_exclusive, is_enabled)
ON CONFLICT (kicker_id, status_key) DO NOTHING;

-- RPC function to get status display config for a kicker
CREATE OR REPLACE FUNCTION public.get_status_display_config(p_kicker_id INTEGER)
RETURNS TABLE (
    id INTEGER,
    status_key VARCHAR(50),
    display_name VARCHAR(100),
    layer VARCHAR(20),
    priority INTEGER,
    is_exclusive BOOLEAN,
    is_enabled BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sdc.id,
        sdc.status_key,
        sdc.display_name,
        sdc.layer,
        sdc.priority,
        sdc.is_exclusive,
        sdc.is_enabled
    FROM public.status_display_config sdc
    WHERE sdc.kicker_id = p_kicker_id
    ORDER BY sdc.priority DESC, sdc.display_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC function to update a single status config
CREATE OR REPLACE FUNCTION public.update_status_display_config(
    p_kicker_id INTEGER,
    p_status_key VARCHAR(50),
    p_layer VARCHAR(20) DEFAULT NULL,
    p_priority INTEGER DEFAULT NULL,
    p_is_exclusive BOOLEAN DEFAULT NULL,
    p_is_enabled BOOLEAN DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE public.status_display_config
    SET 
        layer = COALESCE(p_layer, layer),
        priority = COALESCE(p_priority, priority),
        is_exclusive = COALESCE(p_is_exclusive, is_exclusive),
        is_enabled = COALESCE(p_is_enabled, is_enabled),
        updated_at = NOW()
    WHERE kicker_id = p_kicker_id AND status_key = p_status_key;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC function to batch update status configs
CREATE OR REPLACE FUNCTION public.batch_update_status_display_config(
    p_kicker_id INTEGER,
    p_configs JSONB -- Array of {status_key, layer, priority, is_exclusive, is_enabled}
)
RETURNS INTEGER AS $$
DECLARE
    v_config JSONB;
    v_updated INTEGER := 0;
BEGIN
    FOR v_config IN SELECT * FROM jsonb_array_elements(p_configs)
    LOOP
        UPDATE public.status_display_config
        SET 
            layer = COALESCE(v_config->>'layer', layer),
            priority = COALESCE((v_config->>'priority')::INTEGER, priority),
            is_exclusive = COALESCE((v_config->>'is_exclusive')::BOOLEAN, is_exclusive),
            is_enabled = COALESCE((v_config->>'is_enabled')::BOOLEAN, is_enabled),
            updated_at = NOW()
        WHERE kicker_id = p_kicker_id 
          AND status_key = v_config->>'status_key';
        
        IF FOUND THEN
            v_updated := v_updated + 1;
        END IF;
    END LOOP;
    
    RETURN v_updated;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.status_display_config TO authenticated;
GRANT USAGE ON SEQUENCE public.status_display_config_id_seq TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_status_display_config(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_status_display_config(INTEGER, VARCHAR, VARCHAR, INTEGER, BOOLEAN, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.batch_update_status_display_config(INTEGER, JSONB) TO authenticated;

-- Enable RLS
ALTER TABLE public.status_display_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "status_display_config_select_policy" ON public.status_display_config
    FOR SELECT USING (true);

CREATE POLICY "status_display_config_update_policy" ON public.status_display_config
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.kicker k
            WHERE k.id = status_display_config.kicker_id
            AND k.admin = auth.uid()
        )
    );
