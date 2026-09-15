/**
 * NutriBuddy Mascot Orchestration Agent
 * Coordinates real-time emotional reactivity, speech bubble dialogue,
 * animation clips, and haptics for "Bao the Panda" based on scan results.
 */

import * as Haptics from 'expo-haptics';
import { useMascotStore } from '../../../store/useMascotStore';
import { ScannedProduct, LiveMealScanResult } from '../../../types/nutrition';
import { MascotMood } from '../../../types/mascot';

export interface MascotEvaluationInput {
  score: number;
  grade: string;
  flaggedAllergens?: string[];
  additivesCount?: number;
  itemName?: string;
  isLiveFood?: boolean;
}

export function orchestrateMascotReaction(input: MascotEvaluationInput): void {
  const {
    score,
    flaggedAllergens = [],
    additivesCount = 0,
    itemName = 'this food',
    isLiveFood = false,
  } = input;

  const mascotStore = useMascotStore.getState();

  // 1. Acute Allergen Hazard (Highest Priority)
  if (flaggedAllergens.length > 0) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    mascotStore.setMood('SAD');
    mascotStore.setSpeech(
      `Hold on! That has ${flaggedAllergens.join(', ')}. Let's keep you safe!`,
      12000
    );
    return;
  }

  // 2. Unhealthy / Severe Additives / UPF (Score < 45)
  if (score < 45) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    mascotStore.setMood('SAD');

    let speech = `Heavily ultra-processed (${score}/100). Maybe look for a cleaner alternative?`;
    if (additivesCount > 0) {
      speech = `Warning: Flagged ${additivesCount} chemical additive${additivesCount > 1 ? 's' : ''} in ${itemName}.`;
    }

    mascotStore.setSpeech(speech, 10000);
    return;
  }

  // 3. Moderate / Caution (Score 45 to 74)
  if (score < 75) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    mascotStore.setMood('CAUTIOUS');

    const speech = isLiveFood
      ? `Good dish! Consider adding more greens or fiber for better satiety (${score}/100).`
      : `Decent choice, but keep an eye on hidden sugars or sodium (${score}/100).`;

    mascotStore.setSpeech(speech, 9000);
    return;
  }

  // 4. Healthy / Wholesome (Score >= 75)
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  mascotStore.setMood('HAPPY');

  const speech = isLiveFood
    ? `Incredible plate! Wholesome protein and clean nutrients (${score}/100). Bao is thrilled!`
    : `Outstanding! Clean, nourishing choice packed with genuine fuel (${score}/100).`;

  mascotStore.setSpeech(speech, 9000);
}

/**
 * Helper to orchestrate reaction directly from any scan result object.
 */
export function syncMascotWithScanResult(
  result: ScannedProduct | LiveMealScanResult
): void {
  const isLive = 'items' in result;

  if (isLive) {
    const live = result as LiveMealScanResult;
    orchestrateMascotReaction({
      score: live.overallHealthScore,
      grade: live.healthGrade,
      itemName: 'this meal',
      isLiveFood: true,
    });
  } else {
    const packaged = result as ScannedProduct;
    orchestrateMascotReaction({
      score: packaged.healthScore,
      grade: packaged.grade,
      flaggedAllergens: packaged.flaggedAllergens,
      additivesCount: packaged.additivesDetected.length,
      itemName: packaged.name,
      isLiveFood: false,
    });
  }
}
