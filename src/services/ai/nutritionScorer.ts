/**
 * NutriBuddy Deterministic Nutrition Scoring Engine
 * Pure mathematical scoring (0-100) synthesizing nutrient profiling,
 * NOVA processing classification, and chemical additive risk deductions.
 */

import { MacroNutrients, AdditiveInfo, HealthGrade, NovaGroup } from '../../types/nutrition';

export interface NutritionScoreParams {
  macros: MacroNutrients;
  additives?: AdditiveInfo[];
  novaGroupOverride?: NovaGroup;
  isUltraProcessedOverride?: boolean;
  ingredientCount?: number;
}

export interface NutritionScoreResult {
  healthScore: number;
  grade: HealthGrade;
  novaGroup: NovaGroup;
  positives: string[];
  negatives: string[];
}

export function calculateNutritionScore(params: NutritionScoreParams): NutritionScoreResult {
  const {
    macros,
    additives = [],
    novaGroupOverride,
    isUltraProcessedOverride = false,
    ingredientCount = 3,
  } = params;

  let score = 100;
  const positives: string[] = [];
  const negatives: string[] = [];

  // 1. Chemical Additives Deductions
  let additiveDeductions = 0;
  let highRiskCount = 0;
  let cautionCount = 0;

  for (const additive of additives) {
    if (additive.riskTier === 'high_risk') {
      additiveDeductions += 14;
      highRiskCount++;
      negatives.push(`Contains high-risk additive: ${additive.name}`);
    } else if (additive.riskTier === 'caution') {
      additiveDeductions += 6;
      cautionCount++;
      negatives.push(`Contains moderate caution additive: ${additive.name}`);
    }
  }
  // Cap additive deductions at -40 points
  score -= Math.min(additiveDeductions, 40);

  // 2. NOVA Classification Determination
  let novaGroup: NovaGroup = 1;
  if (novaGroupOverride) {
    novaGroup = novaGroupOverride;
  } else if (highRiskCount > 0 || cautionCount >= 2 || isUltraProcessedOverride) {
    novaGroup = 4;
  } else if (ingredientCount > 6 || macros.sugars > 22 || macros.sodium > 800) {
    novaGroup = 3;
  } else if (ingredientCount <= 2 && (macros.fat > 80 || macros.sugars > 80)) {
    novaGroup = 2;
  } else {
    novaGroup = 1;
  }

  // NOVA 4 Ultra-processed penalty
  if (novaGroup === 4) {
    score -= 15;
    negatives.push('Classified as Ultra-Processed Food (NOVA Group 4)');
  } else if (novaGroup === 1) {
    score += 6;
    positives.push('Minimally processed whole food (NOVA Group 1)');
  }

  // 3. Sugars Deductions (Base per 100g)
  if (macros.sugars > 5) {
    const excessSugar = macros.sugars - 5;
    const sugarDeduction = Math.min(Math.round(excessSugar * 1.6), 25);
    score -= sugarDeduction;
    if (macros.sugars >= 15) {
      negatives.push(`High in sugar (${macros.sugars}g per serving/100g)`);
    }
  } else {
    positives.push('Naturally low in sugars');
  }

  // Added Sugars extra penalty if provided
  if (macros.addedSugars && macros.addedSugars > 0) {
    score -= Math.min(Math.round(macros.addedSugars * 1.2), 12);
    negatives.push(`Contains ${macros.addedSugars}g added refined sugars`);
  }

  // 4. Saturated Fats Deductions
  if (macros.saturatedFat > 3) {
    const excessSatFat = macros.saturatedFat - 3;
    const satFatDeduction = Math.min(Math.round(excessSatFat * 2.5), 18);
    score -= satFatDeduction;
    if (macros.saturatedFat >= 7) {
      negatives.push(`High in saturated fat (${macros.saturatedFat}g)`);
    }
  }

  // 5. Sodium Deductions
  if (macros.sodium > 300) {
    const excessSodium = macros.sodium - 300;
    const sodiumDeduction = Math.min(Math.round((excessSodium / 100) * 1.5), 16);
    score -= sodiumDeduction;
    if (macros.sodium >= 700) {
      negatives.push(`High in sodium (${macros.sodium}mg)`);
    }
  } else {
    positives.push('Low sodium content');
  }

  // 6. Beneficial Nutrient Bonuses (Fiber & Protein)
  if (macros.fiber >= 6) {
    score += 8;
    positives.push(`Excellent source of dietary fiber (${macros.fiber}g)`);
  } else if (macros.fiber >= 3) {
    score += 4;
    positives.push(`Good source of fiber (${macros.fiber}g)`);
  }

  if (macros.protein >= 18) {
    score += 8;
    positives.push(`High in lean protein (${macros.protein}g)`);
  } else if (macros.protein >= 8) {
    score += 4;
    positives.push(`Good protein content (${macros.protein}g)`);
  }

  // Clamping score between 0 and 100
  const finalScore = Math.max(0, Math.min(100, Math.round(score)));

  // Grade Assignment
  let grade: HealthGrade = 'C';
  if (finalScore >= 85) grade = 'A';
  else if (finalScore >= 70) grade = 'B';
  else if (finalScore >= 50) grade = 'C';
  else if (finalScore >= 30) grade = 'D';
  else grade = 'F';

  return {
    healthScore: finalScore,
    grade,
    novaGroup,
    positives: positives.slice(0, 3),
    negatives: negatives.slice(0, 3),
  };
}
