import {
  CURATED_FOOD_DATABASE,
  searchFoodItems,
  estimateFoodNutritionWithAi,
} from '../../src/services/ai/foodSearchService';
import { useScanHistoryStore } from '../../src/store/useScanHistoryStore';

describe('Global Food Search & Indian Regional Database', () => {
  beforeEach(() => {
    useScanHistoryStore.getState().clearHistory();
  });

  it('contains all required native and regional Indian dishes in search index', () => {
    const requiredIndianDishes = [
      'Poha',
      'Upma',
      'Dosa',
      'Idli',
      'Dal Tadka',
      'Biryani',
      'Chapati',
      'Paneer Tikka',
    ];

    for (const dish of requiredIndianDishes) {
      const results = searchFoodItems(dish);
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(
        results.some((item) =>
          item.name.toLowerCase().includes(dish.toLowerCase())
        )
      ).toBe(true);

      const matchedItem = results[0];
      expect(matchedItem.calories).toBeGreaterThan(0);
      expect(matchedItem.protein).toBeGreaterThanOrEqual(0);
      expect(matchedItem.carbs).toBeGreaterThanOrEqual(0);
      expect(matchedItem.fat).toBeGreaterThanOrEqual(0);
      expect(matchedItem.healthScore).toBeGreaterThan(0);
    }
  });

  it('forces active filter category to ALL when typing so results are never hidden by macro/category pills', () => {
    // If active category was 'Clean Snacks', but user types 'Poha' (which is 'Indian Classics')
    // Normal category filter would return 0 items
    const restrictedResults = searchFoodItems('Poha', 'Clean Snacks', false);
    expect(restrictedResults).toHaveLength(0);

    // With unrestricted global search (forceAllCategory = true or cleanQuery present in searchFoodItems):
    const unrestrictedResults = searchFoodItems('Poha', 'Clean Snacks', true);
    expect(unrestrictedResults.length).toBeGreaterThanOrEqual(1);
    expect(unrestrictedResults[0].name).toContain('Poha');

    // Searching 'Biryani' returns biryani regardless of category
    const biryaniResults = searchFoodItems('Biryani', 'High Protein', true);
    expect(biryaniResults.length).toBeGreaterThanOrEqual(1);
    expect(biryaniResults[0].name).toContain('Biryani');
  });

  it('provides automatic AI / heuristic nutritional estimates for unindexed food queries', async () => {
    const customFood = 'Methi Thepla with Pickle';
    const estimate = await estimateFoodNutritionWithAi(customFood);

    expect(estimate).toBeDefined();
    expect(estimate.name).toContain('Methi');
    expect(estimate.calories).toBeGreaterThan(50);
    expect(estimate.protein).toBeGreaterThan(0);
    expect(estimate.carbs).toBeGreaterThan(0);
    expect(estimate.fat).toBeGreaterThan(0);
    expect(estimate.isAiGenerated).toBe(true);
    expect(['A', 'B', 'C', 'D', 'F']).toContain(estimate.grade);
  });

  it('logs searched food item directly into scan history diary', () => {
    const item = searchFoodItems('Poha')[0];
    expect(item).toBeDefined();

    useScanHistoryStore.getState().addEntry({
      id: `manual-test-1`,
      timestamp: Date.now(),
      foodName: item.name,
      brand: item.category,
      scanType: 'LIVE_FOOD',
      healthGrade: item.grade,
      healthScore: item.healthScore,
      macros: {
        calories: item.calories,
        protein: item.protein,
        carbohydrates: item.carbs,
        sugars: 0,
        fat: item.fat,
        saturatedFat: 0,
        fiber: 0,
        sodium: 0,
      },
      flaggedAdditives: [],
      allergenAlerts: [],
    });

    const entries = useScanHistoryStore.getState().entries;
    expect(entries).toHaveLength(1);
    expect(entries[0].foodName).toContain('Poha');
    expect(useScanHistoryStore.getState().getTodayCalories()).toBe(item.calories);
  });

  it('strips long descriptive parentheticals from food names for clean minimalist display', () => {
    const { formatDisplayName } = require('../../src/services/ai/foodSearchService');
    expect(formatDisplayName('Poha (Flattened Rice with Mustard & Peanuts)')).toBe('Poha');
    expect(formatDisplayName('Upma (Savory Semolina with Veggies)')).toBe('Upma');
    expect(formatDisplayName('Steamed Idli with Sambar (2 pieces)')).toBe('Steamed Idli with Sambar');
    expect(formatDisplayName('Grilled Paneer Tikka (Tandoori)')).toBe('Grilled Paneer Tikka');
  });

  it('standardizes base nutrition to 100g baseline across database items and helpers', () => {
    const { getBaseWeight, getBaselineTag } = require('../../src/services/ai/foodSearchService');

    for (const item of CURATED_FOOD_DATABASE) {
      expect(item.baseWeightGrams).toBeDefined();
      expect(item.baseWeightGrams).toBe(100);
      expect(item.baselineTag).toBe('Base: 100g (or 1 serving)');
      expect(getBaseWeight(item)).toBe(100);
      expect(getBaselineTag(item)).toBe('Base: 100g (or 1 serving)');
    }
  });

  it('accurately calculates real-time live scaled calories and macros for portion quantity stepper', () => {
    const chilaMatches = searchFoodItems('Moong Dal Chila');
    expect(chilaMatches.length).toBeGreaterThanOrEqual(1);
    const chila = chilaMatches[0];

    // Base values per 100g
    expect(chila.calories).toBe(240);
    expect(chila.protein).toBe(12.0);
    expect(chila.carbs).toBe(32.0);
    expect(chila.fat).toBe(6.0);

    // 3x portion multiplier: (e.g. "+ Log 3x Moong Dal Chila (720 kcal) to Diary")
    const quantityMultiplier = 3;
    const scaledCalories = Math.round(chila.calories * quantityMultiplier);
    const scaledProtein = Math.round(chila.protein * quantityMultiplier * 10) / 10;
    const scaledCarbs = Math.round(chila.carbs * quantityMultiplier * 10) / 10;
    const scaledFat = Math.round(chila.fat * quantityMultiplier * 10) / 10;

    expect(scaledCalories).toBe(720);
    expect(scaledProtein).toBe(36.0);
    expect(scaledCarbs).toBe(96.0);
    expect(scaledFat).toBe(18.0);
  });

  it('commits scaled portion entries via addScanLog to scan history with accurate daily totals', () => {
    const chila = searchFoodItems('Moong Dal Chila')[0];
    const quantity = 3;
    const scaledCalories = Math.round(chila.calories * quantity);
    const scaledProtein = Math.round(chila.protein * quantity * 10) / 10;
    const scaledCarbs = Math.round(chila.carbs * quantity * 10) / 10;
    const scaledFat = Math.round(chila.fat * quantity * 10) / 10;

    useScanHistoryStore.getState().addScanLog({
      id: `manual-chila-3x`,
      timestamp: Date.now(),
      foodName: `Moong Dal Chila (3x)`,
      brand: chila.category,
      scanType: 'LIVE_FOOD',
      healthGrade: chila.grade,
      healthScore: chila.healthScore,
      macros: {
        calories: scaledCalories,
        protein: scaledProtein,
        carbohydrates: scaledCarbs,
        sugars: 0,
        fat: scaledFat,
        saturatedFat: 0,
        fiber: 0,
        sodium: 0,
      },
      flaggedAdditives: [],
      allergenAlerts: [],
      actionableTips: [
        `Standard base: 100g (240 kcal). Scaled portion: 3x (300g) containing 720 kcal, 36g protein.`,
      ],
    });

    const entries = useScanHistoryStore.getState().entries;
    expect(entries).toHaveLength(1);
    expect(entries[0].foodName).toBe('Moong Dal Chila (3x)');
    expect(entries[0].macros.calories).toBe(720);
    expect(entries[0].macros.protein).toBe(36);
    expect(entries[0].macros.carbohydrates).toBe(96);
    expect(entries[0].macros.fat).toBe(18);
    expect(useScanHistoryStore.getState().getTodayCalories()).toBe(720);
    expect(useScanHistoryStore.getState().getTodayProtein()).toBe(36);
  });
});
