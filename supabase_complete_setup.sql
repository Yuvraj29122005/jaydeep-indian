-- =========================================================================
-- COMPLETE MULTI-AGENCY SUPABASE SETUP SCRIPT
-- Agencies Supported:
--   1. Jaydeep Indian Gas Agency (ID: 'jaydeep')
--   2. Aegis Gas Agency (ID: 'aegis')
--
-- How to apply this in Supabase:
-- 1. Open Supabase Dashboard -> Project -> SQL Editor
-- 2. Click "New Query", paste this entire SQL script, and click "Run" (▶)
-- =========================================================================

-- 1. CUSTOMERS TABLE
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id TEXT NOT NULL DEFAULT 'jaydeep',
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  gstin TEXT,
  consumer_number TEXT,
  customer_type TEXT DEFAULT 'commercial',
  prices JSONB DEFAULT '{"5kg": 500, "19kg": 1000, "47.5kg": 2300}'::jsonb,
  discounts JSONB DEFAULT '{"5kg": 0, "19kg": 0, "47.5kg": 0}'::jsonb,
  discount_amounts JSONB DEFAULT '{"5kg": 0, "19kg": 0, "47.5kg": 0}'::jsonb,
  bottle_balance JSONB DEFAULT '{"5kg":{"filledGiven":0,"emptyCollected":0},"19kg":{"filledGiven":0,"emptyCollected":0},"47.5kg":{"filledGiven":0,"emptyCollected":0}}'::jsonb,
  empty_bottle_stock JSONB DEFAULT '{"5kg":{"withCustomer":0,"collected":0},"19kg":{"withCustomer":0,"collected":0},"47.5kg":{"withCustomer":0,"collected":0}}'::jsonb,
  nc_bottles JSONB DEFAULT '{"5kg": 0, "19kg": 0, "47.5kg": 0}'::jsonb,
  deposit_balance NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'customers' AND column_name = 'agency_id') THEN
    ALTER TABLE public.customers ADD COLUMN agency_id TEXT NOT NULL DEFAULT 'jaydeep';
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_customers_agency_id ON public.customers(agency_id);

-- 2. INVOICES TABLE
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id TEXT NOT NULL DEFAULT 'jaydeep',
  invoice_number TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  customer_name TEXT,
  customer_phone TEXT,
  customer_address TEXT,
  customer_gstin TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  discount_total NUMERIC NOT NULL DEFAULT 0,
  cgst NUMERIC NOT NULL DEFAULT 0,
  sgst NUMERIC NOT NULL DEFAULT 0,
  grand_total NUMERIC NOT NULL DEFAULT 0,
  payment_status TEXT NOT NULL DEFAULT 'Unpaid',
  payment_method TEXT DEFAULT 'Cash',
  invoice_type TEXT DEFAULT 'Standard',
  market_prices_snapshot JSONB DEFAULT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'invoices' AND column_name = 'agency_id') THEN
    ALTER TABLE public.invoices ADD COLUMN agency_id TEXT NOT NULL DEFAULT 'jaydeep';
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_invoices_agency_id ON public.invoices(agency_id);

-- 3. EXPENSES TABLE
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id TEXT NOT NULL DEFAULT 'jaydeep',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  category TEXT NOT NULL,
  description TEXT,
  amount NUMERIC NOT NULL DEFAULT 0,
  payment_method TEXT DEFAULT 'Cash',
  receipt_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'expenses' AND column_name = 'agency_id') THEN
    ALTER TABLE public.expenses ADD COLUMN agency_id TEXT NOT NULL DEFAULT 'jaydeep';
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_expenses_agency_id ON public.expenses(agency_id);

-- 4. REFILL TRIPS TABLE
CREATE TABLE IF NOT EXISTS public.refill_trips (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id TEXT NOT NULL DEFAULT 'jaydeep',
  date_sent TIMESTAMPTZ NOT NULL DEFAULT now(),
  date_returned TIMESTAMPTZ,
  cylinder_type TEXT NOT NULL,
  empty_sent_count INTEGER NOT NULL DEFAULT 0,
  filled_returned_count INTEGER DEFAULT 0,
  plant_name TEXT DEFAULT 'Indane Bottling Plant',
  vehicle_number TEXT,
  driver_name TEXT,
  status TEXT NOT NULL DEFAULT 'Sent',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'refill_trips' AND column_name = 'agency_id') THEN
    ALTER TABLE public.refill_trips ADD COLUMN agency_id TEXT NOT NULL DEFAULT 'jaydeep';
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_refill_trips_agency_id ON public.refill_trips(agency_id);

-- 5. PERSONAL NOTES TABLE
CREATE TABLE IF NOT EXISTS public.personal_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id TEXT NOT NULL DEFAULT 'jaydeep',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  title TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  attachments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'personal_notes' AND column_name = 'agency_id') THEN
    ALTER TABLE public.personal_notes ADD COLUMN agency_id TEXT NOT NULL DEFAULT 'jaydeep';
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_personal_notes_agency_id ON public.personal_notes(agency_id);

-- 6. MARKET PRICES TABLE
CREATE TABLE IF NOT EXISTS public.market_prices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id TEXT NOT NULL DEFAULT 'jaydeep',
  prices JSONB NOT NULL DEFAULT '{"5kg": 500, "19kg": 1000, "47.5kg": 2300}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by TEXT DEFAULT 'Admin'
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'market_prices' AND column_name = 'agency_id') THEN
    ALTER TABLE public.market_prices ADD COLUMN agency_id TEXT NOT NULL DEFAULT 'jaydeep';
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_market_prices_agency_id ON public.market_prices(agency_id);

-- Seed market prices for both agencies
INSERT INTO public.market_prices (agency_id, prices, updated_by)
SELECT 'jaydeep', '{"5kg": 500, "19kg": 1000, "47.5kg": 2300}'::jsonb, 'Admin'
WHERE NOT EXISTS (SELECT 1 FROM public.market_prices WHERE agency_id = 'jaydeep');

INSERT INTO public.market_prices (agency_id, prices, updated_by)
SELECT 'aegis', '{"5kg": 500, "19kg": 1000, "47.5kg": 2300}'::jsonb, 'Admin'
WHERE NOT EXISTS (SELECT 1 FROM public.market_prices WHERE agency_id = 'aegis');

-- 7. STOCK WAREHOUSE TABLE (Multi-Agency with Composite Unique Key)
CREATE TABLE IF NOT EXISTS public.stock (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id TEXT NOT NULL DEFAULT 'jaydeep',
  cylinder_type TEXT NOT NULL,
  filled_count INTEGER NOT NULL DEFAULT 0,
  empty_count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'stock' AND column_name = 'agency_id') THEN
    ALTER TABLE public.stock ADD COLUMN agency_id TEXT NOT NULL DEFAULT 'jaydeep';
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'stock_cylinder_type_key') THEN
    ALTER TABLE public.stock DROP CONSTRAINT stock_cylinder_type_key;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'stock_agency_cylinder_unique') THEN
    ALTER TABLE public.stock ADD CONSTRAINT stock_agency_cylinder_unique UNIQUE (agency_id, cylinder_type);
  END IF;
END $$;

-- Seed Jaydeep Stock
INSERT INTO public.stock (agency_id, cylinder_type, filled_count, empty_count)
VALUES 
  ('jaydeep', '5kg', 50, 20),
  ('jaydeep', '19kg', 150, 60),
  ('jaydeep', '47.5kg', 40, 15)
ON CONFLICT (agency_id, cylinder_type) DO NOTHING;

-- Seed Aegis Stock
INSERT INTO public.stock (agency_id, cylinder_type, filled_count, empty_count)
VALUES 
  ('aegis', '5kg', 50, 20),
  ('aegis', '19kg', 150, 60),
  ('aegis', '47.5kg', 40, 15)
ON CONFLICT (agency_id, cylinder_type) DO NOTHING;

-- 8. AGENCY SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.agency_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id TEXT NOT NULL DEFAULT 'jaydeep',
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

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'agency_settings' AND column_name = 'agency_id') THEN
    ALTER TABLE public.agency_settings ADD COLUMN agency_id TEXT NOT NULL DEFAULT 'jaydeep';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'agency_settings_agency_id_unique') THEN
    ALTER TABLE public.agency_settings ADD CONSTRAINT agency_settings_agency_id_unique UNIQUE (agency_id);
  END IF;
END $$;

-- Seed Jaydeep settings
INSERT INTO public.agency_settings (
  agency_id, agency_name, company_name, tagline, gstin, pan_number, phone, alternate_phone,
  email, address, city, state, pincode, bank_name, account_holder, account_number,
  ifsc_code, branch, upi_id, invoice_prefix, empty_bottle_prefix,
  invoice_terms, invoice_footer_note, signatory_title, updated_by
)
VALUES (
  'jaydeep',
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
  '1. Goods once sold will not be taken back.' || E'\n' ||
  '2. Gas cylinders must be stored upright in a well-ventilated area away from heat sources.' || E'\n' ||
  '3. Check cylinder seal and weight at the time of delivery.' || E'\n' ||
  '4. Subject to Surat jurisdiction only.',
  'Thank you for your business! For emergency leak support, contact helpline immediately.',
  'Authorized Signatory',
  'Admin'
)
ON CONFLICT (agency_id) DO NOTHING;

-- Seed Aegis settings
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

-- 9. APP USERS TABLE
CREATE TABLE IF NOT EXISTS public.app_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id TEXT NOT NULL DEFAULT 'all',
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'staff',
  permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'app_users' AND column_name = 'agency_id') THEN
    ALTER TABLE public.app_users ADD COLUMN agency_id TEXT NOT NULL DEFAULT 'all';
  END IF;
END $$;

-- 10. STORAGE BUCKET FOR NOTE ATTACHMENTS
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

-- 11. UNIVERSAL ROW LEVEL SECURITY (RLS) POLICIES
DO $$ BEGIN
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
