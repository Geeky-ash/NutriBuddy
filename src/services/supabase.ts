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
  try {
    if (!ENV.HAS_SUPABASE || supabaseUrl.includes('placeholder')) {
      return localUri;
    }

    // Remote preset URLs (DiceBear, CDN images) do not need to be uploaded to storage
    if (localUri.startsWith('http://') || localUri.startsWith('https://')) {
      return localUri;
    }

    const response = await fetch(localUri);
    const arrayBuffer = await response.arrayBuffer();

    const fileExt = localUri.split('.').pop()?.toLowerCase() || 'jpg';
    const mimeType = fileExt === 'png' ? 'image/png' : 'image/jpeg';
    const filePath = `${userId}/avatar_${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, arrayBuffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (uploadError) {
      console.warn('[Supabase Storage] Avatar upload warning:', uploadError.message);
      return localUri;
    }

    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
    return data?.publicUrl || localUri;
  } catch (error) {
    console.warn('[Supabase Storage] Failed to upload avatar, using local fallback:', error);
    return localUri;
  }
}
