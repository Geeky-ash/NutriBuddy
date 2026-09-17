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
});
