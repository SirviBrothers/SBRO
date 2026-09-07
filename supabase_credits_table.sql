-- ==============================================================================
-- SIRVI BROTHERS - SUPABASE 'credits' (CREDIT/DUE) DEDICATED TABLE MIGRATION
-- Run this script in your Supabase SQL Editor (Dashboard > SQL Editor > New Query > Run)
-- ==============================================================================

-- 0. Ensure required columns exist on source tables safely
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS due_date DATE;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS remarks TEXT;
ALTER TABLE public.purchases ADD COLUMN IF NOT EXISTS due_date DATE;
ALTER TABLE public.purchases ADD COLUMN IF NOT EXISTS remarks TEXT;

-- 1. Create the dedicated 'credits' table
CREATE TABLE IF NOT EXISTS public.credits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference_no TEXT UNIQUE,                -- Invoice Number (e.g. SB-26-09-00001) or Bill Number
    sale_id UUID,                            -- Associated sale ID (if credit originated from a sale)
    purchase_id UUID,                        -- Associated purchase ID (if credit originated from a purchase)
    type TEXT NOT NULL DEFAULT 'Sale',       -- 'Sale' or 'Purchase'
    party_name TEXT NOT NULL,                -- Customer Name or Vendor Name
    mobile TEXT,                             -- Contact Number
    address TEXT,                            -- Party Address
    date DATE NOT NULL DEFAULT CURRENT_DATE,  -- Date of transaction
    due_date DATE,                           -- Expected due date
    original_due NUMERIC(12, 2) NOT NULL DEFAULT 0.00,  -- Original due amount / bill amount
    current_due NUMERIC(12, 2) NOT NULL DEFAULT 0.00,   -- Current unpaid due amount
    status TEXT NOT NULL DEFAULT 'Pending',  -- 'Pending', 'Partial', 'Paid'
    remarks TEXT,                            -- Notes or remarks
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create performance indexes
CREATE INDEX IF NOT EXISTS idx_credits_reference_no ON public.credits(reference_no);
CREATE INDEX IF NOT EXISTS idx_credits_sale_id ON public.credits(sale_id);
CREATE INDEX IF NOT EXISTS idx_credits_purchase_id ON public.credits(purchase_id);
CREATE INDEX IF NOT EXISTS idx_credits_party_name ON public.credits(party_name);
CREATE INDEX IF NOT EXISTS idx_credits_mobile ON public.credits(mobile);
CREATE INDEX IF NOT EXISTS idx_credits_status ON public.credits(status);
CREATE INDEX IF NOT EXISTS idx_credits_date ON public.credits(date DESC);

-- 3. Row-Level Security (RLS) Configuration
ALTER TABLE public.credits ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users full access
DROP POLICY IF EXISTS "Allow authenticated full access on credits" ON public.credits;
CREATE POLICY "Allow authenticated full access on credits" 
    ON public.credits FOR ALL TO authenticated 
    USING (true) WITH CHECK (true);

-- Allow anon public access full access
DROP POLICY IF EXISTS "Allow anon full access on credits" ON public.credits;
CREATE POLICY "Allow anon full access on credits" 
    ON public.credits FOR ALL TO anon 
    USING (true) WITH CHECK (true);

-- 4. Initial Migration: Populate existing unpaid sales into the credits table
INSERT INTO public.credits (
    reference_no, sale_id, type, party_name, mobile, address, date, due_date, original_due, current_due, status, remarks
)
SELECT 
    s.invoice_no,
    s.id,
    'Sale',
    s.buyer_name,
    s.mobile,
    COALESCE(s.address, ''),
    s.date,
    COALESCE(
        (to_jsonb(s)->>'due_date')::DATE, 
        CASE 
            WHEN (to_jsonb(s)->>'remarks') ~ 'DueDate:[0-9]{4}-[0-9]{2}-[0-9]{2}' 
            THEN (SUBSTRING((to_jsonb(s)->>'remarks') FROM 'DueDate:([0-9]{4}-[0-9]{2}-[0-9]{2})'))::DATE 
            ELSE NULL 
        END,
        (s.date + INTERVAL '30 days')::DATE
    ),
    s.grand_total,
    COALESCE(s.balance, s.grand_total - COALESCE(s.received_amt, 0)),
    CASE 
        WHEN COALESCE(s.balance, s.grand_total - COALESCE(s.received_amt, 0)) <= 0 THEN 'Paid' 
        WHEN COALESCE(s.balance, s.grand_total - COALESCE(s.received_amt, 0)) < s.grand_total THEN 'Partial'
        ELSE 'Pending' 
    END,
    COALESCE(to_jsonb(s)->>'remarks', '')
FROM public.sales s
WHERE s.invoice_no IS NOT NULL 
  AND (COALESCE(s.balance, 0) > 0 OR s.payment_mode = 'Credit' OR (s.grand_total - COALESCE(s.received_amt, 0)) > 0)
ON CONFLICT (reference_no) DO UPDATE 
SET current_due = EXCLUDED.current_due,
    status = EXCLUDED.status,
    due_date = COALESCE(EXCLUDED.due_date, public.credits.due_date),
    updated_at = NOW();

-- 5. Initial Migration: Populate existing unpaid purchases into the credits table
INSERT INTO public.credits (
    reference_no, purchase_id, type, party_name, mobile, address, date, due_date, original_due, current_due, status, remarks
)
SELECT 
    p.bill_no,
    p.id,
    'Purchase',
    p.vendor_name,
    p.mobile,
    '',
    p.date,
    COALESCE(
        (to_jsonb(p)->>'due_date')::DATE,
        (p.date + INTERVAL '30 days')::DATE
    ),
    p.total_amount,
    COALESCE(p.balance, p.total_amount - COALESCE(p.paid_amount, 0)),
    CASE 
        WHEN COALESCE(p.balance, p.total_amount - COALESCE(p.paid_amount, 0)) <= 0 THEN 'Paid' 
        WHEN COALESCE(p.balance, p.total_amount - COALESCE(p.paid_amount, 0)) < p.total_amount THEN 'Partial'
        ELSE 'Pending' 
    END,
    COALESCE(to_jsonb(p)->>'remarks', '')
FROM public.purchases p
WHERE p.bill_no IS NOT NULL 
  AND (COALESCE(p.balance, 0) > 0 OR (p.total_amount - COALESCE(p.paid_amount, 0)) > 0)
ON CONFLICT (reference_no) DO UPDATE 
SET current_due = EXCLUDED.current_due,
    status = EXCLUDED.status,
    due_date = COALESCE(EXCLUDED.due_date, public.credits.due_date),
    updated_at = NOW();

-- 6. Verification query
SELECT count(*) as total_credits_recorded, 
       sum(current_due) as total_outstanding_due,
       count(CASE WHEN status = 'Pending' THEN 1 END) as pending_credits,
       count(CASE WHEN status = 'Paid' THEN 1 END) as paid_credits
FROM public.credits;
