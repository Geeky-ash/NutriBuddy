/**
 * NutriBuddy OCR Text Cleaner & Ingredient Tokenizer
 * Extracts additives, E-numbers, hidden sugars, and allergens from packaged food labels.
 */

import { AdditiveInfo, AdditiveRiskTier } from '../../types/nutrition';

// Catalog of verified food additives and risk classifications
export const ADDITIVES_DATABASE: Record<string, { code: string; name: string; riskTier: AdditiveRiskTier; description: string; concerns: string[] }> = {
  // High Risk Additives
  'e171': { code: 'E171', name: 'Titanium Dioxide', riskTier: 'high_risk', description: 'Whitening agent banned in the EU due to genotoxicity concerns.', concerns: ['Genotoxicity', 'Cellular inflammation'] },
  'titanium dioxide': { code: 'E171', name: 'Titanium Dioxide', riskTier: 'high_risk', description: 'Whitening agent banned in the EU due to genotoxicity concerns.', concerns: ['Genotoxicity', 'Cellular inflammation'] },
  'e250': { code: 'E250', name: 'Sodium Nitrite', riskTier: 'high_risk', description: 'Meat curing preservative that can form carcinogenic nitrosamines.', concerns: ['Forms nitrosamines', 'Cardiovascular risk'] },
  'sodium nitrite': { code: 'E250', name: 'Sodium Nitrite', riskTier: 'high_risk', description: 'Meat curing preservative that can form carcinogenic nitrosamines.', concerns: ['Forms nitrosamines', 'Cardiovascular risk'] },
  'e320': { code: 'E320', name: 'BHA (Butylated Hydroxyanisole)', riskTier: 'high_risk', description: 'Synthetic preservative flagged as possible human endocrine disruptor.', concerns: ['Endocrine disruption', 'Carcinogenic potential'] },
  'bha': { code: 'E320', name: 'BHA (Butylated Hydroxyanisole)', riskTier: 'high_risk', description: 'Synthetic preservative flagged as possible human endocrine disruptor.', concerns: ['Endocrine disruption'] },
  'e321': { code: 'E321', name: 'BHT (Butylated Hydroxytoluene)', riskTier: 'high_risk', description: 'Synthetic petroleum-derived preservative and antioxidant.', concerns: ['Organ toxicity', 'Allergic sensitization'] },
  'bht': { code: 'E321', name: 'BHT (Butylated Hydroxytoluene)', riskTier: 'high_risk', description: 'Synthetic petroleum-derived preservative and antioxidant.', concerns: ['Organ toxicity'] },
  'e129': { code: 'E129', name: 'Allura Red AC (Red 40)', riskTier: 'high_risk', description: 'Petroleum-derived synthetic dye linked to behavioral issues in kids.', concerns: ['Hyperactivity in children', 'Allergic reactions'] },
  'red 40': { code: 'E129', name: 'Allura Red AC (Red 40)', riskTier: 'high_risk', description: 'Petroleum-derived synthetic dye linked to behavioral issues in kids.', concerns: ['Hyperactivity in children'] },
  'allura red': { code: 'E129', name: 'Allura Red AC (Red 40)', riskTier: 'high_risk', description: 'Petroleum-derived synthetic dye linked to behavioral issues in kids.', concerns: ['Hyperactivity in children'] },
  'e102': { code: 'E102', name: 'Tartrazine (Yellow 5)', riskTier: 'high_risk', description: 'Synthetic coal-tar dye associated with hives and behavioral shifts.', concerns: ['Asthma trigger', 'Hyperactivity'] },
  'yellow 5': { code: 'E102', name: 'Tartrazine (Yellow 5)', riskTier: 'high_risk', description: 'Synthetic coal-tar dye associated with hives and behavioral shifts.', concerns: ['Asthma trigger', 'Hyperactivity'] },
  'e110': { code: 'E110', name: 'Sunset Yellow FCF (Yellow 6)', riskTier: 'high_risk', description: 'Azo dye linked to hypersensitivity and children hyperactivity.', concerns: ['Hyperactivity', 'Allergies'] },
  'yellow 6': { code: 'E110', name: 'Sunset Yellow FCF (Yellow 6)', riskTier: 'high_risk', description: 'Azo dye linked to hypersensitivity and children hyperactivity.', concerns: ['Hyperactivity'] },
  'e133': { code: 'E133', name: 'Brilliant Blue FCF (Blue 1)', riskTier: 'high_risk', description: 'Synthetic triphenylmethane food dye.', concerns: ['Hypersensitivity'] },
  'blue 1': { code: 'E133', name: 'Brilliant Blue FCF (Blue 1)', riskTier: 'high_risk', description: 'Synthetic triphenylmethane food dye.', concerns: ['Hypersensitivity'] },
  'e951': { code: 'E951', name: 'Aspartame', riskTier: 'high_risk', description: 'Intense artificial sweetener classified as possibly carcinogenic by WHO IARC.', concerns: ['IARC Group 2B', 'Headaches'] },
  'aspartame': { code: 'E951', name: 'Aspartame', riskTier: 'high_risk', description: 'Intense artificial sweetener classified as possibly carcinogenic by WHO IARC.', concerns: ['IARC Group 2B', 'Headaches'] },
  'e924': { code: 'E924', name: 'Potassium Bromate', riskTier: 'high_risk', description: 'Flour improver banned in most developed nations.', concerns: ['Carcinogenic'] },
  'potassium bromate': { code: 'E924', name: 'Potassium Bromate', riskTier: 'high_risk', description: 'Flour improver banned in most developed nations.', concerns: ['Carcinogenic'] },

  // Caution / Moderate Risk Additives
  'e211': { code: 'E211', name: 'Sodium Benzoate', riskTier: 'caution', description: 'Preservative that can react with Vitamin C to form trace benzene.', concerns: ['Benzene formation with ascorbic acid'] },
  'sodium benzoate': { code: 'E211', name: 'Sodium Benzoate', riskTier: 'caution', description: 'Preservative that can react with Vitamin C to form trace benzene.', concerns: ['Benzene formation with ascorbic acid'] },
  'e202': { code: 'E202', name: 'Potassium Sorbate', riskTier: 'caution', description: 'Antimicrobial preservative; generally recognized as safe in moderation.', concerns: ['Mild skin/mucous irritation in sensitive individuals'] },
  'potassium sorbate': { code: 'E202', name: 'Potassium Sorbate', riskTier: 'caution', description: 'Antimicrobial preservative; generally recognized as safe in moderation.', concerns: ['Skin irritation in high doses'] },
  'e407': { code: 'E407', name: 'Carrageenan', riskTier: 'caution', description: 'Seaweed extract thickener that may promote gut inflammation.', concerns: ['Intestinal inflammation', 'Digestive distress'] },
  'carrageenan': { code: 'E407', name: 'Carrageenan', riskTier: 'caution', description: 'Seaweed extract thickener that may promote gut inflammation.', concerns: ['Intestinal inflammation'] },
  'e621': { code: 'E621', name: 'Monosodium Glutamate (MSG)', riskTier: 'caution', description: 'Flavor enhancer that triggers sensitivity symptoms in some individuals.', concerns: ['Headaches/flushing in sensitive individuals'] },
  'msg': { code: 'E621', name: 'Monosodium Glutamate (MSG)', riskTier: 'caution', description: 'Flavor enhancer that triggers sensitivity symptoms in some individuals.', concerns: ['Headaches/flushing'] },
  'e955': { code: 'E955', name: 'Sucralose', riskTier: 'caution', description: 'Chlorinated artificial sweetener; questions remain regarding gut microbiome effects.', concerns: ['Gut microbiome alteration'] },
  'sucralose': { code: 'E955', name: 'Sucralose', riskTier: 'caution', description: 'Chlorinated artificial sweetener; questions remain regarding gut microbiome effects.', concerns: ['Gut microbiome alteration'] },
  'e950': { code: 'E950', name: 'Acesulfame Potassium (Ace-K)', riskTier: 'caution', description: 'Calorie-free artificial sweetener often blended with sucralose.', concerns: ['Potential methylene chloride residues'] },
  'acesulfame potassium': { code: 'E950', name: 'Acesulfame Potassium (Ace-K)', riskTier: 'caution', description: 'Calorie-free artificial sweetener often blended with sucralose.', concerns: ['Artificial sweetener'] },
  'e150d': { code: 'E150d', name: 'Caramel Color IV (Sulfite Ammonia)', riskTier: 'caution', description: 'Coloring agent containing 4-MEI byproduct.', concerns: ['4-MEI chemical byproduct'] },
  'caramel color': { code: 'E150d', name: 'Caramel Color', riskTier: 'caution', description: 'Coloring agent commonly found in dark sodas and gravies.', concerns: ['4-MEI byproduct in class IV'] },
  'artificial flavor': { code: 'ART_FLAVOR', name: 'Artificial Flavor', riskTier: 'caution', description: 'Synthetic chemical blend mimicking natural culinary flavors.', concerns: ['Masks ultra-processing'] },
  'artificial flavors': { code: 'ART_FLAVOR', name: 'Artificial Flavors', riskTier: 'caution', description: 'Synthetic chemical blend mimicking natural culinary flavors.', concerns: ['Masks ultra-processing'] },

  // Safe Additives
  'e300': { code: 'E300', name: 'Ascorbic Acid (Vitamin C)', riskTier: 'safe', description: 'Naturally occurring antioxidant and essential vitamin.', concerns: [] },
  'ascorbic acid': { code: 'E300', name: 'Ascorbic Acid (Vitamin C)', riskTier: 'safe', description: 'Naturally occurring antioxidant and essential vitamin.', concerns: [] },
  'e330': { code: 'E330', name: 'Citric Acid', riskTier: 'safe', description: 'Natural organic acid from citrus fruits; acts as pH regulator.', concerns: [] },
  'citric acid': { code: 'E330', name: 'Citric Acid', riskTier: 'safe', description: 'Natural organic acid from citrus fruits; acts as pH regulator.', concerns: [] },
  'e322': { code: 'E322', name: 'Lecithin', riskTier: 'safe', description: 'Natural phospholipid emulsifier extracted from soy or sunflowers.', concerns: [] },
  'lecithin': { code: 'E322', name: 'Lecithin', riskTier: 'safe', description: 'Natural phospholipid emulsifier extracted from soy or sunflowers.', concerns: [] },
  'e440': { code: 'E440', name: 'Pectin', riskTier: 'safe', description: 'Natural fruit fiber used as a gelling agent.', concerns: [] },
  'pectin': { code: 'E440', name: 'Pectin', riskTier: 'safe', description: 'Natural fruit fiber used as a gelling agent.', concerns: [] },
};

// Hidden and refined sugars
export const SUGAR_ALIASES = [
  'high fructose corn syrup',
  'corn syrup',
  'maltodextrin',
  'dextrose',
  'cane sugar',
  'evaporated cane juice',
  'invert sugar',
  'malt syrup',
  'agave nectar',
  'brown rice syrup',
  'tapioca syrup',
  'glucose syrup',
  'sucrose',
  'fructose',
];

// Common allergen keywords
export const ALLERGEN_PATTERNS: Record<string, RegExp> = {
  'Peanuts': /\b(peanut|peanuts|groundnut|arachis)\b/i,
  'Tree Nuts': /\b(almond|almonds|cashew|cashews|walnut|walnuts|pecan|pecans|hazelnut|hazelnuts|pistachio|pistachios|macadamia|brazil nut)\b/i,
  'Milk / Dairy': /\b(milk|dairy|cream|butter|whey|casein|caseinate|lactose|cheese|yogurt|ghee)\b/i,
  'Eggs': /\b(egg|eggs|egg white|egg yolk|albumin|albumen|lysozyme)\b/i,
  'Gluten / Wheat': /\b(wheat|gluten|barley|rye|spelt|semolina|durum|farina|malt)\b/i,
  'Soy': /\b(soy|soya|soybean|soybeans|edamame|tofu|tempeh)\b/i,
  'Fish': /\b(fish|salmon|tuna|cod|anchovy|anchovies|tilapia|halibut|bass|trout)\b/i,
  'Shellfish': /\b(shellfish|crustacean|shrimp|prawn|crab|lobster|clam|mussel|oyster|scallop)\b/i,
  'Sesame': /\b(sesame|sesamum|tahini)\b/i,
};

export interface ParsedLabelData {
  cleanedText: string;
  ingredients: string[];
  additives: AdditiveInfo[];
  hiddenSugars: string[];
  flaggedAllergens: string[];
  isUltraProcessed: boolean;
}

/**
 * Strips legal boilerplate, parenthetical noise, and normalizes OCR artifacts.
 */
export function cleanOcrText(rawText: string): string {
  let text = rawText;

  // Replace common OCR character substitutions
  text = text.replace(/[\u2018\u2019]/g, "'");
  text = text.replace(/[\u201C\u201D]/g, '"');

  // Strip leading headers
  text = text.replace(/^(ingredients|ingredient list|ingrédients|contains|contents):?\s*/i, '');

  // Strip trailing "manufactured in a facility" or "may contain" disclaimers
  text = text.replace(/\s*(may contain|manufactured in|produced in|packaged in|distributed by)[\s\S]*$/i, '');

  // Normalize duplicate spaces and linebreaks
  text = text.replace(/[\r\n]+/g, ' ').replace(/\s{2,}/g, ' ').trim();

  return text;
}

/**
 * Tokenizes ingredient string while respecting nested brackets.
 */
export function tokenizeIngredients(cleanedText: string): string[] {
  const tokens: string[] = [];
  let currentToken = '';
  let parenDepth = 0;
  let bracketDepth = 0;

  for (let i = 0; i < cleanedText.length; i++) {
    const char = cleanedText[i];

    if (char === '(') parenDepth++;
    else if (char === ')') parenDepth = Math.max(0, parenDepth - 1);
    else if (char === '[' || char === '{') bracketDepth++;
    else if (char === ']' || char === '}') bracketDepth = Math.max(0, bracketDepth - 1);

    if ((char === ',' || char === ';' || char === '•' || char === '.') && parenDepth === 0 && bracketDepth === 0) {
      const trimmed = currentToken.trim();
      if (trimmed.length > 0) {
        tokens.push(trimmed);
      }
      currentToken = '';
    } else {
      currentToken += char;
    }
  }

  const finalTrimmed = currentToken.trim();
  if (finalTrimmed.length > 0) {
    tokens.push(finalTrimmed);
  }

  return tokens;
}

/**
 * Full parsing pipeline: normalizes text, matches additives, detects hidden sugars, and flags allergens.
 */
export function parseFoodLabel(rawText: string, userAllergens: string[] = []): ParsedLabelData {
  const cleaned = cleanOcrText(rawText);
  const ingredients = tokenizeIngredients(cleaned);

  const matchedAdditivesMap = new Map<string, AdditiveInfo>();
  const detectedSugars = new Set<string>();
  const detectedAllergens = new Set<string>();

  const lowerText = cleaned.toLowerCase();

  // 1. Scan for E-numbers & Additives
  for (const [key, additive] of Object.entries(ADDITIVES_DATABASE)) {
    // Regex matches whole words or standard E-number formats like "E 129" or "E129"
    const pattern = new RegExp(`\\b${key.replace(/\s+/g, '\\s*')}\\b`, 'i');
    if (pattern.test(lowerText)) {
      matchedAdditivesMap.set(additive.code, {
        code: additive.code,
        name: additive.name,
        riskTier: additive.riskTier,
        description: additive.description,
        concerns: additive.concerns,
      });
    }
  }

  // 2. Scan for hidden sugars
  for (const sugar of SUGAR_ALIASES) {
    const pattern = new RegExp(`\\b${sugar}\\b`, 'i');
    if (pattern.test(lowerText)) {
      detectedSugars.add(sugar);
    }
  }

  // 3. Scan for allergens
  for (const [allergenName, regex] of Object.entries(ALLERGEN_PATTERNS)) {
    if (regex.test(lowerText)) {
      detectedAllergens.add(allergenName);
    }
  }

  // User-specific allergen filter
  const userTriggeredAllergens: string[] = [];
  for (const userAllergen of userAllergens) {
    for (const detected of detectedAllergens) {
      if (detected.toLowerCase().includes(userAllergen.toLowerCase()) || userAllergen.toLowerCase().includes(detected.toLowerCase())) {
        if (!userTriggeredAllergens.includes(detected)) {
          userTriggeredAllergens.push(detected);
        }
      }
    }
  }

  // Ultra-processed heuristic: >= 2 high/caution additives, or presence of high fructose corn syrup / artificial colors
  const additivesList = Array.from(matchedAdditivesMap.values());
  const highRiskCount = additivesList.filter(a => a.riskTier === 'high_risk').length;
  const cautionCount = additivesList.filter(a => a.riskTier === 'caution').length;
  const isUltraProcessed = highRiskCount >= 1 || cautionCount >= 2 || detectedSugars.has('high fructose corn syrup');

  return {
    cleanedText: cleaned,
    ingredients,
    additives: additivesList,
    hiddenSugars: Array.from(detectedSugars),
    flaggedAllergens: userTriggeredAllergens.length > 0 ? userTriggeredAllergens : Array.from(detectedAllergens),
    isUltraProcessed,
  };
}
