/**
 * NutriBuddy Gemini API Service
 * Handles multimodal AI vision queries with Google Gemini models.
 * Cleanly loads process.env.EXPO_PUBLIC_GEMINI_API_KEY with robust offline fallback resilience.
 */

import { ENV } from '../../config/env';
import { queryVisionAi, setAiConfig, getAiConfig, AiProvider } from '../ai/aiClient';

export const GEMINI_API_KEY =
  process.env.EXPO_PUBLIC_GEMINI_API_KEY?.trim() || ENV.GEMINI_API_KEY || '';

export const GEMINI_MODEL =
  process.env.EXPO_PUBLIC_GEMINI_MODEL?.trim() || ENV.GEMINI_MODEL || 'gemini-3.5-flash-lite';

export const isGeminiConfigured = (): boolean => {
  return Boolean(
    GEMINI_API_KEY &&
    GEMINI_API_KEY.length > 0 &&
    !GEMINI_API_KEY.includes('YOUR_GEMINI_API_KEY')
  );
};

export interface GeminiVisionOptions<T extends Record<string, any> = Record<string, any>> {
  prompt: string;
  base64Image?: string;
  fallbackMockResponse?: T;
}

/**
 * Executes a Gemini multimodal vision request with automatic offline fallback.
 * If offline or API key is missing/invalid, resolves immediately with fallbackMockResponse.
 */
export async function executeGeminiVision<T extends Record<string, any> = Record<string, any>>(
  options: GeminiVisionOptions<T>
): Promise<T> {
  return queryVisionAi<T>({
    prompt: options.prompt,
    base64Image: options.base64Image,
    fallbackMockResponse: options.fallbackMockResponse,
  });
}

export { queryVisionAi, setAiConfig, getAiConfig };
export type { AiProvider };
