-- Function: public.update_sequences()
-- Description: Updates all sequences in kopecht schema to match max IDs
-- Type: Regular Function
-- Security: Invoker

CREATE OR REPLACE FUNCTION public.update_sequences()
RETURNS void AS $$
DECLARE
    seq_record RECORD;
    max_id INTEGER;
BEGIN
    -- Durchlaufe alle Tabellen im Schema 'kopecht'
    FOR seq_record IN SELECT table_name, column_name FROM information_schema.columns WHERE table_schema = 'kopecht' AND column_default LIKE 'nextval(%' LOOP
        -- Ermittle die maximale ID für die aktuelle Tabelle
        EXECUTE 'SELECT COALESCE(MAX(' || quote_ident(seq_record.column_name) || '), 0) FROM kopecht.' || quote_ident(seq_record.table_name) INTO max_id;
    
        -- Setze den Sequenzwert auf die maximale ID + 1
        EXECUTE 'SELECT setval(pg_get_serial_sequence(''kopecht.' || quote_ident(seq_record.table_name) || ''', ''' || seq_record.column_name || '''), ' || max_id || ' + 1)';
    END LOOP;
END;
$$ LANGUAGE plpgsql;
