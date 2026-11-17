DO $$
DECLARE
  f record;
BEGIN
  FOR f IN
    SELECT n.nspname, p.proname, oidvectortypes(p.proargtypes) AS argtypes
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname LIKE 'osusu\_%' ESCAPE '\'
  LOOP
    EXECUTE format('DROP FUNCTION %I.%I(%s) CASCADE', f.nspname, f.proname, f.argtypes);
  END LOOP;
END
$$;

DROP SCHEMA IF EXISTS osusu CASCADE;
