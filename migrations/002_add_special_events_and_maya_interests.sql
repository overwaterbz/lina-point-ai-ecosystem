-- Migration: add special_events (jsonb) and maya_interests (text[]) to profiles
-- Safe ALTER TABLE statements using IF NOT EXISTS to avoid errors if columns already exist
-- This migration is non-destructive: it only adds columns with safe defaults.

-- 1) Add columns
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS special_events jsonb DEFAULT '[]'::jsonb;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS maya_interests text[] DEFAULT '{}'::text[];

-- (Optional) ensure opt_in_magic exists (previous migration may have added it)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS opt_in_magic boolean DEFAULT false;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS magic_profile text;

-- 2) Row Level Security (RLS) setup and example policies
-- Enable RLS for stronger security (only if not already enabled)
-- Note: if RLS is already enabled, the ENABLE statement is a no-op.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy: allow authenticated users to SELECT their own profile
-- Uses auth.uid() (Supabase Postgres function) to get the current user's id
CREATE POLICY IF NOT EXISTS "Profiles: allow select for owner"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: allow authenticated users to UPDATE their own profile
CREATE POLICY IF NOT EXISTS "Profiles: allow update for owner"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: allow authenticated users to INSERT a profile for themselves
-- The WITH CHECK expression ensures the inserted row's user_id matches auth.uid()
CREATE POLICY IF NOT EXISTS "Profiles: allow insert for authenticated"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = NEW.user_id);

-- Optional: revoke public insert privilege if you want to ensure only authenticated inserts via policies
-- REVOKE INSERT ON public.profiles FROM PUBLIC;

-- 3) Verify
-- After running this migration, check the table schema and policies in the Supabase Dashboard
-- Example verification queries:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'profiles';
-- SELECT * FROM pg_policy WHERE polrelid = 'public.profiles'::regclass;

-- End of migration
