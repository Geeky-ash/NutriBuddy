-- NutriBuddy Database Migration: Add Personal Metrics to Profiles Table
-- Version: 1.1.0
-- Created: 2026-09-17

-- Add personal metrics columns to public.profiles if they don't already exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gender TEXT DEFAULT 'Male';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS height_cm NUMERIC DEFAULT 175.0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS weight_kg NUMERIC DEFAULT 63.0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS birth_date TEXT DEFAULT 'Jan 2, 2005';

-- Notify PostgREST to reload its schema cache so new columns are immediately queryable
NOTIFY pgrst, 'reload schema';
