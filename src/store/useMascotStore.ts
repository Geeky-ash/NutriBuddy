import { create } from 'zustand';
import { MascotMood, MascotSkinId, MascotAccessoryId } from '../types/mascot';

interface MascotState {
  mood: MascotMood;
  speechText: string;
  isSpeechVisible: boolean;
  currentAnimation: string;
  activeSkin: MascotSkinId;
  activeAccessory: MascotAccessoryId;

  // Actions
  setMood: (mood: MascotMood) => void;
  setSpeech: (text: string, autoDismissAfterMs?: number) => void;
  dismissSpeech: () => void;
  setSkin: (skin: MascotSkinId) => void;
  setAccessory: (accessory: MascotAccessoryId) => void;
  triggerReactivityForScore: (score: number, allergens?: string[]) => void;
  interact: () => void;
}

const PLAYFUL_PHRASES = [
  "Hi friend! Ready to find some nourishing fuel?",
  "Point your camera at a meal or food label!",
  "I'm Bao! I love fresh greens, berries, and clean snacks!",
  "Tap a food item anytime to see what's inside!",
  "Looking sharp! Love this outfit!",
];

export const useMascotStore = create<MascotState>((set, get) => ({
  mood: 'HAPPY',
  speechText: "Hi there! I'm Bao. Point at any food or label to get started!",
  isSpeechVisible: true,
  currentAnimation: 'idle_wave',
  activeSkin: 'classic_panda',
  activeAccessory: 'none',

  setMood: (mood) => set({ mood }),

  setSpeech: (text, autoDismissAfterMs) => {
    set({ speechText: text, isSpeechVisible: true });
    if (autoDismissAfterMs && autoDismissAfterMs > 0) {
      setTimeout(() => {
        // Only dismiss if the text hasn't changed since
        if (get().speechText === text) {
          set({ isSpeechVisible: false });
        }
      }, autoDismissAfterMs);
    }
  },

  dismissSpeech: () => set({ isSpeechVisible: false }),

  setSkin: (skin) =>
    set({
      activeSkin: skin,
      speechText: "New fur coat look! How do I look?",
      isSpeechVisible: true,
    }),

  setAccessory: (accessory) =>
    set({
      activeAccessory: accessory,
      speechText: accessory === 'none' ? "Au naturel!" : "Sporting my new gear!",
      isSpeechVisible: true,
    }),

  triggerReactivityForScore: (score, allergens = []) => {
    if (allergens.length > 0) {
      set({
        mood: 'SAD',
        speechText: `Hold on! Contains ${allergens.join(', ')}. Let's keep you safe!`,
        isSpeechVisible: true,
        currentAnimation: 'alarm_warning',
      });
      return;
    }

    if (score >= 75) {
      set({
        mood: 'HAPPY',
        speechText: `Outstanding! A wholesome choice packed with good nutrients (${score}/100).`,
        isSpeechVisible: true,
        currentAnimation: 'bounce_celebrate',
      });
    } else if (score >= 50) {
      set({
        mood: 'CAUTIOUS',
        speechText: `Decent, but watch the processed ingredients or added sugars (${score}/100).`,
        isSpeechVisible: true,
        currentAnimation: 'scratch_head',
      });
    } else {
      set({
        mood: 'SAD',
        speechText: `Heavily ultra-processed (${score}/100). Maybe look for a cleaner alternative?`,
        isSpeechVisible: true,
        currentAnimation: 'pout_concerned',
      });
    }
  },

  interact: () => {
    const randomPhrase = PLAYFUL_PHRASES[Math.floor(Math.random() * PLAYFUL_PHRASES.length)];
    set({
      mood: 'HAPPY',
      speechText: randomPhrase,
      isSpeechVisible: true,
      currentAnimation: 'tap_wiggle',
    });
  },
}));
