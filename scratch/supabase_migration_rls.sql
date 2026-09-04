-- ==============================================================================
-- SIRVI BROTHERS - SUPABASE COMPLETE DATABASE MIGRATION & RLS POLICIES
-- Run this script once in your Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- ==============================================================================

-- 1. Create credit_payments table for tracking partial & full payments
CREATE TABLE IF NOT EXISTS public.credit_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    credit_id UUID NOT NULL,
    reference_no TEXT, -- Invoice No or Bill No
    party_name TEXT NOT NULL,
    party_type TEXT DEFAULT 'Customer', -- 'Customer' or 'Vendor'
    amount NUMERIC(12, 2) NOT NULL,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_mode TEXT DEFAULT 'Cash', -- 'Cash', 'UPI', 'Bank Transfer', 'Cheque'
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_credit_payments_credit_id ON public.credit_payments(credit_id);
CREATE INDEX IF NOT EXISTS idx_credit_payments_party_name ON public.credit_payments(party_name);

-- 2. Ensure purchases table allows auto bill numbers and has remarks & due_date
ALTER TABLE public.purchases ALTER COLUMN bill_no DROP NOT NULL;
ALTER TABLE public.purchases ADD COLUMN IF NOT EXISTS remarks TEXT;
ALTER TABLE public.purchases ADD COLUMN IF NOT EXISTS due_date DATE;
ALTER TABLE public.purchases ADD COLUMN IF NOT EXISTS gstn TEXT;

-- 3. Ensure sales table has due_date
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS due_date DATE;

-- 4. Ensure inventory table has hsn column
ALTER TABLE public.inventory ADD COLUMN IF NOT EXISTS hsn TEXT;

-- 5. Row-Level Security (RLS) Configuration
-- Enable RLS on all 7 application tables and grant full access to authenticated and anon users
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
            'credit_payments'
        ])
    LOOP
        -- Enable RLS
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);
        
        -- Policy for authenticated users (logged in via Google OAuth)
        EXECUTE format('DROP POLICY IF EXISTS "Allow authenticated full access" ON public.%I;', tbl);
        EXECUTE format('CREATE POLICY "Allow authenticated full access" ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true);', tbl);
        
        -- Policy for anon users (allows front-end API keys to function smoothly)
        EXECUTE format('DROP POLICY IF EXISTS "Allow anon full access" ON public.%I;', tbl);
        EXECUTE format('CREATE POLICY "Allow anon full access" ON public.%I FOR ALL TO anon USING (true) WITH CHECK (true);', tbl);
    END LOOP;
END $$;

-- Verify setup
SELECT table_name, is_insertable_into 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('parties', 'inventory', 'sales', 'sale_items', 'purchases', 'purchase_items', 'credit_payments');
