import { createClient } from '@supabase/supabase-js';
import { safeSecureStore } from '../utils/safeSecureStore';
import { ENV } from '../config/env';

/**
 * Custom Secure Storage Adapter for Supabase Auth on native platforms.
 * Uses expo-secure-store if present in build, otherwise falls back to AsyncStorage.
 */
const SecureStoreAdapter = {
  getItem: (key: string) => safeSecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => safeSecureStore.setItemAsync(key, value),
  removeItem: (key: string) => safeSecureStore.deleteItemAsync(key),
};



const supabaseUrl = ENV.SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = ENV.SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: SecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export interface UserProfile {
  id: string;
  email: string | null;
  phone: string | null;
  full_name: string | null;
  avatar_url: string | null;
  daily_calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  updated_at?: string;
}

/**
 * Uploads a user avatar image to Supabase Storage ('avatars' bucket)
 * Returns the public URL or the local URI as graceful fallback.
 */
export async function uploadAvatarToStorage(
  userId: string,
  localUri: string
): Promise<string> {
  if (!localUri) return '';

  // 1. Remote preset URLs (DiceBear, CDN images) do not need to be re-uploaded
  if (localUri.startsWith('http://') || localUri.startsWith('https://')) {
    return localUri;
  }

  // 2. If Supabase is not configured or in offline mode, fall back to local URI
  if (!ENV.HAS_SUPABASE || supabaseUrl.includes('placeholder')) {
    return localUri;
  }

  try {
    const response = await fetch(localUri);
    const arrayBuffer = await response.arrayBuffer();

    const fileExt = localUri.split('.').pop()?.toLowerCase() || 'jpg';
    const mimeType = fileExt === 'png' ? 'image/png' : 'image/jpeg';
    const filePath = `${userId}/${Date.now()}.${fileExt === 'png' ? 'png' : 'jpg'}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, arrayBuffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (uploadError) {
      console.warn('[Supabase Storage] Avatar upload notice:', uploadError.message);
      return localUri;
    }

    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
    return data?.publicUrl || localUri;
  } catch (error: any) {
    console.warn('[Supabase Storage] Failed to upload avatar, using local fallback:', error?.message || error);
    return localUri;
  }
}
