/**
 * NutriBuddy Packaged Food Label Agent
 * Ingests label images, extracts ingredients, validates via Zod, checks user allergens,
 * and deterministically calculates Health Index & NOVA classification.
 */

import { z } from 'zod';
import { queryVisionAi } from '../aiClient';
import { parseFoodLabel } from '../ocrParser';
import { calculateNutritionScore } from '../nutritionScorer';
import { ScannedProduct } from '../../../types/nutrition';

// Strict Zod schema for Vision AI Output
export const PackagedScanLLMResponseSchema = z.object({
  name: z.string().min(1).default('Packaged Product'),
  brand: z.string().optional().default('Food Brand'),
  servingSize: z.string().optional().default('100g'),
  ingredientsText: z.string().default(''),
  macros: z.object({
    calories: z.number().default(0),
    protein: z.number().default(0),
    carbohydrates: z.number().default(0),
    sugars: z.number().default(0),
    addedSugars: z.number().optional().default(0),
    fat: z.number().default(0),
    saturatedFat: z.number().default(0),
    fiber: z.number().default(0),
    sodium: z.number().default(0),
  }),
  flaggedAdditives: z.array(z.string()).optional().default([]),
  allergensFound: z.array(z.string()).optional().default([]),
  actionableTips: z.array(z.string()).optional().default([]),
});

export type PackagedScanLLMResponse = z.infer<typeof PackagedScanLLMResponseSchema>;

export interface PackagedScanOptions {
  base64Image?: string;
  userAllergens?: string[];
}

export async function processPackagedLabelScan(
  options: PackagedScanOptions
): Promise<ScannedProduct> {
  const { base64Image, userAllergens = [] } = options;

  const prompt = `
You are the NutriBuddy Packaged Food Vision Agent.
Examine this packaged food label photograph.
Extract:
1. "name": The clean product name (e.g. "Whole Grain Rolled Oats").
2. "brand": The manufacturer/brand if visible.
3. "servingSize": The reference serving size (e.g. "40g", "1 cup", or "100g").
4. "ingredientsText": The full, exact ingredient list from the label.
5. "macros": Nutritional facts per 100g or per serving (calories, protein, carbohydrates, sugars, addedSugars, fat, saturatedFat, fiber, sodium in mg).
6. "flaggedAdditives": Names of any synthetic food dyes, preservatives, or artificial sweeteners detected.
7. "allergensFound": Any declared allergens (e.g. Peanuts, Milk, Wheat, Soy).
8. "actionableTips": 1 or 2 concise, practical suggestions (e.g., "Great clean source of complex fiber").

Return STRICT JSON complying with this schema:
{
  "name": string,
  "brand": string,
  "servingSize": string,
  "ingredientsText": string,
  "macros": {
    "calories": number,
    "protein": number,
    "carbohydrates": number,
    "sugars": number,
    "addedSugars": number,
    "fat": number,
    "saturatedFat": number,
    "fiber": number,
    "sodium": number
  },
  "flaggedAdditives": string[],
  "allergensFound": string[],
  "actionableTips": string[]
}
Never output markdown text or formatting outside the JSON object.
`;

  // Fallback mock fixture when offline or running without keys
  const fallbackMockResponse = {
    name: 'Organic Greek Plain Yogurt',
    brand: 'Stonyfield Organic',
    servingSize: '170g',
    ingredientsText: 'Cultured Pasteurized Organic Nonfat Milk. Contains live active cultures: S. thermophilus, L. bulgaricus, L. acidophilus, Bifidus, L. paracasei.',
    macros: {
      calories: 59,
      protein: 10,
      carbohydrates: 3.6,
      sugars: 3.2,
      addedSugars: 0,
      fat: 0.4,
      saturatedFat: 0.1,
      fiber: 0,
      sodium: 36,
    },
    flaggedAdditives: [],
    allergensFound: ['Milk / Dairy'],
    actionableTips: [
      'Excellent whole food source of gut-friendly probiotics.',
      'High natural protein content with zero added sugars.',
    ],
  };

  // 1. Query Vision AI Model
  const rawResponse = await queryVisionAi({
    prompt,
    base64Image,
    fallbackMockResponse,
  });

  // 2. Strict Zod Validation
  const validated = PackagedScanLLMResponseSchema.parse(rawResponse);

  // 3. Independent local OCR parsing & Additive matching
  const parsedLabel = parseFoodLabel(
    validated.ingredientsText || 'Cultured Milk',
    userAllergens
  );

  // Combine allergens from model and regex parser
  const combinedAllergens = Array.from(
    new Set([...parsedLabel.flaggedAllergens, ...validated.allergensFound])
  );

  // 4. Deterministic Nutrition Scoring
  const scoreResult = calculateNutritionScore({
    macros: validated.macros,
    additives: parsedLabel.additives,
    isUltraProcessedOverride: parsedLabel.isUltraProcessed,
    ingredientCount: parsedLabel.ingredients.length,
  });

  // 5. Construct verified ScannedProduct entity
  const scannedProduct: ScannedProduct = {
    id: `scan-${Date.now()}`,
    name: validated.name,
    brand: validated.brand,
    servingSize: validated.servingSize,
    macrosPer100g: validated.macros,
    ingredientsText: validated.ingredientsText,
    parsedIngredients: parsedLabel.ingredients,
    additivesDetected: parsedLabel.additives,
    flaggedAllergens: combinedAllergens,
    novaGroup: scoreResult.novaGroup,
    healthScore: scoreResult.healthScore,
    grade: scoreResult.grade,
    actionableTips: validated.actionableTips,
    createdAt: Date.now(),
  };

  return scannedProduct;
}
