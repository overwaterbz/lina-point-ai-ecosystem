-- Migration: add opt_in_magic boolean column to profiles (if missing)
-- Run in Supabase SQL editor or psql against your DB

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS opt_in_magic boolean DEFAULT false;

-- Optional: add magic_profile text column if you want to store generated profile
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS magic_profile text;

-- Verify columns:
-- \d public.profiles
