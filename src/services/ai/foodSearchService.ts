import { queryVisionAi } from './aiClient';

export interface FoodSearchItem {
  id: string;
  name: string;
  category: 'Indian Classics' | 'High Protein' | 'Breakfast' | 'Clean Snacks' | 'Live Foods' | 'Global Staples';
  servingSize: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  healthScore: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  novaGroup: 1 | 2 | 3 | 4;
  tags: string[];
  isAiGenerated?: boolean;
  baseWeightGrams?: number;
  baseServingUnit?: string;
  baselineTag?: string;
}

/**
 * Curated nutrition database with extensive coverage of Indian regional dishes
 * and healthy whole foods normalized per standard 100g / 1 serving base.
 */
export const CURATED_FOOD_DATABASE: FoodSearchItem[] = [
  // Indian Regional Classics
  {
    id: 'food-moong-dal-chila',
    name: 'Moong Dal Chila (Savory Yellow Lentil Crepe)',
    category: 'Indian Classics',
    servingSize: '1 piece (100g)',
    calories: 240,
    protein: 12.0,
    carbs: 32.0,
    fat: 6.0,
    healthScore: 92,
    grade: 'A',
    novaGroup: 1,
    baseWeightGrams: 100,
    baseServingUnit: '100g',
    baselineTag: 'Base: 100g (or 1 serving)',
    tags: ['moong dal chila', 'chila', 'cheela', 'moong dal', 'pancake', 'breakfast', 'indian', 'protein'],
  },
  {
    id: 'food-poha',
    name: 'Poha (Flattened Rice with Mustard & Peanuts)',
    category: 'Indian Classics',
    servingSize: '1 bowl (180g)',
    calories: 250,
    protein: 4.8,
    carbs: 42.5,
    fat: 7.2,
    healthScore: 88,
    grade: 'A',
    novaGroup: 2,
    baseWeightGrams: 100,
    baseServingUnit: '100g',
    baselineTag: 'Base: 100g (or 1 serving)',
    tags: ['poha', 'breakfast', 'indian', 'rice', 'peanuts', 'flattened rice'],
  },
  {
    id: 'food-upma',
    name: 'Upma (Savory Semolina with Veggies)',
    category: 'Indian Classics',
    servingSize: '1 bowl (180g)',
    calories: 220,
    protein: 5.2,
    carbs: 36.0,
    fat: 6.5,
    healthScore: 85,
    grade: 'A',
    novaGroup: 2,
    baseWeightGrams: 100,
    baseServingUnit: '100g',
    baselineTag: 'Base: 100g (or 1 serving)',
    tags: ['upma', 'suji', 'rava', 'breakfast', 'indian', 'semolina'],
  },
  {
    id: 'food-dosa',
    name: 'Plain Masala Dosa with Sambar',
    category: 'Indian Classics',
    servingSize: '1 medium (150g)',
    calories: 195,
    protein: 4.5,
    carbs: 32.0,
    fat: 5.4,
    healthScore: 87,
    grade: 'A',
    novaGroup: 2,
    baseWeightGrams: 100,
    baseServingUnit: '100g',
    baselineTag: 'Base: 100g (or 1 serving)',
    tags: ['dosa', 'masala dosa', 'south indian', 'fermented', 'crispy'],
  },
  {
    id: 'food-idli',
    name: 'Steamed Idli with Sambar (2 pieces)',
    category: 'Indian Classics',
    servingSize: '2 pieces (120g)',
    calories: 130,
    protein: 4.6,
    carbs: 26.2,
    fat: 0.8,
    healthScore: 94,
    grade: 'A',
    novaGroup: 1,
    baseWeightGrams: 100,
    baseServingUnit: '100g',
    baselineTag: 'Base: 100g (or 1 serving)',
    tags: ['idli', 'steamed', 'south indian', 'fermented', 'low fat'],
  },
  {
    id: 'food-dal-tadka',
    name: 'Dal Tadka (Tempered Yellow Lentils)',
    category: 'Indian Classics',
    servingSize: '1 cup (200g)',
    calories: 180,
    protein: 11.2,
    carbs: 23.5,
    fat: 5.0,
    healthScore: 92,
    grade: 'A',
    novaGroup: 2,
    baseWeightGrams: 100,
    baseServingUnit: '100g',
    baselineTag: 'Base: 100g (or 1 serving)',
    tags: ['dal', 'dal tadka', 'toor dal', 'yellow lentil', 'curry'],
  },
  {
    id: 'food-biryani',
    name: 'Fragrant Vegetable / Chicken Biryani',
    category: 'Indian Classics',
    servingSize: '1 plate (250g)',
    calories: 360,
    protein: 14.5,
    carbs: 48.0,
    fat: 12.0,
    healthScore: 78,
    grade: 'B',
    novaGroup: 2,
    baseWeightGrams: 100,
    baseServingUnit: '100g',
    baselineTag: 'Base: 100g (or 1 serving)',
    tags: ['biryani', 'veg biryani', 'chicken biryani', 'rice', 'spiced'],
  },
  {
    id: 'food-chapati',
    name: 'Whole Wheat Chapati / Roti (1 piece)',
    category: 'Indian Classics',
    servingSize: '1 roti (40g)',
    calories: 105,
    protein: 3.5,
    carbs: 20.0,
    fat: 1.2,
    healthScore: 92,
    grade: 'A',
    novaGroup: 1,
    baseWeightGrams: 100,
    baseServingUnit: '100g',
    baselineTag: 'Base: 100g (or 1 serving)',
    tags: ['chapati', 'roti', 'phulka', 'wheat', 'flatbread', 'bread'],
  },
  {
    id: 'food-paneer-tikka',
    name: 'Grilled Paneer Tikka (Tandoori)',
    category: 'Indian Classics',
    servingSize: '4-5 cubes (160g)',
    calories: 260,
    protein: 16.5,
    carbs: 8.0,
    fat: 18.0,
    healthScore: 86,
    grade: 'A',
    novaGroup: 2,
    baseWeightGrams: 100,
    baseServingUnit: '100g',
    baselineTag: 'Base: 100g (or 1 serving)',
    tags: ['paneer', 'paneer tikka', 'tandoori', 'cottage cheese', 'protein'],
  },
  {
    id: 'food-palak-paneer',
    name: 'Palak Paneer (Spinach Cottage Cheese Curry)',
    category: 'Indian Classics',
    servingSize: '1 cup (200g)',
    calories: 240,
    protein: 12.0,
    carbs: 9.5,
    fat: 17.5,
    healthScore: 89,
    grade: 'A',
    novaGroup: 2,
    baseWeightGrams: 100,
    baseServingUnit: '100g',
    baselineTag: 'Base: 100g (or 1 serving)',
    tags: ['palak paneer', 'spinach', 'paneer', 'iron rich'],
  },
  {
    id: 'food-rajma-chawal',
    name: 'Rajma Masala (Red Kidney Bean Curry)',
    category: 'Indian Classics',
    servingSize: '1 cup (200g)',
    calories: 230,
    protein: 11.5,
    carbs: 38.0,
    fat: 4.0,
    healthScore: 90,
    grade: 'A',
    novaGroup: 2,
    baseWeightGrams: 100,
    baseServingUnit: '100g',
    baselineTag: 'Base: 100g (or 1 serving)',
    tags: ['rajma', 'kidney beans', 'beans', 'fiber', 'dal'],
  },
  {
    id: 'food-khichdi',
    name: 'Moong Dal Khichdi with Ghee',
    category: 'Indian Classics',
    servingSize: '1 bowl (220g)',
    calories: 215,
    protein: 8.5,
    carbs: 37.0,
    fat: 4.2,
    healthScore: 95,
    grade: 'A',
    novaGroup: 1,
    baseWeightGrams: 100,
    baseServingUnit: '100g',
    baselineTag: 'Base: 100g (or 1 serving)',
    tags: ['khichdi', 'moong dal', 'comfort food', 'wholesome'],
  },

  // High Protein & Global Staples
  {
    id: 'food-boiled-eggs',
    name: 'Hard Boiled Organic Eggs (2 large)',
    category: 'High Protein',
    servingSize: '2 eggs (100g)',
    calories: 140,
    protein: 12.6,
    carbs: 1.1,
    fat: 9.5,
    healthScore: 96,
    grade: 'A',
    novaGroup: 1,
    baseWeightGrams: 100,
    baseServingUnit: '100g',
    baselineTag: 'Base: 100g (or 1 serving)',
    tags: ['egg', 'eggs', 'boiled egg', 'protein', 'keto'],
  },
  {
    id: 'food-grilled-chicken',
    name: 'Herb Grilled Chicken Breast',
    category: 'High Protein',
    servingSize: '1 breast (150g)',
    calories: 240,
    protein: 46.0,
    carbs: 0.0,
    fat: 5.2,
    healthScore: 95,
    grade: 'A',
    novaGroup: 1,
    baseWeightGrams: 100,
    baseServingUnit: '100g',
    baselineTag: 'Base: 100g (or 1 serving)',
    tags: ['chicken', 'chicken breast', 'grilled chicken', 'lean protein'],
  },
  {
    id: 'food-greek-yogurt',
    name: 'Organic Plain Greek Yogurt (0% Fat)',
    category: 'High Protein',
    servingSize: '1 cup (170g)',
    calories: 100,
    protein: 17.5,
    carbs: 6.0,
    fat: 0.4,
    healthScore: 94,
    grade: 'A',
    novaGroup: 1,
    baseWeightGrams: 100,
    baseServingUnit: '100g',
    baselineTag: 'Base: 100g (or 1 serving)',
    tags: ['yogurt', 'greek yogurt', 'probiotic', 'dairy', 'curd', 'dahi'],
  },
  {
    id: 'food-oats-berries',
    name: 'Rolled Oats Porridge with Fresh Berries',
    category: 'Breakfast',
    servingSize: '1 bowl (220g)',
    calories: 260,
    protein: 9.0,
    carbs: 45.0,
    fat: 4.5,
    healthScore: 93,
    grade: 'A',
    novaGroup: 1,
    baseWeightGrams: 100,
    baseServingUnit: '100g',
    baselineTag: 'Base: 100g (or 1 serving)',
    tags: ['oats', 'oatmeal', 'porridge', 'berries', 'fiber'],
  },
  {
    id: 'food-avocado-toast',
    name: 'Sourdough Avocado Toast',
    category: 'Breakfast',
    servingSize: '1 slice (120g)',
    calories: 240,
    protein: 6.0,
    carbs: 25.0,
    fat: 13.5,
    healthScore: 91,
    grade: 'A',
    novaGroup: 2,
    baseWeightGrams: 100,
    baseServingUnit: '100g',
    baselineTag: 'Base: 100g (or 1 serving)',
    tags: ['avocado', 'toast', 'sourdough', 'healthy fats'],
  },
  {
    id: 'food-quinoa-bowl',
    name: 'Mediterranean Quinoa Salad Bowl',
    category: 'Live Foods',
    servingSize: '1 bowl (200g)',
    calories: 290,
    protein: 9.5,
    carbs: 42.0,
    fat: 9.5,
    healthScore: 93,
    grade: 'A',
    novaGroup: 1,
    baseWeightGrams: 100,
    baseServingUnit: '100g',
    baselineTag: 'Base: 100g (or 1 serving)',
    tags: ['quinoa', 'salad', 'mediterranean', 'live food', 'bowl'],
  },
  {
    id: 'food-mixed-nuts',
    name: 'Raw Unsalted Almonds & Walnuts',
    category: 'Clean Snacks',
    servingSize: '1 handful (30g)',
    calories: 185,
    protein: 5.5,
    carbs: 4.8,
    fat: 17.0,
    healthScore: 94,
    grade: 'A',
    novaGroup: 1,
    baseWeightGrams: 100,
    baseServingUnit: '100g',
    baselineTag: 'Base: 100g (or 1 serving)',
    tags: ['nuts', 'almonds', 'walnuts', 'snack', 'healthy fats'],
  },
];

/**
 * Searches the food database by text matching and category.
 * When `forceAllCategory` is true (or user is typing in search), category restriction is bypassed.
 */
export function searchFoodItems(
  query: string,
  category: string = 'ALL',
  forceAllCategory: boolean = false
): FoodSearchItem[] {
  const cleanQuery = query.trim().toLowerCase();
  const effectiveCategory = forceAllCategory ? 'ALL' : category;

  return CURATED_FOOD_DATABASE.filter((item) => {
    // 1. Category Filter check
    if (effectiveCategory !== 'ALL' && item.category !== effectiveCategory) {
      return false;
    }

    // 2. Query matching
    if (!cleanQuery) return true;

    const nameMatches = item.name.toLowerCase().includes(cleanQuery);
    const tagMatches = item.tags.some((t) => t.toLowerCase().includes(cleanQuery));

    return nameMatches || tagMatches;
  });
}

/**
 * Strips long descriptive parentheticals from food names for clean minimalist display.
 * e.g., "Poha (Flattened Rice with Mustard & Peanuts)" -> "Poha"
 */
export function formatDisplayName(name: string): string {
  const stripped = name.replace(/\s*\([^)]*\)/g, '').trim();
  return stripped || name;
}

/**
 * AI fallback nutritional estimator.
 * If user searches for an item not found in the local index, calls Gemini/Vision AI
 * with an offline heuristic fallback to return realistic nutritional values.
 */
export async function estimateFoodNutritionWithAi(
  foodName: string
): Promise<FoodSearchItem> {
  const cleanName = foodName.trim();

  // Heuristic baseline based on item name keywords
  const lower = cleanName.toLowerCase();
  let defaultCals = 250;
  let defaultProtein = 8;
  let defaultCarbs = 32;
  let defaultFat = 9;
  let defaultScore = 80;
  let defaultGrade: 'A' | 'B' | 'C' | 'D' | 'F' = 'B';
  let defaultNova: 1 | 2 | 3 | 4 = 2;

  if (lower.includes('salad') || lower.includes('green') || lower.includes('soup')) {
    defaultCals = 140;
    defaultProtein = 4;
    defaultCarbs = 18;
    defaultFat = 5;
    defaultScore = 92;
    defaultGrade = 'A';
    defaultNova = 1;
  } else if (lower.includes('protein') || lower.includes('chicken') || lower.includes('fish') || lower.includes('paneer') || lower.includes('egg')) {
    defaultCals = 280;
    defaultProtein = 26;
    defaultCarbs = 6;
    defaultFat = 14;
    defaultScore = 88;
    defaultGrade = 'A';
  } else if (lower.includes('cake') || lower.includes('sweet') || lower.includes('sugar') || lower.includes('soda') || lower.includes('candy')) {
    defaultCals = 380;
    defaultProtein = 3;
    defaultCarbs = 58;
    defaultFat = 15;
    defaultScore = 38;
    defaultGrade = 'D';
    defaultNova = 4;
  } else if (lower.includes('roti') || lower.includes('rice') || lower.includes('bread') || lower.includes('dosa') || lower.includes('paratha')) {
    defaultCals = 220;
    defaultProtein = 6;
    defaultCarbs = 40;
    defaultFat = 4;
    defaultScore = 84;
    defaultGrade = 'B';
  }

  const fallbackItem: FoodSearchItem = {
    id: `ai-${Date.now()}`,
    name: cleanName.charAt(0).toUpperCase() + cleanName.slice(1),
    category: 'Global Staples',
    servingSize: '1 standard serving (100g)',
    calories: defaultCals,
    protein: defaultProtein,
    carbs: defaultCarbs,
    fat: defaultFat,
    healthScore: defaultScore,
    grade: defaultGrade,
    novaGroup: defaultNova,
    baseWeightGrams: 100,
    baseServingUnit: '100g',
    baselineTag: 'Base: 100g (or 1 serving)',
    tags: [lower],
    isAiGenerated: true,
  };

  const prompt = `You are NutriBuddy Nutrition Engine.
Estimate the realistic average nutritional values for 1 standard serving (normalized to 100g baseline) of "${cleanName}".
Return STRICT JSON only matching this schema:
{
  "name": "${cleanName}",
  "servingSize": "100g (standard serving)",
  "calories": number,
  "protein": number,
  "carbs": number,
  "fat": number,
  "healthScore": number,
  "grade": "A" | "B" | "C" | "D" | "F",
  "novaGroup": 1 | 2 | 3 | 4
}
Do not include markdown fences or any other text.`;

  try {
    const aiResponse = await queryVisionAi<any>({
      prompt,
      fallbackMockResponse: fallbackItem,
    });

    if (aiResponse && typeof aiResponse.calories === 'number') {
      return {
        id: `ai-${Date.now()}`,
        name: aiResponse.name || cleanName,
        category: 'Global Staples',
        servingSize: aiResponse.servingSize || '100g (standard serving)',
        calories: Math.round(aiResponse.calories),
        protein: Math.round((aiResponse.protein || 0) * 10) / 10,
        carbs: Math.round((aiResponse.carbs || 0) * 10) / 10,
        fat: Math.round((aiResponse.fat || 0) * 10) / 10,
        healthScore: Math.min(100, Math.max(10, Math.round(aiResponse.healthScore || defaultScore))),
        grade: aiResponse.grade || defaultGrade,
        novaGroup: aiResponse.novaGroup || defaultNova,
        baseWeightGrams: 100,
        baseServingUnit: '100g',
        baselineTag: 'Base: 100g (or 1 serving)',
        tags: [lower],
        isAiGenerated: true,
      };
    }
  } catch (err) {
    console.warn('[FoodSearchService] AI estimation fallback notice:', err);
  }

  return fallbackItem;
}

/**
 * Extracts or returns the standardized base gram weight for a food item.
 */
export function getBaseWeight(item: FoodSearchItem): number {
  if (item.baseWeightGrams && item.baseWeightGrams > 0) {
    return item.baseWeightGrams;
  }
  const match = item.servingSize.match(/(\d+)\s*g/i);
  if (match && match[1]) {
    return parseInt(match[1], 10) || 100;
  }
  return 100;
}

/**
 * Returns the standardized baseline tag text for display above macros.
 */
export function getBaselineTag(item: FoodSearchItem): string {
  return item.baselineTag || 'Base: 100g (or 1 serving)';
}
