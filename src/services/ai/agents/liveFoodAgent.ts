/**
 * NutriBuddy Live Plated Food Agent
 * Ingests live meal photo, decomposes individual food components, estimates portions/grams,
 * calculates total macronutrients and glycemic impact, and provides actionable tips.
 */

import { z } from 'zod';
import { queryVisionAi } from '../aiClient';
import { calculateNutritionScore } from '../nutritionScorer';
import { LiveMealScanResult, PlatedFoodItem } from '../../../types/nutrition';

export const LiveFoodItemSchema = z.object({
  name: z.string().min(1).default('Food Component'),
  estimatedGrams: z.number().default(100),
  calories: z.number().default(0),
  protein: z.number().default(0),
  carbohydrates: z.number().default(0),
  fat: z.number().default(0),
  fiber: z.number().optional().default(0),
  confidence: z.number().min(0).max(1).default(0.92),
  boundingBox: z
    .object({
      x: z.number(),
      y: z.number(),
      width: z.number(),
      height: z.number(),
    })
    .optional(),
});

export const LiveFoodScanLLMResponseSchema = z.object({
  dishName: z.string().min(1).default('Prepared Plate'),
  items: z.array(LiveFoodItemSchema).min(1),
  totalCalories: z.number(),
  totalProtein: z.number(),
  totalCarbs: z.number(),
  totalFat: z.number(),
  totalFiber: z.number().optional().default(0),
  glycemicImpact: z.enum(['LOW', 'MODERATE', 'HIGH']).default('LOW'),
  dietaryHighlights: z.array(z.string()).default([]),
  actionableTips: z.array(z.string()).min(1).default([]),
});

export type LiveFoodScanLLMResponse = z.infer<typeof LiveFoodScanLLMResponseSchema>;

export interface LiveFoodScanOptions {
  base64Image?: string;
  imageUri?: string;
}

export async function processLiveFoodScan(
  options: LiveFoodScanOptions
): Promise<LiveMealScanResult> {
  const { base64Image, imageUri = '' } = options;

  const prompt = `
You are the NutriBuddy Live Plated Food Vision Agent.
Analyze this meal photograph.
Tasks:
1. Identify the dish name and detect each distinct food component on the plate.
2. Estimate the mass in grams of each component based on standard portion sizes.
3. Calculate nutritional values (calories, protein, carbohydrates, fat, fiber).
4. Evaluate glycemic impact ('LOW' | 'MODERATE' | 'HIGH').
5. Provide 2 actionable eating tips (e.g. "Add leafy greens for micronutrient absorption").

Return STRICT JSON complying with this schema:
{
  "dishName": string,
  "items": [
    {
      "name": string,
      "estimatedGrams": number,
      "calories": number,
      "protein": number,
      "carbohydrates": number,
      "fat": number,
      "fiber": number,
      "confidence": number,
      "boundingBox": { "x": number, "y": number, "width": number, "height": number }
    }
  ],
  "totalCalories": number,
  "totalProtein": number,
  "totalCarbs": number,
  "totalFat": number,
  "totalFiber": number,
  "glycemicImpact": "LOW" | "MODERATE" | "HIGH",
  "dietaryHighlights": string[],
  "actionableTips": string[]
}
Never output markdown fences or explanatory text outside the JSON.
`;

  // Fallback mock fixture when offline or testing without cloud keys
  const fallbackMockResponse = {
    dishName: 'Pan-Seared Salmon with Steamed Broccoli & Quinoa',
    items: [
      {
        name: 'Atlantic Salmon Fillet',
        estimatedGrams: 160,
        calories: 330,
        protein: 34,
        carbohydrates: 0,
        fat: 20,
        fiber: 0,
        confidence: 0.96,
        boundingBox: { x: 20, y: 35, width: 45, height: 35 },
      },
      {
        name: 'Steamed Broccoli Florets',
        estimatedGrams: 120,
        calories: 42,
        protein: 3.4,
        carbohydrates: 8,
        fat: 0.5,
        fiber: 3.2,
        confidence: 0.94,
        boundingBox: { x: 55, y: 30, width: 35, height: 40 },
      },
      {
        name: 'Cooked White Quinoa',
        estimatedGrams: 100,
        calories: 120,
        protein: 4.4,
        carbohydrates: 21.3,
        fat: 1.9,
        fiber: 2.8,
        confidence: 0.91,
        boundingBox: { x: 30, y: 65, width: 40, height: 25 },
      },
    ],
    totalCalories: 492,
    totalProtein: 41.8,
    totalCarbs: 29.3,
    totalFat: 22.4,
    totalFiber: 6.0,
    glycemicImpact: 'LOW',
    dietaryHighlights: [
      'High Bioavailable Protein',
      'Rich in Heart-Healthy Omega-3 Fatty Acids',
      'High in Micronutrients (Vitamin C & K)',
    ],
    actionableTips: [
      'Adding a squeeze of fresh lemon boosts iron absorption from the quinoa and greens.',
      'Excellent balance of lean protein and slow-digesting complex carbs.',
    ],
  };

  // 1. Query Vision AI Model
  const rawResponse = await queryVisionAi({
    prompt,
    base64Image,
    fallbackMockResponse,
  });

  // 2. Strict Zod Validation
  const validated = LiveFoodScanLLMResponseSchema.parse(rawResponse);

  // 3. Map items to PlatedFoodItem
  const platedItems: PlatedFoodItem[] = validated.items.map((item, idx) => ({
    id: `item-${idx + 1}`,
    name: item.name,
    estimatedGrams: item.estimatedGrams,
    macros: {
      calories: item.calories,
      protein: item.protein,
      carbohydrates: item.carbohydrates,
      sugars: Math.round(item.carbohydrates * 0.15),
      fat: item.fat,
      saturatedFat: Math.round(item.fat * 0.2),
      fiber: item.fiber || 0,
      sodium: 80,
    },
    confidence: item.confidence,
    boundingBox: item.boundingBox,
  }));

  // Total macros aggregation
  const totalMacros = {
    calories: Math.round(validated.totalCalories),
    protein: Math.round(validated.totalProtein),
    carbohydrates: Math.round(validated.totalCarbs),
    sugars: Math.round(validated.totalCarbs * 0.12),
    fat: Math.round(validated.totalFat),
    saturatedFat: Math.round(validated.totalFat * 0.22),
    fiber: Math.round(validated.totalFiber || 0),
    sodium: 180,
  };

  // 4. Deterministic Nutrition Score calculation (assuming NOVA 1 for prepared plate)
  const scoreResult = calculateNutritionScore({
    macros: totalMacros,
    additives: [],
    novaGroupOverride: 1,
    ingredientCount: platedItems.length,
  });

  // 5. Construct LiveMealScanResult
  const scanResult: LiveMealScanResult = {
    id: `live-${Date.now()}`,
    imageUri,
    items: platedItems,
    totalMacros,
    overallHealthScore: scoreResult.healthScore,
    healthGrade: scoreResult.grade,
    dietaryHighlights: validated.dietaryHighlights,
    actionableTips: validated.actionableTips,
    mascotReactionText:
      scoreResult.healthScore >= 75
        ? 'Incredible plate! Wholesome protein with micronutrient-rich ingredients.'
        : 'Nice meal! Try balancing with additional dietary fiber.',
    timestamp: Date.now(),
  };

  return scanResult;
}
