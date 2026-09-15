import { create } from 'zustand';
import { MacroNutrients, HealthGrade } from '../types/nutrition';
import { ScanType } from '../types/scan';

export interface HistoryEntry {
  id: string;
  timestamp: number;
  foodName: string;
  brand?: string;
  scanType: ScanType;
  healthGrade: HealthGrade;
  healthScore: number;
  macros: MacroNutrients;
  flaggedAdditives: string[];
  allergenAlerts: string[];
  imageUri?: string;
  actionableTips?: string[];
  rawResult?: any;
}

interface ScanHistoryState {
  entries: HistoryEntry[];
  searchQuery: string;
  activeFilter: 'ALL' | 'PACKAGED' | 'LIVE_FOOD' | 'WARNINGS';

  // Actions
  addEntry: (entry: HistoryEntry) => void;
  removeEntry: (id: string) => void;
  clearHistory: () => void;
  setSearchQuery: (query: string) => void;
  setActiveFilter: (filter: 'ALL' | 'PACKAGED' | 'LIVE_FOOD' | 'WARNINGS') => void;

  // Computed helper getters
  getFilteredEntries: () => HistoryEntry[];
  getTodayCalories: () => number;
  getTodayProtein: () => number;
  getAverageScore: () => number;
}

const SEED_ENTRIES: HistoryEntry[] = [
  {
    id: 'seed-1',
    timestamp: Date.now() - 1000 * 60 * 45, // 45 mins ago
    foodName: 'Grilled Atlantic Salmon & Broccoli',
    brand: 'Home Prepared',
    scanType: 'LIVE_FOOD',
    healthGrade: 'A',
    healthScore: 95,
    macros: {
      calories: 372,
      protein: 37,
      carbohydrates: 8,
      sugars: 1.8,
      fat: 20.5,
      saturatedFat: 3.6,
      fiber: 3.2,
      sodium: 160,
    },
    flaggedAdditives: [],
    allergenAlerts: [],
    actionableTips: ['Drizzle lemon juice to maximize iron and micronutrient absorption.'],
  },
  {
    id: 'seed-2',
    timestamp: Date.now() - 1000 * 60 * 60 * 4, // 4 hours ago
    foodName: 'Organic Greek Plain Yogurt',
    brand: 'Stonyfield Farm',
    scanType: 'PACKAGED',
    healthGrade: 'A',
    healthScore: 92,
    macros: {
      calories: 100,
      protein: 17,
      carbohydrates: 6,
      sugars: 5,
      fat: 0,
      saturatedFat: 0,
      fiber: 0,
      sodium: 60,
    },
    flaggedAdditives: [],
    allergenAlerts: ['Milk / Dairy'],
    actionableTips: ['Great probiotic whole food with zero added sugars.'],
  },
  {
    id: 'seed-3',
    timestamp: Date.now() - 1000 * 60 * 60 * 24, // Yesterday
    foodName: 'Crunchy Peanut Butter Energy Bar',
    brand: 'Snack Brand',
    scanType: 'PACKAGED',
    healthGrade: 'D',
    healthScore: 42,
    macros: {
      calories: 260,
      protein: 5,
      carbohydrates: 34,
      sugars: 24,
      addedSugars: 22,
      fat: 11,
      saturatedFat: 4,
      fiber: 1,
      sodium: 220,
    },
    flaggedAdditives: ['High Fructose Corn Syrup', 'Caramel Color (E150d)'],
    allergenAlerts: ['Peanuts'],
    actionableTips: ['Very high in added sugars. Consider swapping for raw roasted almonds.'],
  },
];

export const useScanHistoryStore = create<ScanHistoryState>((set, get) => ({
  entries: SEED_ENTRIES,
  searchQuery: '',
  activeFilter: 'ALL',

  addEntry: (entry) =>
    set((state) => ({
      entries: [entry, ...state.entries.filter((e) => e.id !== entry.id)],
    })),

  removeEntry: (id) =>
    set((state) => ({
      entries: state.entries.filter((e) => e.id !== id),
    })),

  clearHistory: () => set({ entries: [] }),

  setSearchQuery: (query) => set({ searchQuery: query }),

  setActiveFilter: (filter) => set({ activeFilter: filter }),

  getFilteredEntries: () => {
    const { entries, searchQuery, activeFilter } = get();
    const query = searchQuery.trim().toLowerCase();

    return entries.filter((item) => {
      // Search filter
      const matchesSearch =
        query === '' ||
        item.foodName.toLowerCase().includes(query) ||
        (item.brand && item.brand.toLowerCase().includes(query));

      if (!matchesSearch) return false;

      // Category filter
      if (activeFilter === 'ALL') return true;
      if (activeFilter === 'PACKAGED') return item.scanType === 'PACKAGED';
      if (activeFilter === 'LIVE_FOOD') return item.scanType === 'LIVE_FOOD';
      if (activeFilter === 'WARNINGS') {
        return (
          item.healthScore < 50 ||
          item.allergenAlerts.length > 0 ||
          item.flaggedAdditives.length > 0
        );
      }

      return true;
    });
  },

  getTodayCalories: () => {
    const { entries } = get();
    const startOfToday = new Date().setHours(0, 0, 0, 0);
    return entries
      .filter((e) => e.timestamp >= startOfToday)
      .reduce((sum, e) => sum + (e.macros.calories || 0), 0);
  },

  getTodayProtein: () => {
    const { entries } = get();
    const startOfToday = new Date().setHours(0, 0, 0, 0);
    return entries
      .filter((e) => e.timestamp >= startOfToday)
      .reduce((sum, e) => sum + (e.macros.protein || 0), 0);
  },

  getAverageScore: () => {
    const { entries } = get();
    if (entries.length === 0) return 0;
    const total = entries.reduce((sum, e) => sum + e.healthScore, 0);
    return Math.round(total / entries.length);
  },
}));
