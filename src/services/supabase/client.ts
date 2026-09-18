/**
 * NutriBuddy Supabase Client Service
 * Initializes the client using EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY
 * with custom native SecureStore persistence and offline resilience.
 */

import { supabase, UserProfile, uploadAvatarToStorage } from '../supabase';
import { ENV } from '../../config/env';

export const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() || ENV.SUPABASE_URL;

export const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() || ENV.SUPABASE_ANON_KEY;

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    SUPABASE_URL &&
    SUPABASE_ANON_KEY &&
    !SUPABASE_URL.includes('placeholder')
  );
};

export { supabase, UserProfile, uploadAvatarToStorage };
export default supabase;
