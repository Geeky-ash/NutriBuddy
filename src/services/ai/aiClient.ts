/**
 * NutriBuddy AI Multimodal Vision Client
 * Supports Google Gemini 1.5 Flash and OpenAI GPT-4o with structured JSON outputs.
 * Seamless offline/fallback resilience.
 */

import { ENV, AiProviderName } from '../../config/env';

export type AiProvider = AiProviderName;

interface AiConfig {
  provider: AiProvider;
  geminiApiKey?: string;
  openaiApiKey?: string;
  timeoutMs?: number;
}

const config: AiConfig = {
  provider: ENV.AI_PROVIDER,
  geminiApiKey: ENV.GEMINI_API_KEY,
  openaiApiKey: ENV.OPENAI_API_KEY,
  timeoutMs: 9000,
};

export const setAiConfig = (overrides: Partial<AiConfig>) => {
  Object.assign(config, overrides);
};

export const getAiConfig = (): Readonly<AiConfig> => config;

interface VisionQueryOptions {
  prompt: string;
  base64Image?: string;
  fallbackMockResponse?: Record<string, any>;
}

export async function queryVisionAi<T = Record<string, any>>(
  options: VisionQueryOptions
): Promise<T> {
  const { prompt, base64Image, fallbackMockResponse } = options;

  // 1. Check if an API key is available
  const hasGeminiKey = Boolean(config.geminiApiKey && config.geminiApiKey.trim() !== '');
  const hasOpenAiKey = Boolean(config.openaiApiKey && config.openaiApiKey.trim() !== '');

  // If no keys configured or provider is mock, immediately return offline mock intelligence
  if (!hasGeminiKey && !hasOpenAiKey) {
    if (fallbackMockResponse) {
      // Simulate brief network latency for realistic feel
      await new Promise((resolve) => setTimeout(resolve, 600));
      return fallbackMockResponse as T;
    }
  }

  // 2. Execute Gemini Vision API Call
  if (hasGeminiKey && (config.provider === 'gemini' || !hasOpenAiKey)) {
    try {
      const response = await callGeminiVision(prompt, base64Image, config.geminiApiKey!, config.timeoutMs);
      return JSON.parse(response) as T;
    } catch (err) {
      console.warn('[AI Client] Gemini call failed or timed out. Engaging resilient fallback.', err);
      if (fallbackMockResponse) return fallbackMockResponse as T;
      throw err;
    }
  }

  // 3. Execute OpenAI GPT-4o Vision API Call
  if (hasOpenAiKey) {
    try {
      const response = await callOpenAiVision(prompt, base64Image, config.openaiApiKey!, config.timeoutMs);
      return JSON.parse(response) as T;
    } catch (err) {
      console.warn('[AI Client] OpenAI call failed or timed out. Engaging resilient fallback.', err);
      if (fallbackMockResponse) return fallbackMockResponse as T;
      throw err;
    }
  }

  if (fallbackMockResponse) {
    return fallbackMockResponse as T;
  }

  throw new Error('No AI provider configured and no offline fallback available.');
}

async function callGeminiVision(
  prompt: string,
  base64Image: string | undefined,
  apiKey: string,
  timeoutMs: number = 9000
): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const parts: any[] = [{ text: prompt }];

  if (base64Image) {
    // Strip possible data URI header
    const cleanBase64 = base64Image.replace(/^data:image\/[a-z]+;base64,/, '');
    parts.push({
      inline_data: {
        mime_type: 'image/jpeg',
        data: cleanBase64,
      },
    });
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Gemini API error (${res.status}): ${errorText}`);
    }

    const data = await res.json();
    const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) {
      throw new Error('Invalid or empty response candidate from Gemini.');
    }

    return candidateText;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function callOpenAiVision(
  prompt: string,
  base64Image: string | undefined,
  apiKey: string,
  timeoutMs: number = 9000
): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const url = 'https://api.openai.com/v1/chat/completions';

  const content: any[] = [{ type: 'text', text: prompt }];

  if (base64Image) {
    const formattedUrl = base64Image.startsWith('data:')
      ? base64Image
      : `data:image/jpeg;base64,${base64Image}`;
    content.push({
      type: 'image_url',
      image_url: { url: formattedUrl, detail: 'low' },
    });
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: 'gpt-4o',
        response_format: { type: 'json_object' },
        messages: [{ role: 'user', content }],
        temperature: 0.2,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`OpenAI API error (${res.status}): ${errorText}`);
    }

    const data = await res.json();
    const contentText = data?.choices?.[0]?.message?.content;
    if (!contentText) {
      throw new Error('Invalid or empty response content from OpenAI.');
    }

    return contentText;
  } finally {
    clearTimeout(timeoutId);
  }
}
