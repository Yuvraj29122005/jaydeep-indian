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
