import { create } from 'zustand';

export interface UserGoals {
  dailyCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
}

export const ALLERGEN_LIST = [
  'Peanuts',
  'Tree Nuts',
  'Dairy & Milk',
  'Eggs',
  'Gluten & Wheat',
  'Soy & Soybeans',
  'Fish',
  'Shellfish',
  'Sesame',
  'Sulfites',
] as const;

export type AllergenName = typeof ALLERGEN_LIST[number];

export const DIETARY_MODES = [
  'Clean & Whole Foods',
  'High Protein',
  'Vegan',
  'Vegetarian',
  'Keto / Low-Carb',
  'Low FODMAP',
  'Diabetic-Friendly',
] as const;

export type DietaryModeName = typeof DIETARY_MODES[number];

export interface PersonalMetrics {
  gender: string;
  heightCm: number;
  weightKg: number;
  birthDate: string;
}

interface ProfileState {
  userName: string;
  userTag: string;
  goals: UserGoals;
  personalMetrics: PersonalMetrics;
  activeAllergens: Record<string, boolean>;
  activeDietaryModes: Record<string, boolean>;
  mascotVoiceEnabled: boolean;
  hapticsEnabled: boolean;
  avatarUrl: string | null;

  // Actions
  setUserName: (name: string) => void;
  setUserTag: (tag: string) => void;
  setAvatarUrl: (url: string | null) => void;
  setPersonalMetrics: (metrics: Partial<PersonalMetrics>) => void;
  toggleAllergen: (allergen: string) => void;
  toggleDietaryMode: (mode: string) => void;
  setGoals: (newGoals: Partial<UserGoals>) => void;
  setMascotVoiceEnabled: (enabled: boolean) => void;
  setHapticsEnabled: (enabled: boolean) => void;

  // Helpers
  getSelectedAllergensList: () => string[];
  getSelectedDietaryModesList: () => string[];
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  userName: 'Alex Sharma',
  userTag: 'Mindful Eater · Free Tier',
  goals: {
    dailyCalories: 2100,
    targetProtein: 130,
    targetCarbs: 220,
    targetFat: 65,
  },
  personalMetrics: {
    gender: 'Male',
    heightCm: 175.0,
    weightKg: 63.0,
    birthDate: 'Jan 2, 2005',
  },
  activeAllergens: {
    'Peanuts': true,
    'Tree Nuts': true,
    'Dairy & Milk': false,
    'Eggs': false,
    'Gluten & Wheat': false,
    'Soy & Soybeans': false,
    'Fish': false,
    'Shellfish': false,
    'Sesame': false,
    'Sulfites': false,
  },
  activeDietaryModes: {
    'Clean & Whole Foods': true,
    'High Protein': true,
    'Vegan': false,
    'Vegetarian': false,
    'Keto / Low-Carb': false,
    'Low FODMAP': false,
    'Diabetic-Friendly': false,
  },
  mascotVoiceEnabled: true,
  hapticsEnabled: true,
  avatarUrl: null,

  setUserName: (name) => set({ userName: name }),
  setUserTag: (tag) => set({ userTag: tag }),
  setAvatarUrl: (url) => set({ avatarUrl: url }),
  setPersonalMetrics: (metrics) =>
    set((state) => ({
      personalMetrics: { ...state.personalMetrics, ...metrics },
    })),


  toggleAllergen: (allergen) =>
    set((state) => ({
      activeAllergens: {
        ...state.activeAllergens,
        [allergen]: !state.activeAllergens[allergen],
      },
    })),

  toggleDietaryMode: (mode) =>
    set((state) => ({
      activeDietaryModes: {
        ...state.activeDietaryModes,
        [mode]: !state.activeDietaryModes[mode],
      },
    })),

  setGoals: (newGoals) =>
    set((state) => ({
      goals: { ...state.goals, ...newGoals },
    })),

  setMascotVoiceEnabled: (enabled) => set({ mascotVoiceEnabled: enabled }),

  setHapticsEnabled: (enabled) => set({ hapticsEnabled: enabled }),

  getSelectedAllergensList: () => {
    const { activeAllergens } = get();
    return Object.keys(activeAllergens).filter((key) => activeAllergens[key]);
  },

  getSelectedDietaryModesList: () => {
    const { activeDietaryModes } = get();
    return Object.keys(activeDietaryModes).filter((key) => activeDietaryModes[key]);
  },
}));
