export type NovaGroup = 1 | 2 | 3 | 4;

export type HealthGrade = 'A' | 'B' | 'C' | 'D' | 'F';

export type AdditiveRiskTier = 'safe' | 'caution' | 'high_risk';

export interface AdditiveInfo {
  code: string;           // e.g., "E211" or "Sodium Benzoate"
  name: string;
  riskTier: AdditiveRiskTier;
  description: string;
  concerns?: string[];
}

export interface MacroNutrients {
  calories: number;       // kcal
  protein: number;        // grams
  carbohydrates: number;  // grams
  sugars: number;         // grams
  addedSugars?: number;   // grams
  fat: number;            // grams
  saturatedFat: number;   // grams
  fiber: number;          // grams
  sodium: number;         // milligrams
}

export interface ScannedProduct {
  id: string;
  barcode?: string;
  name: string;
  brand?: string;
  imageUrl?: string;
  servingSize: string;
  macrosPer100g: MacroNutrients;
  ingredientsText: string;
  parsedIngredients: string[];
  additivesDetected: AdditiveInfo[];
  flaggedAllergens: string[];
  novaGroup: NovaGroup;
  healthScore: number;    // 0 to 100
  grade: HealthGrade;
  createdAt: number;
  actionableTips?: string[];
}

export interface PlatedFoodItem {
  id: string;
  name: string;
  estimatedGrams: number;
  macros: MacroNutrients;
  confidence: number;     // 0.00 to 1.00
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface LiveMealScanResult {
  id: string;
  imageUri: string;
  items: PlatedFoodItem[];
  totalMacros: MacroNutrients;
  overallHealthScore: number;
  healthGrade: HealthGrade;
  dietaryHighlights: string[];
  mascotReactionText: string;
  timestamp: number;
  actionableTips?: string[];
}
