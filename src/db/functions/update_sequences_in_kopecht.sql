-- Function: public.update_sequences_in_kopecht()
-- Description: Alternative sequence update function for kopecht schema
-- Type: Regular Function
-- Security: Invoker

CREATE OR REPLACE FUNCTION public.update_sequences_in_kopecht()
RETURNS void AS $$
DECLARE
    seq_record RECORD;
    sequence_name TEXT;
    max_id BIGINT;
BEGIN
    FOR seq_record IN
        SELECT t.relname AS table_name, a.attname AS column_name, s.relname AS sequence_name
        FROM pg_class s
        JOIN pg_depend d ON d.objid = s.oid
        JOIN pg_class t ON d.refobjid = t.oid
        JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = d.refobjsubid
        WHERE s.relkind = 'S' AND t.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'kopecht')
    LOOP
        EXECUTE 'SELECT MAX(' || quote_ident(seq_record.column_name) || ') FROM kopecht.' || quote_ident(seq_record.table_name)
        INTO max_id;

        IF max_id IS NULL THEN
            max_id := 1;
        ELSE
            max_id := max_id + 1;
        END IF;

        sequence_name := 'kopecht.' || seq_record.sequence_name;

        EXECUTE 'SELECT setval(''' || sequence_name || ''', ' || max_id || ', false)';
    END LOOP;
END;
$$ LANGUAGE plpgsql;
