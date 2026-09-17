import { create } from 'zustand';
import { MacroNutrients, HealthGrade } from '../types/nutrition';
import { ScanType } from '../types/scan';
import {
  getScans,
  insertScan,
  deleteScan,
  clearScans,
  syncScanToSupabase,
  ScanRecord,
} from '../services/storage/database';
import { useAuthStore } from './useAuthStore';

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

export interface DailyMacroSummary {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  count: number;
  averageScore: number;
}

interface ScanHistoryState {
  entries: HistoryEntry[];
  searchQuery: string;
  activeFilter: 'ALL' | 'PACKAGED' | 'LIVE_FOOD' | 'WARNINGS';
  isInitialized: boolean;

  // Actions
  fetchScans: () => Promise<void>;
  addEntry: (entry: HistoryEntry) => void;
  removeEntry: (id: string) => void;
  clearHistory: () => void;
  setSearchQuery: (query: string) => void;
  setActiveFilter: (filter: 'ALL' | 'PACKAGED' | 'LIVE_FOOD' | 'WARNINGS') => void;

  // Computed helper getters
  getFilteredEntries: (selectedDate?: string) => HistoryEntry[];
  getTodayCalories: () => number;
  getTodayProtein: () => number;
  getAverageScore: () => number;
  getDailySummary: (dateString: string) => DailyMacroSummary;
  getDatesWithEntries: () => Record<string, boolean>;
}

function getGradeFromScore(score: number): HealthGrade {
  if (score >= 80) return 'A';
  if (score >= 65) return 'B';
  if (score >= 50) return 'C';
  if (score >= 35) return 'D';
  return 'F';
}

export function formatDateToKey(timestamp: number | Date): string {
  const d = new Date(timestamp);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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
  isInitialized: false,

  fetchScans: async () => {
    try {
      const dbScans = await getScans();
      if (dbScans && dbScans.length > 0) {
        const loadedEntries: HistoryEntry[] = dbScans.map((row) => ({
          id: row.id,
          timestamp: new Date(row.created_at).getTime(),
          foodName: row.food_name,
          scanType: (row.food_name.includes('Prepared') ? 'LIVE_FOOD' : 'PACKAGED') as ScanType,
          healthGrade: getGradeFromScore(row.health_rating),
          healthScore: Math.round(row.health_rating),
          macros: {
            calories: row.calories,
            protein: row.protein,
            carbohydrates: row.carbs,
            sugars: 0,
            fat: row.fat,
            saturatedFat: 0,
            fiber: 0,
            sodium: 0,
          },
          flaggedAdditives: [],
          allergenAlerts: [],
          imageUri: row.image_uri || undefined,
        }));

        set((state) => {
          const entryMap = new Map<string, HistoryEntry>();
          // DB scans take precedence
          loadedEntries.forEach((e) => entryMap.set(e.id, e));
          // Keep existing or seed entries if not in DB
          state.entries.forEach((e) => {
            if (!entryMap.has(e.id)) {
              entryMap.set(e.id, e);
            }
          });

          return {
            entries: Array.from(entryMap.values()).sort((a, b) => b.timestamp - a.timestamp),
            isInitialized: true,
          };
        });
      } else {
        set({ isInitialized: true });
      }
    } catch (err) {
      console.warn('[ScanHistoryStore] fetchScans error:', err);
      set({ isInitialized: true });
    }
  },

  addEntry: (entry) => {
    set((state) => ({
      entries: [entry, ...state.entries.filter((e) => e.id !== entry.id)],
    }));

    // Local SQLite persistence & background cloud sync
    const currentUserId = useAuthStore.getState().user?.id || null;
    const record: ScanRecord = {
      id: entry.id,
      user_id: currentUserId,
      food_name: entry.foodName,
      calories: entry.macros.calories || 0,
      protein: entry.macros.protein || 0,
      carbs: entry.macros.carbohydrates || 0,
      fat: entry.macros.fat || 0,
      nova_score: entry.healthScore >= 70 ? 1 : entry.healthScore >= 50 ? 2 : 4,
      health_rating: entry.healthScore,
      image_uri: entry.imageUri || null,
      created_at: new Date(entry.timestamp).toISOString(),
    };

    insertScan(record).catch((err) =>
      console.warn('[ScanHistoryStore] SQLite auto-insert error:', err)
    );

    syncScanToSupabase(record, currentUserId || undefined).catch((err) =>
      console.warn('[ScanHistoryStore] Supabase background sync notice:', err)
    );
  },

  removeEntry: (id) => {
    set((state) => ({
      entries: state.entries.filter((e) => e.id !== id),
    }));
    deleteScan(id).catch((err) =>
      console.warn('[ScanHistoryStore] SQLite delete error:', err)
    );
  },

  clearHistory: () => {
    set({ entries: [] });
    clearScans().catch((err) =>
      console.warn('[ScanHistoryStore] SQLite clear error:', err)
    );
  },

  setSearchQuery: (query) => set({ searchQuery: query }),

  setActiveFilter: (filter) => set({ activeFilter: filter }),

  getFilteredEntries: (selectedDate?: string) => {
    const { entries, searchQuery, activeFilter } = get();
    const query = searchQuery.trim().toLowerCase();

    return entries.filter((item) => {
      // Date filter (if selected)
      if (selectedDate) {
        const itemDate = formatDateToKey(item.timestamp);
        if (itemDate !== selectedDate) return false;
      }

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
    const todayKey = formatDateToKey(Date.now());
    return get().getDailySummary(todayKey).calories;
  },

  getTodayProtein: () => {
    const todayKey = formatDateToKey(Date.now());
    return get().getDailySummary(todayKey).protein;
  },

  getAverageScore: () => {
    const { entries } = get();
    if (entries.length === 0) return 0;
    const total = entries.reduce((sum, e) => sum + e.healthScore, 0);
    return Math.round(total / entries.length);
  },

  getDailySummary: (dateString: string) => {
    const { entries } = get();
    const dayEntries = entries.filter((e) => formatDateToKey(e.timestamp) === dateString);

    if (dayEntries.length === 0) {
      return {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        count: 0,
        averageScore: 0,
      };
    }

    const totals = dayEntries.reduce(
      (acc, item) => {
        acc.calories += Math.round(item.macros.calories || 0);
        acc.protein += Math.round(item.macros.protein || 0);
        acc.carbs += Math.round(item.macros.carbohydrates || 0);
        acc.fat += Math.round(item.macros.fat || 0);
        acc.totalScore += item.healthScore;
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0, totalScore: 0 }
    );

    return {
      calories: totals.calories,
      protein: totals.protein,
      carbs: totals.carbs,
      fat: totals.fat,
      count: dayEntries.length,
      averageScore: Math.round(totals.totalScore / dayEntries.length),
    };
  },

  getDatesWithEntries: () => {
    const { entries } = get();
    const map: Record<string, boolean> = {};
    entries.forEach((e) => {
      const key = formatDateToKey(e.timestamp);
      map[key] = true;
    });
    return map;
  },
}));

// Automatically fetch stored scans on store initialization
useScanHistoryStore.getState().fetchScans();
