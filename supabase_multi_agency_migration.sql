-- =========================================================================
-- MULTI-AGENCY DATABASE MIGRATION SCRIPT
-- Support for:
--   1. Jaydeep Indian Gas Agency (ID: 'jaydeep')
--   2. Aegis Gas Agency (ID: 'aegis')
--
-- How to apply this migration in Supabase:
-- 1. Open your Supabase Dashboard: https://supabase.com/dashboard/project/yrimvbtojsblltdyrnyg
-- 2. Click "SQL Editor" on the left navigation bar
-- 3. Click "New Query", paste this entire SQL script, and click "Run" (▶)
-- =========================================================================

-- 1. CUSTOMERS TABLE: ADD agency_id AND INDEX
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'customers' AND column_name = 'agency_id'
  ) THEN
    ALTER TABLE public.customers ADD COLUMN agency_id TEXT NOT NULL DEFAULT 'jaydeep';
  END IF;
END $$;

UPDATE public.customers
SET agency_id = 'jaydeep'
WHERE agency_id IS NULL OR agency_id = '';

CREATE INDEX IF NOT EXISTS idx_customers_agency_id ON public.customers(agency_id);

-- 2. INVOICES TABLE: ADD agency_id AND INDEX
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'invoices' AND column_name = 'agency_id'
  ) THEN
    ALTER TABLE public.invoices ADD COLUMN agency_id TEXT NOT NULL DEFAULT 'jaydeep';
  END IF;
END $$;

UPDATE public.invoices
SET agency_id = 'jaydeep'
WHERE agency_id IS NULL OR agency_id = '';

CREATE INDEX IF NOT EXISTS idx_invoices_agency_id ON public.invoices(agency_id);

-- 3. EXPENSES TABLE: ADD agency_id AND INDEX
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'expenses' AND column_name = 'agency_id'
  ) THEN
    ALTER TABLE public.expenses ADD COLUMN agency_id TEXT NOT NULL DEFAULT 'jaydeep';
  END IF;
END $$;

UPDATE public.expenses
SET agency_id = 'jaydeep'
WHERE agency_id IS NULL OR agency_id = '';

CREATE INDEX IF NOT EXISTS idx_expenses_agency_id ON public.expenses(agency_id);

-- 4. REFILL TRIPS TABLE: ADD agency_id AND INDEX
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'refill_trips' AND column_name = 'agency_id'
  ) THEN
    ALTER TABLE public.refill_trips ADD COLUMN agency_id TEXT NOT NULL DEFAULT 'jaydeep';
  END IF;
END $$;

UPDATE public.refill_trips
SET agency_id = 'jaydeep'
WHERE agency_id IS NULL OR agency_id = '';

CREATE INDEX IF NOT EXISTS idx_refill_trips_agency_id ON public.refill_trips(agency_id);

-- 5. PERSONAL NOTES TABLE: ADD agency_id AND INDEX
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'personal_notes' AND column_name = 'agency_id'
  ) THEN
    ALTER TABLE public.personal_notes ADD COLUMN agency_id TEXT NOT NULL DEFAULT 'jaydeep';
  END IF;
END $$;

UPDATE public.personal_notes
SET agency_id = 'jaydeep'
WHERE agency_id IS NULL OR agency_id = '';

CREATE INDEX IF NOT EXISTS idx_personal_notes_agency_id ON public.personal_notes(agency_id);

-- 6. MARKET PRICES TABLE: ADD agency_id AND SEED AEGIS
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'market_prices' AND column_name = 'agency_id'
  ) THEN
    ALTER TABLE public.market_prices ADD COLUMN agency_id TEXT NOT NULL DEFAULT 'jaydeep';
  END IF;
END $$;

UPDATE public.market_prices
SET agency_id = 'jaydeep'
WHERE agency_id IS NULL OR agency_id = '';

CREATE INDEX IF NOT EXISTS idx_market_prices_agency_id ON public.market_prices(agency_id);

-- Seed default market prices for Aegis Gas Agency if not present
INSERT INTO public.market_prices (agency_id, prices, updated_by)
SELECT 'aegis', '{"5kg": 500, "19kg": 1000, "47.5kg": 2300}'::jsonb, 'Admin'
WHERE NOT EXISTS (SELECT 1 FROM public.market_prices WHERE agency_id = 'aegis');

-- 7. STOCK WAREHOUSE TABLE: SUPPORT MULTI-AGENCY
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'stock' AND column_name = 'agency_id'
  ) THEN
    ALTER TABLE public.stock ADD COLUMN agency_id TEXT NOT NULL DEFAULT 'jaydeep';
  END IF;
END $$;

UPDATE public.stock
SET agency_id = 'jaydeep'
WHERE agency_id IS NULL OR agency_id = '';

-- Drop legacy unique constraint on cylinder_type alone if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'stock_cylinder_type_key'
  ) THEN
    ALTER TABLE public.stock DROP CONSTRAINT stock_cylinder_type_key;
  END IF;
END $$;

-- Add compound unique constraint (agency_id, cylinder_type)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'stock_agency_cylinder_unique'
  ) THEN
    ALTER TABLE public.stock ADD CONSTRAINT stock_agency_cylinder_unique UNIQUE (agency_id, cylinder_type);
  END IF;
END $$;

-- Seed default initial stock warehouse for Aegis Gas Agency
INSERT INTO public.stock (agency_id, cylinder_type, filled_count, empty_count)
VALUES 
  ('aegis', '5kg', 50, 20),
  ('aegis', '19kg', 150, 60),
  ('aegis', '47.5kg', 40, 15)
ON CONFLICT (agency_id, cylinder_type) DO NOTHING;

-- 8. AGENCY SETTINGS TABLE: MULTI-AGENCY PROFILES
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'agency_settings' AND column_name = 'agency_id'
  ) THEN
    ALTER TABLE public.agency_settings ADD COLUMN agency_id TEXT NOT NULL DEFAULT 'jaydeep';
  END IF;
END $$;

UPDATE public.agency_settings
SET agency_id = 'jaydeep'
WHERE agency_id IS NULL OR agency_id = '';

-- Add unique constraint on agency_settings(agency_id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'agency_settings_agency_id_unique'
  ) THEN
    ALTER TABLE public.agency_settings ADD CONSTRAINT agency_settings_agency_id_unique UNIQUE (agency_id);
  END IF;
END $$;

-- Insert default Aegis Gas Agency profile
INSERT INTO public.agency_settings (
  agency_id, agency_name, company_name, tagline, gstin, pan_number, phone, alternate_phone,
  email, address, city, state, pincode, bank_name, account_holder, account_number,
  ifsc_code, branch, upi_id, invoice_prefix, empty_bottle_prefix,
  invoice_terms, invoice_footer_note, signatory_title, updated_by
)
VALUES (
  'aegis',
  'Aegis Gas Agency',
  'Aegis Gas Agency',
  'Authorized LPG Commercial & Domestic Distributor',
  '24AABCA1234F1Z2',
  'AABCA1234F',
  '9825123456',
  '9825123457',
  'aegisgasagency@gmail.com',
  'Shop No. 5-6, Shreenathji Complex, Ring Road',
  'Surat',
  'Gujarat',
  '395002',
  'HDFC Bank',
  'Aegis Gas Agency',
  '50200012345678',
  'HDFC0000256',
  'Ring Road Branch',
  'aegisgas@upi',
  'AGA',
  'AEB',
  '1. Goods once sold will not be taken back.' || E'\n' ||
  '2. Gas cylinders must be stored upright in a well-ventilated area away from heat sources.' || E'\n' ||
  '3. Check cylinder seal and weight at the time of delivery.' || E'\n' ||
  '4. Subject to Surat jurisdiction only.',
  'Thank you for choosing Aegis Gas Agency! For safe delivery & emergency support call helpline.',
  'Authorized Signatory',
  'Admin'
)
ON CONFLICT (agency_id) DO NOTHING;

-- 9. APP USERS: ADD agency_id COLUMN (DEFAULT 'all' ACCESS)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'app_users' AND column_name = 'agency_id'
  ) THEN
    ALTER TABLE public.app_users ADD COLUMN agency_id TEXT NOT NULL DEFAULT 'all';
  END IF;
END $$;

-- 10. RE-ASSERT UNIVERSAL ROW LEVEL SECURITY (RLS) POLICIES
DO $$
BEGIN
  EXECUTE 'ALTER TABLE IF EXISTS public.customers ENABLE ROW LEVEL SECURITY';
  EXECUTE 'DROP POLICY IF EXISTS "Allow all access to customers" ON public.customers';
  EXECUTE 'CREATE POLICY "Allow all access to customers" ON public.customers FOR ALL USING (true) WITH CHECK (true)';

  EXECUTE 'ALTER TABLE IF EXISTS public.invoices ENABLE ROW LEVEL SECURITY';
  EXECUTE 'DROP POLICY IF EXISTS "Allow all access to invoices" ON public.invoices';
  EXECUTE 'CREATE POLICY "Allow all access to invoices" ON public.invoices FOR ALL USING (true) WITH CHECK (true)';

  EXECUTE 'ALTER TABLE IF EXISTS public.stock ENABLE ROW LEVEL SECURITY';
  EXECUTE 'DROP POLICY IF EXISTS "Allow all access to stock" ON public.stock';
  EXECUTE 'CREATE POLICY "Allow all access to stock" ON public.stock FOR ALL USING (true) WITH CHECK (true)';

  EXECUTE 'ALTER TABLE IF EXISTS public.expenses ENABLE ROW LEVEL SECURITY';
  EXECUTE 'DROP POLICY IF EXISTS "Allow all access to expenses" ON public.expenses';
  EXECUTE 'CREATE POLICY "Allow all access to expenses" ON public.expenses FOR ALL USING (true) WITH CHECK (true)';

  EXECUTE 'ALTER TABLE IF EXISTS public.refill_trips ENABLE ROW LEVEL SECURITY';
  EXECUTE 'DROP POLICY IF EXISTS "Allow all access to refill_trips" ON public.refill_trips';
  EXECUTE 'CREATE POLICY "Allow all access to refill_trips" ON public.refill_trips FOR ALL USING (true) WITH CHECK (true)';

  EXECUTE 'ALTER TABLE IF EXISTS public.personal_notes ENABLE ROW LEVEL SECURITY';
  EXECUTE 'DROP POLICY IF EXISTS "Allow all access to personal_notes" ON public.personal_notes';
  EXECUTE 'CREATE POLICY "Allow all access to personal_notes" ON public.personal_notes FOR ALL USING (true) WITH CHECK (true)';

  EXECUTE 'ALTER TABLE IF EXISTS public.market_prices ENABLE ROW LEVEL SECURITY';
  EXECUTE 'DROP POLICY IF EXISTS "Allow all access to market_prices" ON public.market_prices';
  EXECUTE 'CREATE POLICY "Allow all access to market_prices" ON public.market_prices FOR ALL USING (true) WITH CHECK (true)';

  EXECUTE 'ALTER TABLE IF EXISTS public.agency_settings ENABLE ROW LEVEL SECURITY';
  EXECUTE 'DROP POLICY IF EXISTS "Allow all access to agency_settings" ON public.agency_settings';
  EXECUTE 'CREATE POLICY "Allow all access to agency_settings" ON public.agency_settings FOR ALL USING (true) WITH CHECK (true)';

  EXECUTE 'ALTER TABLE IF EXISTS public.app_users ENABLE ROW LEVEL SECURITY';
  EXECUTE 'DROP POLICY IF EXISTS "Allow all access to app_users" ON public.app_users';
  EXECUTE 'CREATE POLICY "Allow all access to app_users" ON public.app_users FOR ALL USING (true) WITH CHECK (true)';
END $$;
