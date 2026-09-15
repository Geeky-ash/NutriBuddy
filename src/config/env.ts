/**
 * NutriBuddy Environment Configuration & Validation
 * Provides typesafe access to environment variables with fallback resilience.
 */

export type AiProviderName = 'gemini' | 'openai' | 'mock';

export interface AppEnvConfig {
  GEMINI_API_KEY: string;
  OPENAI_API_KEY: string;
  AI_PROVIDER: AiProviderName;
  APP_ENV: 'development' | 'staging' | 'production';
  HAS_GEMINI_KEY: boolean;
  HAS_OPENAI_KEY: boolean;
  IS_OFFLINE_MOCK: boolean;
}

const geminiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY?.trim() || '';
const openaiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY?.trim() || '';
const rawProvider = (process.env.EXPO_PUBLIC_AI_PROVIDER || 'gemini').toLowerCase();

const aiProvider: AiProviderName =
  rawProvider === 'openai' ? 'openai' : rawProvider === 'mock' ? 'mock' : 'gemini';

const hasGemini = geminiKey.length > 0 && !geminiKey.includes('YOUR_GEMINI_API_KEY');
const hasOpenAi = openaiKey.length > 0 && !openaiKey.includes('YOUR_OPENAI_API_KEY');

export const ENV: AppEnvConfig = {
  GEMINI_API_KEY: geminiKey,
  OPENAI_API_KEY: openaiKey,
  AI_PROVIDER: aiProvider,
  APP_ENV: (process.env.EXPO_PUBLIC_APP_ENV as any) || 'development',
  HAS_GEMINI_KEY: hasGemini,
  HAS_OPENAI_KEY: hasOpenAi,
  IS_OFFLINE_MOCK: (!hasGemini && !hasOpenAi) || aiProvider === 'mock',
};

// Convenient lower-case alias with helper flags
export const env = {
  ...ENV,
  IS_GEMINI_CONFIGURED: hasGemini,
  IS_OPENAI_CONFIGURED: hasOpenAi,
  IS_AI_AVAILABLE: hasGemini || hasOpenAi,
};

