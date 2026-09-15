import {
  PackagedScanLLMResponseSchema,
  processPackagedLabelScan,
} from '../../src/services/ai/agents/packagedScanAgent';
import {
  LiveFoodScanLLMResponseSchema,
  processLiveFoodScan,
} from '../../src/services/ai/agents/liveFoodAgent';
import { parseFoodLabel, cleanOcrText, tokenizeIngredients } from '../../src/services/ai/ocrParser';
import { calculateNutritionScore } from '../../src/services/ai/nutritionScorer';
import { orchestrateMascotReaction } from '../../src/services/ai/agents/mascotAgent';
import { useMascotStore } from '../../src/store/useMascotStore';

describe('PackagedScanLLMResponseSchema Validation', () => {
  it('successfully validates a complete packaged food response', () => {
    const validPayload = {
      name: 'Organic Almond Milk',
      brand: 'Califia Farms',
      servingSize: '240ml',
      ingredientsText: 'Almondmilk (Water, Almonds), Calcium Carbonate, Sea Salt, Potassium Citrate.',
      macros: {
        calories: 35,
        protein: 1,
        carbohydrates: 1,
        sugars: 0,
        addedSugars: 0,
        fat: 3,
        saturatedFat: 0,
        fiber: 1,
        sodium: 140,
      },
      flaggedAdditives: [],
      allergensFound: ['Tree Nuts'],
      actionableTips: ['Clean dairy alternative with zero added sugars.'],
    };

    const parsed = PackagedScanLLMResponseSchema.parse(validPayload);
    expect(parsed.name).toBe('Organic Almond Milk');
    expect(parsed.macros.calories).toBe(35);
    expect(parsed.allergensFound).toContain('Tree Nuts');
  });

  it('fails validation when mandatory fields are missing or wrong types', () => {
    const invalidPayload = {
      // missing name
      macros: 'not an object',
    };

    expect(() => PackagedScanLLMResponseSchema.parse(invalidPayload)).toThrow();
  });
});

describe('LiveFoodScanLLMResponseSchema Validation', () => {
  it('successfully validates a plated meal with detected components and bounding boxes', () => {
    const validPlatePayload = {
      dishName: 'Mediterranean Grilled Chicken Salad',
      items: [
        {
          name: 'Grilled Chicken Breast',
          estimatedGrams: 150,
          calories: 240,
          protein: 45,
          carbohydrates: 0,
          fat: 5,
          fiber: 0,
          confidence: 0.98,
          boundingBox: { x: 15, y: 25, width: 40, height: 30 },
        },
        {
          name: 'Mixed Leaf Greens',
          estimatedGrams: 80,
          calories: 20,
          protein: 1.5,
          carbohydrates: 3,
          fat: 0.2,
          fiber: 2,
          confidence: 0.93,
          boundingBox: { x: 50, y: 30, width: 40, height: 40 },
        },
      ],
      totalCalories: 260,
      totalProtein: 46.5,
      totalCarbs: 3,
      totalFat: 5.2,
      totalFiber: 2,
      glycemicImpact: 'LOW' as const,
      dietaryHighlights: ['Lean protein rich', 'Very low glycemic index'],
      actionableTips: ['Drizzle extra virgin olive oil to increase vitamin absorption.'],
    };

    const parsed = LiveFoodScanLLMResponseSchema.parse(validPlatePayload);
    expect(parsed.dishName).toBe('Mediterranean Grilled Chicken Salad');
    expect(parsed.items).toHaveLength(2);
    expect(parsed.items[0].boundingBox?.x).toBe(15);
  });
});

describe('OCR Parser & Additive Tokenizer', () => {
  it('cleans OCR text and normalizes prefixes', () => {
    const raw = 'Ingredients: Water, Sugar, Citric Acid. May contain traces of soy.';
    const cleaned = cleanOcrText(raw);
    expect(cleaned).not.toContain('Ingredients:');
    expect(cleaned).toContain('Water, Sugar, Citric Acid');
  });

  it('tokenizes nested parentheses properly', () => {
    const raw = 'Flour (Wheat Flour, Niacin, Iron), Water, Yeast';
    const tokens = tokenizeIngredients(raw);
    expect(tokens).toEqual(['Flour (Wheat Flour, Niacin, Iron)', 'Water', 'Yeast']);
  });

  it('detects high-risk additives and hidden sugars', () => {
    const label = 'Carbonated Water, High Fructose Corn Syrup, Caramel Color, Red 40 (E129), Sodium Benzoate, Aspartame.';
    const result = parseFoodLabel(label);

    const additiveCodes = result.additives.map((a) => a.code);
    expect(additiveCodes).toContain('E129'); // Red 40
    expect(additiveCodes).toContain('E211'); // Sodium Benzoate
    expect(additiveCodes).toContain('E951'); // Aspartame
    expect(result.hiddenSugars).toContain('high fructose corn syrup');
    expect(result.isUltraProcessed).toBe(true);
  });

  it('flags user-specified allergens accurately', () => {
    const label = 'Rolled Oats, Organic Peanut Butter, Honey, Sea Salt.';
    const result = parseFoodLabel(label, ['Peanuts']);
    expect(result.flaggedAllergens).toContain('Peanuts');
  });
});

describe('Deterministic Nutrition Scorer', () => {
  it('scores clean whole foods as Grade A (Score >= 85)', () => {
    const result = calculateNutritionScore({
      macros: {
        calories: 120,
        protein: 24,
        carbohydrates: 0,
        sugars: 0,
        fat: 2.5,
        saturatedFat: 0.5,
        fiber: 0,
        sodium: 80,
      },
      additives: [],
      novaGroupOverride: 1,
    });

    expect(result.healthScore).toBeGreaterThanOrEqual(85);
    expect(result.grade).toBe('A');
    expect(result.novaGroup).toBe(1);
  });

  it('scores ultra-processed high-sugar foods with additives as Grade D or F (Score < 50)', () => {
    const result = calculateNutritionScore({
      macros: {
        calories: 380,
        protein: 1,
        carbohydrates: 65,
        sugars: 42,
        addedSugars: 40,
        fat: 14,
        saturatedFat: 8,
        fiber: 0,
        sodium: 650,
      },
      additives: [
        { code: 'E129', name: 'Red 40', riskTier: 'high_risk', description: 'Synthetic dye' },
        { code: 'E320', name: 'BHA', riskTier: 'high_risk', description: 'Preservative' },
      ],
      isUltraProcessedOverride: true,
    });

    expect(result.healthScore).toBeLessThan(50);
    expect(['D', 'F']).toContain(result.grade);
    expect(result.novaGroup).toBe(4);
  });
});

describe('Mascot Orchestration Agent', () => {
  it('sets HAPPY mood and congratulatory speech for score >= 75', () => {
    orchestrateMascotReaction({
      score: 92,
      grade: 'A',
      itemName: 'Greek Yogurt',
    });

    const mascotState = useMascotStore.getState();
    expect(mascotState.mood).toBe('HAPPY');
    expect(mascotState.speechText).toContain('92/100');
  });

  it('sets CAUTIOUS mood for score between 45 and 74', () => {
    orchestrateMascotReaction({
      score: 65,
      grade: 'C',
      itemName: 'Granola Bar',
    });

    const mascotState = useMascotStore.getState();
    expect(mascotState.mood).toBe('CAUTIOUS');
  });

  it('prioritizes SAD mood and urgent alarm if allergens are present', () => {
    orchestrateMascotReaction({
      score: 95, // High score item
      grade: 'A',
      flaggedAllergens: ['Peanuts'],
    });

    const mascotState = useMascotStore.getState();
    expect(mascotState.mood).toBe('SAD');
    expect(mascotState.speechText).toContain('Peanuts');
  });
});
