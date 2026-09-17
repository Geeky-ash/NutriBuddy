import { useScanHistoryStore, HistoryEntry } from '../../src/store/useScanHistoryStore';

describe('useScanHistoryStore', () => {
  beforeEach(() => {
    useScanHistoryStore.getState().clearHistory();
    useScanHistoryStore.getState().setSearchQuery('');
    useScanHistoryStore.getState().setActiveFilter('ALL');
  });

  it('starts with an empty entries list after clearHistory', () => {
    expect(useScanHistoryStore.getState().entries).toHaveLength(0);
  });

  it('adds history entries and calculates today totals correctly', () => {
    const entry1: HistoryEntry = {
      id: 'test-1',
      timestamp: Date.now(),
      foodName: 'Avocado Toast with Egg',
      scanType: 'LIVE_FOOD',
      healthGrade: 'A',
      healthScore: 88,
      macros: {
        calories: 320,
        protein: 14,
        carbohydrates: 28,
        sugars: 2,
        fat: 18,
        saturatedFat: 3,
        fiber: 6,
        sodium: 210,
      },
      flaggedAdditives: [],
      allergenAlerts: ['Eggs'],
    };

    const entry2: HistoryEntry = {
      id: 'test-2',
      timestamp: Date.now(),
      foodName: 'Organic Greek Yogurt',
      scanType: 'PACKAGED',
      healthGrade: 'A',
      healthScore: 92,
      macros: {
        calories: 120,
        protein: 18,
        carbohydrates: 6,
        sugars: 4,
        fat: 0,
        saturatedFat: 0,
        fiber: 0,
        sodium: 50,
      },
      flaggedAdditives: [],
      allergenAlerts: [],
    };

    useScanHistoryStore.getState().addEntry(entry1);
    useScanHistoryStore.getState().addEntry(entry2);

    const state = useScanHistoryStore.getState();
    expect(state.entries).toHaveLength(2);
    expect(state.getTodayCalories()).toBe(440);
    expect(state.getTodayProtein()).toBe(32);
    expect(state.getAverageScore()).toBe(90);
  });

  it('filters entries by search query', () => {
    const entry1: HistoryEntry = {
      id: 'test-1',
      timestamp: Date.now(),
      foodName: 'Wild Sockeye Salmon',
      brand: 'Ocean Fresh',
      scanType: 'LIVE_FOOD',
      healthGrade: 'A',
      healthScore: 96,
      macros: { calories: 250, protein: 34, carbohydrates: 0, sugars: 0, fat: 12, saturatedFat: 2, fiber: 0, sodium: 90 },
      flaggedAdditives: [],
      allergenAlerts: ['Fish'],
    };

    const entry2: HistoryEntry = {
      id: 'test-2',
      timestamp: Date.now(),
      foodName: 'Almond Milk Latte',
      scanType: 'PACKAGED',
      healthGrade: 'B',
      healthScore: 78,
      macros: { calories: 80, protein: 2, carbohydrates: 10, sugars: 8, fat: 3, saturatedFat: 0, fiber: 1, sodium: 80 },
      flaggedAdditives: [],
      allergenAlerts: ['Tree Nuts'],
    };

    useScanHistoryStore.getState().addEntry(entry1);
    useScanHistoryStore.getState().addEntry(entry2);

    useScanHistoryStore.getState().setSearchQuery('Salmon');
    expect(useScanHistoryStore.getState().getFilteredEntries()).toHaveLength(1);
    expect(useScanHistoryStore.getState().getFilteredEntries()[0].foodName).toBe('Wild Sockeye Salmon');

    useScanHistoryStore.getState().setSearchQuery('latte');
    expect(useScanHistoryStore.getState().getFilteredEntries()).toHaveLength(1);
  });

  it('filters entries by WARNINGS (score < 50 or allergen alerts)', () => {
    const entrySafe: HistoryEntry = {
      id: 'safe-1',
      timestamp: Date.now(),
      foodName: 'Steamed Broccoli',
      scanType: 'LIVE_FOOD',
      healthGrade: 'A',
      healthScore: 98,
      macros: { calories: 40, protein: 3, carbohydrates: 8, sugars: 1, fat: 0, saturatedFat: 0, fiber: 3, sodium: 20 },
      flaggedAdditives: [],
      allergenAlerts: [],
    };

    const entryWarning: HistoryEntry = {
      id: 'warn-1',
      timestamp: Date.now(),
      foodName: 'Ultra Sugary Soda',
      scanType: 'PACKAGED',
      healthGrade: 'F',
      healthScore: 18,
      macros: { calories: 180, protein: 0, carbohydrates: 45, sugars: 44, fat: 0, saturatedFat: 0, fiber: 0, sodium: 40 },
      flaggedAdditives: ['Red 40', 'Caramel Color IV'],
      allergenAlerts: [],
    };

    useScanHistoryStore.getState().addEntry(entrySafe);
    useScanHistoryStore.getState().addEntry(entryWarning);

    useScanHistoryStore.getState().setActiveFilter('WARNINGS');
    const filtered = useScanHistoryStore.getState().getFilteredEntries();
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe('warn-1');
  });

  it('removes entries by ID correctly', () => {
    const entry: HistoryEntry = {
      id: 'removable-1',
      timestamp: Date.now(),
      foodName: 'Snack Item',
      scanType: 'PACKAGED',
      healthGrade: 'C',
      healthScore: 60,
      macros: { calories: 150, protein: 4, carbohydrates: 20, sugars: 10, fat: 5, saturatedFat: 1, fiber: 1, sodium: 100 },
      flaggedAdditives: [],
      allergenAlerts: [],
    };

    useScanHistoryStore.getState().addEntry(entry);
    expect(useScanHistoryStore.getState().entries).toHaveLength(1);

    useScanHistoryStore.getState().removeEntry('removable-1');
    expect(useScanHistoryStore.getState().entries).toHaveLength(0);
  });

  it('calculates daily macro summary and filters by date correctly', () => {
    const targetDate = '2026-09-17';
    const timestampOnDate = new Date('2026-09-17T12:00:00Z').getTime();
    const timestampOtherDate = new Date('2026-09-16T12:00:00Z').getTime();

    const meal1: HistoryEntry = {
      id: 'day-meal-1',
      timestamp: timestampOnDate,
      foodName: 'Oatmeal & Berries',
      scanType: 'LIVE_FOOD',
      healthGrade: 'A',
      healthScore: 92,
      macros: { calories: 350, protein: 12, carbohydrates: 58, sugars: 14, fat: 6, saturatedFat: 1, fiber: 8, sodium: 80 },
      flaggedAdditives: [],
      allergenAlerts: [],
    };

    const meal2: HistoryEntry = {
      id: 'day-meal-2',
      timestamp: timestampOnDate,
      foodName: 'Grilled Chicken Salad',
      scanType: 'LIVE_FOOD',
      healthGrade: 'A',
      healthScore: 94,
      macros: { calories: 420, protein: 45, carbohydrates: 15, sugars: 4, fat: 18, saturatedFat: 3, fiber: 5, sodium: 290 },
      flaggedAdditives: [],
      allergenAlerts: [],
    };

    const mealOther: HistoryEntry = {
      id: 'other-meal',
      timestamp: timestampOtherDate,
      foodName: 'Yesterday Snack',
      scanType: 'PACKAGED',
      healthGrade: 'B',
      healthScore: 70,
      macros: { calories: 200, protein: 5, carbohydrates: 25, sugars: 10, fat: 8, saturatedFat: 2, fiber: 2, sodium: 150 },
      flaggedAdditives: [],
      allergenAlerts: [],
    };

    useScanHistoryStore.getState().addEntry(meal1);
    useScanHistoryStore.getState().addEntry(meal2);
    useScanHistoryStore.getState().addEntry(mealOther);

    // Compute summary for targetDate
    const summary = useScanHistoryStore.getState().getDailySummary(targetDate);
    expect(summary.count).toBe(2);
    expect(summary.calories).toBe(770);
    expect(summary.protein).toBe(57);
    expect(summary.carbs).toBe(73);
    expect(summary.fat).toBe(24);
    expect(summary.averageScore).toBe(93);

    // Filter items for targetDate
    const itemsOnDate = useScanHistoryStore.getState().getFilteredEntries(targetDate);
    expect(itemsOnDate).toHaveLength(2);
    expect(itemsOnDate.map((m) => m.id)).toContain('day-meal-1');
    expect(itemsOnDate.map((m) => m.id)).toContain('day-meal-2');

    // Filter items for yesterday
    const itemsYesterday = useScanHistoryStore.getState().getFilteredEntries('2026-09-16');
    expect(itemsYesterday).toHaveLength(1);
    expect(itemsYesterday[0].id).toBe('other-meal');
  });

  it('runs fetchScans without error to load stored scans into memory and keeps entries empty if DB has 0 records', async () => {
    await expect(useScanHistoryStore.getState().fetchScans()).resolves.toBeUndefined();
    expect(useScanHistoryStore.getState().isInitialized).toBe(true);
    expect(useScanHistoryStore.getState().entries).toHaveLength(0);
    expect(useScanHistoryStore.getState().scans).toHaveLength(0);
  });

  it('deletes meal via deleteScanLog, immediately removing it from state and updating daily summary', async () => {
    const entry: HistoryEntry = {
      id: 'delete-me-123',
      timestamp: Date.now(),
      foodName: 'Grilled Chicken Breast',
      scanType: 'LIVE_FOOD',
      healthGrade: 'A',
      healthScore: 95,
      macros: { calories: 220, protein: 35, carbohydrates: 0, sugars: 0, fat: 4, saturatedFat: 1, fiber: 0, sodium: 120 },
      flaggedAdditives: [],
      allergenAlerts: [],
    };

    useScanHistoryStore.getState().addEntry(entry);
    expect(useScanHistoryStore.getState().entries.some((e) => e.id === 'delete-me-123')).toBe(true);
    expect(useScanHistoryStore.getState().getTodayCalories()).toBe(220);

    await useScanHistoryStore.getState().deleteScanLog('delete-me-123');
    expect(useScanHistoryStore.getState().entries.some((e) => e.id === 'delete-me-123')).toBe(false);
    expect(useScanHistoryStore.getState().scans.some((e) => e.id === 'delete-me-123')).toBe(false);
    expect(useScanHistoryStore.getState().getTodayCalories()).toBe(0);
  });

  it('deletes meal via unified scanStore deleteScanLog function', async () => {
    const { deleteScanLog } = require('../../src/stores/scanStore');

    const entry: HistoryEntry = {
      id: 'delete-store-456',
      timestamp: Date.now(),
      foodName: 'Protein Shake',
      scanType: 'PACKAGED',
      healthGrade: 'A',
      healthScore: 90,
      macros: { calories: 180, protein: 30, carbohydrates: 5, sugars: 1, fat: 2, saturatedFat: 0.5, fiber: 2, sodium: 150 },
      flaggedAdditives: [],
      allergenAlerts: [],
    };

    useScanHistoryStore.getState().addEntry(entry);
    expect(useScanHistoryStore.getState().entries.some((e) => e.id === 'delete-store-456')).toBe(true);

    await deleteScanLog('delete-store-456');
    expect(useScanHistoryStore.getState().entries.some((e) => e.id === 'delete-store-456')).toBe(false);
    expect(useScanHistoryStore.getState().scans.some((e) => e.id === 'delete-store-456')).toBe(false);
  });
});
