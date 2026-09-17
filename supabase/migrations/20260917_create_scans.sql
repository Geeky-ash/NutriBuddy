-- NutriBuddy Database Migration: Scans & Meal Logs Table
-- Version: 1.0.0
-- Created: 2026-09-17

-- 1. Create public.scans table
CREATE TABLE IF NOT EXISTS public.scans (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    food_name TEXT NOT NULL,
    calories NUMERIC DEFAULT 0 NOT NULL,
    protein NUMERIC DEFAULT 0 NOT NULL,
    carbs NUMERIC DEFAULT 0 NOT NULL,
    fat NUMERIC DEFAULT 0 NOT NULL,
    nova_score INTEGER DEFAULT 1 NOT NULL,
    health_rating NUMERIC DEFAULT 0 NOT NULL,
    image_uri TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create public.meal_logs table (alias/fallback)
CREATE TABLE IF NOT EXISTS public.meal_logs (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    food_name TEXT NOT NULL,
    calories NUMERIC DEFAULT 0 NOT NULL,
    protein NUMERIC DEFAULT 0 NOT NULL,
    carbs NUMERIC DEFAULT 0 NOT NULL,
    fat NUMERIC DEFAULT 0 NOT NULL,
    nova_score INTEGER DEFAULT 1 NOT NULL,
    health_rating NUMERIC DEFAULT 0 NOT NULL,
    image_uri TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_logs ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for public.scans
DROP POLICY IF EXISTS "Users can view their own scans" ON public.scans;
CREATE POLICY "Users can view their own scans"
    ON public.scans FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own scans" ON public.scans;
CREATE POLICY "Users can insert their own scans"
    ON public.scans FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own scans" ON public.scans;
CREATE POLICY "Users can update their own scans"
    ON public.scans FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own scans" ON public.scans;
CREATE POLICY "Users can delete their own scans"
    ON public.scans FOR DELETE
    USING (auth.uid() = user_id);

-- 5. RLS Policies for public.meal_logs
DROP POLICY IF EXISTS "Users can view their own meal logs" ON public.meal_logs;
CREATE POLICY "Users can view their own meal logs"
    ON public.meal_logs FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own meal logs" ON public.meal_logs;
CREATE POLICY "Users can insert their own meal logs"
    ON public.meal_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own meal logs" ON public.meal_logs;
CREATE POLICY "Users can update their own meal logs"
    ON public.meal_logs FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own meal logs" ON public.meal_logs;
CREATE POLICY "Users can delete their own meal logs"
    ON public.meal_logs FOR DELETE
    USING (auth.uid() = user_id);
