/**
 * NutriBuddy Environment Configuration & Validation
 * Provides typesafe access to environment variables with fallback resilience.
 */

export type AiProviderName = 'gemini' | 'openai' | 'mock';

export interface AppEnvConfig {
  GEMINI_API_KEY: string;
  OPENAI_API_KEY: string;
  AI_PROVIDER: AiProviderName;
  GEMINI_MODEL: string;
  APP_ENV: 'development' | 'staging' | 'production';
  HAS_GEMINI_KEY: boolean;
  HAS_OPENAI_KEY: boolean;
  IS_OFFLINE_MOCK: boolean;
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  HAS_SUPABASE: boolean;
}

const geminiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY?.trim() || '';
const openaiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY?.trim() || '';
const rawProvider = (process.env.EXPO_PUBLIC_AI_PROVIDER || 'gemini').toLowerCase();
const geminiModel = process.env.EXPO_PUBLIC_GEMINI_MODEL?.trim() || 'gemini-3.5-flash-lite';

const rawSupabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() || '';
// Normalize Supabase URL: strip trailing /rest/v1 or /rest/v1/ so auth, storage, and rest all resolve correctly
const supabaseUrl = rawSupabaseUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() || '';

const aiProvider: AiProviderName =
  rawProvider === 'openai' ? 'openai' : rawProvider === 'mock' ? 'mock' : 'gemini';

const hasGemini = geminiKey.length > 0 && !geminiKey.includes('YOUR_GEMINI_API_KEY');
const hasOpenAi = openaiKey.length > 0 && !openaiKey.includes('YOUR_OPENAI_API_KEY');
const hasSupabase = supabaseUrl.length > 0 && supabaseAnonKey.length > 0;

export const ENV: AppEnvConfig = {
  GEMINI_API_KEY: geminiKey,
  OPENAI_API_KEY: openaiKey,
  AI_PROVIDER: aiProvider,
  GEMINI_MODEL: geminiModel,
  APP_ENV: (process.env.EXPO_PUBLIC_APP_ENV as any) || 'development',
  HAS_GEMINI_KEY: hasGemini,
  HAS_OPENAI_KEY: hasOpenAi,
  IS_OFFLINE_MOCK: (!hasGemini && !hasOpenAi) || aiProvider === 'mock',
  SUPABASE_URL: supabaseUrl,
  SUPABASE_ANON_KEY: supabaseAnonKey,
  HAS_SUPABASE: hasSupabase,
};

// Convenient lower-case alias with helper flags
export const env = {
  ...ENV,
  IS_GEMINI_CONFIGURED: hasGemini,
  IS_OPENAI_CONFIGURED: hasOpenAi,
  IS_AI_AVAILABLE: hasGemini || hasOpenAi,
  IS_SUPABASE_CONFIGURED: hasSupabase,
};


