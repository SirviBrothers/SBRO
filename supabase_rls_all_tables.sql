-- ==============================================================================
-- SIRVI BROTHERS - SUPABASE ROW LEVEL SECURITY (RLS) FOR ALL TABLES
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New Query > Run)
-- Ensures RLS is enabled ON all 8 tables with authenticated & anon full access
-- ==============================================================================

DO $$
DECLARE
    tbl text;
BEGIN
    FOR tbl IN 
        SELECT unnest(ARRAY[
            'parties', 
            'inventory', 
            'sales', 
            'sale_items', 
            'purchases', 
            'purchase_items', 
            'credit_payments',
            'credits'
        ])
    LOOP
        -- 1. Ensure table exists before modifying
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = tbl) THEN
            -- 2. Enable Row Level Security (RLS)
            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);
            
            -- 3. Policy for authenticated users (logged-in session)
            EXECUTE format('DROP POLICY IF EXISTS "Allow authenticated full access on %s" ON public.%I;', tbl, tbl);
            EXECUTE format('DROP POLICY IF EXISTS "Allow authenticated full access" ON public.%I;', tbl);
            EXECUTE format('CREATE POLICY "Allow authenticated full access on %s" ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true);', tbl, tbl);
            
            -- 4. Policy for anon users (public API key)
            EXECUTE format('DROP POLICY IF EXISTS "Allow anon full access on %s" ON public.%I;', tbl, tbl);
            EXECUTE format('DROP POLICY IF EXISTS "Allow anon full access" ON public.%I;', tbl);
            EXECUTE format('CREATE POLICY "Allow anon full access on %s" ON public.%I FOR ALL TO anon USING (true) WITH CHECK (true);', tbl, tbl);
            
            RAISE NOTICE 'RLS enabled and configured for table: %', tbl;
        ELSE
            RAISE NOTICE 'Table % does not exist, skipping.', tbl;
        END IF;
    END LOOP;
END $$;

-- 5. Verification Query: Confirm all tables have RLS enabled (rowsecurity = true)
SELECT tablename, 
       rowsecurity AS rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('parties', 'inventory', 'sales', 'sale_items', 'purchases', 'purchase_items', 'credit_payments', 'credits')
ORDER BY tablename;
