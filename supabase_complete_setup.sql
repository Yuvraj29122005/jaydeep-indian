-- =========================================================================
-- JAYDEEP INDIAN GAS AGENCY - COMPLETE DATABASE SETUP & MIGRATION
-- Run this script in your Supabase Dashboard:
-- 1. Go to https://supabase.com/dashboard/project/yrimvbtojsblltdyrnyg
-- 2. Click "SQL Editor" on the left menu
-- 3. Click "New Query", paste this entire script, and click "RUN"
-- =========================================================================

-- 1. PERSONAL NOTES TABLE
CREATE TABLE IF NOT EXISTS public.personal_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  title TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  attachments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.personal_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access to personal_notes" ON public.personal_notes;
CREATE POLICY "Allow all access to personal_notes" ON public.personal_notes
  FOR ALL USING (true) WITH CHECK (true);

-- 2. MARKET PRICES TABLE
CREATE TABLE IF NOT EXISTS public.market_prices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  prices JSONB NOT NULL DEFAULT '{"5kg": 500, "19kg": 1000, "47.5kg": 2300}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by TEXT DEFAULT 'Admin'
);

ALTER TABLE public.market_prices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access to market_prices" ON public.market_prices;
CREATE POLICY "Allow all access to market_prices" ON public.market_prices
  FOR ALL USING (true) WITH CHECK (true);

INSERT INTO public.market_prices (prices, updated_by)
SELECT '{"5kg": 500, "19kg": 1000, "47.5kg": 2300}'::jsonb, 'Admin'
WHERE NOT EXISTS (SELECT 1 FROM public.market_prices);

-- 3. APP USERS & ROLES TABLE
CREATE TABLE IF NOT EXISTS public.app_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'staff',
  permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access to app_users" ON public.app_users;
CREATE POLICY "Allow all access to app_users" ON public.app_users
  FOR ALL USING (true) WITH CHECK (true);

-- 4. STORAGE BUCKET FOR NOTE ATTACHMENTS
INSERT INTO storage.buckets (id, name, public)
VALUES ('note-attachments', 'note-attachments', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public read access for note-attachments" ON storage.objects;
CREATE POLICY "Public read access for note-attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'note-attachments');

DROP POLICY IF EXISTS "Allow uploads to note-attachments" ON storage.objects;
CREATE POLICY "Allow uploads to note-attachments"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'note-attachments');

DROP POLICY IF EXISTS "Allow deletes from note-attachments" ON storage.objects;
CREATE POLICY "Allow deletes from note-attachments"
ON storage.objects FOR DELETE
USING (bucket_id = 'note-attachments');

-- 5. AGENCY SETTINGS & INVOICE CONFIG TABLE
CREATE TABLE IF NOT EXISTS public.agency_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_name TEXT NOT NULL DEFAULT 'Jaydeep Indian Gas Agency',
  company_name TEXT NOT NULL DEFAULT 'Jaydeep Indian Gas Agency',
  tagline TEXT DEFAULT 'Authorized Indane LPG Distributor',
  gstin TEXT DEFAULT '24ABCDE1234F1Z5',
  pan_number TEXT DEFAULT 'ABCDE1234F',
  phone TEXT DEFAULT '9876543210',
  alternate_phone TEXT DEFAULT '9876543211',
  email TEXT DEFAULT 'jaydeepindian01@gmail.com',
  website TEXT DEFAULT '',
  address TEXT DEFAULT 'Plot No. 12, GIDC Industrial Estate, Sachin',
  city TEXT DEFAULT 'Surat',
  state TEXT DEFAULT 'Gujarat',
  pincode TEXT DEFAULT '394230',
  bank_name TEXT DEFAULT 'State Bank of India',
  account_holder TEXT DEFAULT 'Jaydeep Indian Gas Agency',
  account_number TEXT DEFAULT '123456789012',
  ifsc_code TEXT DEFAULT 'SBIN0001234',
  branch TEXT DEFAULT 'Sachin GIDC Branch',
  upi_id TEXT DEFAULT 'jaydeepgas@upi',
  invoice_prefix TEXT DEFAULT 'JIG',
  empty_bottle_prefix TEXT DEFAULT 'EB',
  invoice_terms TEXT DEFAULT '1. Goods once sold will not be taken back.
2. Gas cylinders must be stored upright in a well-ventilated area away from heat sources.
3. Check cylinder seal and weight at the time of delivery.
4. Subject to Surat jurisdiction only.',
  invoice_footer_note TEXT DEFAULT 'Thank you for your business! For emergency leak support, contact helpline immediately.',
  signatory_title TEXT DEFAULT 'Authorized Signatory',
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by TEXT DEFAULT 'Admin'
);

ALTER TABLE public.agency_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access to agency_settings" ON public.agency_settings;
CREATE POLICY "Allow all access to agency_settings" ON public.agency_settings
  FOR ALL USING (true) WITH CHECK (true);

INSERT INTO public.agency_settings (
  agency_name, company_name, tagline, gstin, pan_number, phone, alternate_phone,
  email, address, city, state, pincode, bank_name, account_holder, account_number,
  ifsc_code, branch, upi_id, invoice_prefix, empty_bottle_prefix,
  invoice_terms, invoice_footer_note, signatory_title, updated_by
)
SELECT
  'Jaydeep Indian Gas Agency',
  'Jaydeep Indian Gas Agency',
  'Authorized Indane LPG Distributor',
  '24ABCDE1234F1Z5',
  'ABCDE1234F',
  '9876543210',
  '9876543211',
  'jaydeepindian01@gmail.com',
  'Plot No. 12, GIDC Industrial Estate, Sachin',
  'Surat',
  'Gujarat',
  '394230',
  'State Bank of India',
  'Jaydeep Indian Gas Agency',
  '123456789012',
  'SBIN0001234',
  'Sachin GIDC Branch',
  'jaydeepgas@upi',
  'JIG',
  'EB',
  '1. Goods once sold will not be taken back.' || E'\n' || '2. Gas cylinders must be stored upright in a well-ventilated area away from heat sources.' || E'\n' || '3. Check cylinder seal and weight at the time of delivery.' || E'\n' || '4. Subject to Surat jurisdiction only.',
  'Thank you for your business! For emergency leak support, contact helpline immediately.',
  'Authorized Signatory',
  'Admin'
WHERE NOT EXISTS (SELECT 1 FROM public.agency_settings);

-- 6. INVOICE TABLE MIGRATION - Add invoice_type and market_prices_snapshot columns
-- These are safe to run multiple times (IF NOT EXISTS / DO NOTHING pattern)
DO $$
BEGIN
  -- Add invoice_type column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'invoices' AND column_name = 'invoice_type'
  ) THEN
    ALTER TABLE public.invoices ADD COLUMN invoice_type TEXT DEFAULT 'Standard';
  END IF;

  -- Add market_prices_snapshot column if it doesn't exist  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'invoices' AND column_name = 'market_prices_snapshot'
  ) THEN
    ALTER TABLE public.invoices ADD COLUMN market_prices_snapshot JSONB DEFAULT NULL;
  END IF;
END $$;

-- Backfill invoice_type for existing invoices that have [Type: Empty Bottle] in notes
UPDATE public.invoices
SET invoice_type = 'Empty Bottle'
WHERE invoice_type IS NULL OR invoice_type = 'Standard'
  AND (notes ILIKE '%[Type: Empty Bottle]%' OR items::text ILIKE '%"itemType":"empty"%');

-- 7. WAREHOUSE STOCK INVENTORY TABLE
CREATE TABLE IF NOT EXISTS public.stock (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cylinder_type TEXT UNIQUE NOT NULL,
  filled_count INTEGER NOT NULL DEFAULT 0,
  empty_count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.stock ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access to stock" ON public.stock;
CREATE POLICY "Allow all access to stock" ON public.stock
  FOR ALL USING (true) WITH CHECK (true);

INSERT INTO public.stock (cylinder_type, filled_count, empty_count)
VALUES 
  ('5kg', 50, 20),
  ('19kg', 150, 60),
  ('47.5kg', 40, 15)
ON CONFLICT (cylinder_type) DO NOTHING;

-- 8. UNIVERSAL RLS POLICIES FOR ALL CORE TABLES
-- Ensures the web application has seamless, unrestricted read/write permissions for all 9 tables
DO $$
BEGIN
  -- Customers
  EXECUTE 'ALTER TABLE IF EXISTS public.customers ENABLE ROW LEVEL SECURITY';
  EXECUTE 'DROP POLICY IF EXISTS "Allow all access to customers" ON public.customers';
  EXECUTE 'CREATE POLICY "Allow all access to customers" ON public.customers FOR ALL USING (true) WITH CHECK (true)';

  -- Invoices
  EXECUTE 'ALTER TABLE IF EXISTS public.invoices ENABLE ROW LEVEL SECURITY';
  EXECUTE 'DROP POLICY IF EXISTS "Allow all access to invoices" ON public.invoices';
  EXECUTE 'CREATE POLICY "Allow all access to invoices" ON public.invoices FOR ALL USING (true) WITH CHECK (true)';

  -- Expenses
  EXECUTE 'ALTER TABLE IF EXISTS public.expenses ENABLE ROW LEVEL SECURITY';
  EXECUTE 'DROP POLICY IF EXISTS "Allow all access to expenses" ON public.expenses';
  EXECUTE 'CREATE POLICY "Allow all access to expenses" ON public.expenses FOR ALL USING (true) WITH CHECK (true)';

  -- Refill Trips
  EXECUTE 'ALTER TABLE IF EXISTS public.refill_trips ENABLE ROW LEVEL SECURITY';
  EXECUTE 'DROP POLICY IF EXISTS "Allow all access to refill_trips" ON public.refill_trips';
  EXECUTE 'CREATE POLICY "Allow all access to refill_trips" ON public.refill_trips FOR ALL USING (true) WITH CHECK (true)';
END $$;
