# 🥗 NutriBuddy — Smart AI Calorie & Macro Tracker

[![React Native](https://img.shields.io/badge/React_Native-0.74-61DAFB?style=flat&logo=react&logoColor=black)](https://reactnative.dev/)
[![Expo SDK 51](https://img.shields.io/badge/Expo_SDK-51.0-000000?style=flat&logo=expo&logoColor=white)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database_%26_Auth-3FCF8E?style=flat&logo=supabase&logoColor=white)](https://supabase.com/)
[![SQLite](https://img.shields.io/badge/SQLite-Local_Storage-003B57?style=flat&logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![Gemini AI](https://img.shields.io/badge/Gemini_Vision_API-AI_Scanner-8E75B2?style=flat&logo=googlegemini&logoColor=white)](https://ai.google.dev/)

**NutriBuddy** is a production-grade, offline-first React Native mobile application designed to simplify daily meal logging, macro tracking, and nutritional awareness. Powered by **Gemini Vision API** for instant meal recognition, **Supabase** for secure authentication and real-time cloud sync, and **Expo SQLite** for local persistence, NutriBuddy ensures accurate nutrition logging whether you're online or offline.

---

## ✨ Key Features

- 📸 **AI Meal Camera & Vision Scan**: Point your camera at any meal, packaged food label, or plate. Gemini Vision AI identifies dishes and computes calorie estimates, protein, carbs, fat, and health scores in real time.
- 🐻 **Bao the Floating Mascot**: An interactive 2D avatar featuring spring-physics dragging that stays accessible across tabs without blocking core touch controls.
- 🔍 **Universal & Regional Food Search**: Search global and native regional dishes (e.g., Poha, Upma, Idli, Dosa, Paneer Tikka, Dal Tadka) with normalized 100g nutrition baselines, interactive portion steppers (`1x`, `2x`, `300g`), and real-time macro scaling.
- 📅 **Interactive History & Nutrition Diary**: Daily macro summaries with interactive calendar view, date range filtering, and custom entry logging.
- 📊 **Deep-Dive Nutrition Info Modal**: Comprehensive breakdown of intake ranges (Low, Average/Recommended, High) across 10+ macronutrients and micronutrients (Protein, Fiber, Vitamins, Calcium, Iron, Sodium, Sugar).
- 🔒 **Full Auth & Cloud Sync**: Seamless Email/Password, Phone OTP, and Google OAuth login via Supabase. Offline meal entries automatically sync to PostgreSQL upon reconnecting.
- 👤 **Customizable Profile & Biometrics**: Edit personal metrics (Height, Weight, Gender, Age) to recalculate optimal daily calorie budgets and nutrient targets.

---

## 🛠️ Tech Stack

- **Framework**: [React Native](https://reactnative.dev/) (Expo SDK 51 Custom Native Dev Build)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [NativeWind](https://www.nativewind.dev/) (Tailwind CSS for React Native)
- **Routing**: [Expo Router](https://docs.expo.dev/router/introduction/) (File-based navigation)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Database & Offline Sync**: [Expo SQLite](https://docs.expo.dev/versions/latest/sdk/sqlite/) (Local) & [Supabase PostgreSQL](https://supabase.com/) (Cloud)
- **Authentication**: Supabase Auth (Email, Phone, Google OAuth)
- **AI Recognition**: Google Gemini Vision API (`@google/generative-ai`)
- **Media & Camera**: `expo-camera`, `expo-image-picker`, `expo-image`

---

## 🏗️ Architecture & Database Setup

NutriBuddy follows an **Offline-First Data Pipeline**:
1. **Local Writes**: Meal scans and custom manual entries are executed in local **SQLite** transactions immediately for zero UI latency.
2. **Cloud Synchronization**: Background tasks mirror SQLite records to Supabase tables (`public.meal_logs`, `public.profiles`).

### Supabase Database Migration (`SQL`)

Run the following migration script in your Supabase Dashboard SQL Editor to initialize the required tables and Row Level Security (RLS) policies:

```sql
-- 1. Create public.meal_logs table
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

-- 2. Create public.profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    avatar_url TEXT,
    gender TEXT DEFAULT 'Male',
    height_cm NUMERIC DEFAULT 175.0,
    weight_kg NUMERIC DEFAULT 63.0,
    birth_date DATE DEFAULT '2005-01-02',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.meal_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. User RLS Policies
CREATE POLICY "Users can manage own meal logs"
    ON public.meal_logs FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own profile"
    ON public.profiles FOR ALL
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);
