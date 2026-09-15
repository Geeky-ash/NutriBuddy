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
});
