import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  Flame,
  Leaf,
  Plus,
} from 'lucide-react-native';
import { colors, spacing, radii, typography, shadows } from '../../theme';
import { useScanStore } from '../../store/useScanStore';
import { useScanHistoryStore } from '../../store/useScanHistoryStore';
import { HealthScoreGauge } from '../../components/nutrition/HealthScoreGauge';
import { ScannedProduct, LiveMealScanResult } from '../../types/nutrition';

export default function ScanResultsModal() {
  const router = useRouter();
  const scanResults = useScanStore((state) => state.scanResults);
  const scanType = useScanStore((state) => state.scanType);
  const resetScan = useScanStore((state) => state.resetScan);
  const addHistoryEntry = useScanHistoryStore((state) => state.addEntry);

  // Fallback mock item if opened without prior scan
  const item: ScannedProduct = (scanResults as ScannedProduct) || {
    id: 'sample-yogurt',
    name: 'Organic Plain Greek Yogurt',
    brand: 'Stonyfield Farm',
    servingSize: '170g',
    macrosPer100g: {
      calories: 59,
      protein: 10,
      carbohydrates: 3.6,
      sugars: 3.2,
      fat: 0.4,
      saturatedFat: 0.1,
      fiber: 0,
      sodium: 36,
    },
    ingredientsText: 'Cultured Pasteurized Organic Nonfat Milk. Contains live active cultures.',
    parsedIngredients: ['Organic Nonfat Milk', 'Live Active Cultures (S. thermophilus, L. bulgaricus)'],
    additivesDetected: [],
    flaggedAllergens: ['Milk / Dairy'],
    novaGroup: 1,
    healthScore: 92,
    grade: 'A',
    createdAt: Date.now(),
  };

  const isLiveScan = 'items' in item;
  const liveItem = item as unknown as LiveMealScanResult;

  const score = isLiveScan ? liveItem.overallHealthScore : item.healthScore;
  const grade = isLiveScan ? liveItem.healthGrade : item.grade;
  const name = isLiveScan ? 'Prepared Meal' : item.name;
  const brand = isLiveScan ? 'Fresh Plated Food' : item.brand;
  const macros = isLiveScan ? liveItem.totalMacros : item.macrosPer100g;

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    resetScan();
    router.back();
  };

  const handleLogMeal = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    addHistoryEntry({
      id: `log-${Date.now()}`,
      timestamp: Date.now(),
      foodName: name,
      brand,
      scanType: isLiveScan ? 'LIVE_FOOD' : 'PACKAGED',
      healthGrade: grade,
      healthScore: score,
      macros,
      flaggedAdditives: isLiveScan ? [] : item.additivesDetected.map((a) => a.name),
      allergenAlerts: isLiveScan ? [] : item.flaggedAllergens,
      imageUri: isLiveScan ? liveItem.imageUri : item.imageUrl,
      actionableTips: item.actionableTips || [],
      rawResult: item,
    });

    resetScan();
    router.back();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Drag handle bar */}
      <View style={styles.handleContainer}>
        <View style={styles.dragHandle} />
      </View>

      {/* Top Header */}
      <View style={styles.topHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.brandText}>{brand || 'Packaged Goods'}</Text>
          <Text style={styles.titleText} numberOfLines={2}>
            {name}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={handleClose}
          activeOpacity={0.7}
        >
          <X size={20} color={colors.text.secondary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* NutriBuddy Health Score Gauge */}
        <View style={styles.sectionMargin}>
          <HealthScoreGauge score={score} grade={grade} />
        </View>

        {/* Mascot Commentary Card */}
        <View style={styles.mascotCard}>
          <View style={styles.mascotBadgeHeader}>
            <View style={styles.mascotIconMini}>
              <Sparkles size={14} color={colors.brand.primaryDark} />
            </View>
            <Text style={styles.mascotVerdictTitle}>Bao's Verdict</Text>
          </View>
          <Text style={styles.mascotCommentary}>
            {score >= 75
              ? "Super wholesome! This food provides pure, clean fuel for your body with minimal processing."
              : score >= 50
              ? "Moderately balanced. Keep an eye on the sodium or refined sweetness, but fine in moderation."
              : "Heavily ultra-processed. Contains chemical additives that can tax your metabolism."}
          </Text>
        </View>

        {/* Allergen Warning Banner if any */}
        {!isLiveScan && item.flaggedAllergens && item.flaggedAllergens.length > 0 && (
          <View style={styles.allergenBanner}>
            <ShieldAlert size={20} color={colors.brand.crimson} />
            <View style={{ flex: 1 }}>
              <Text style={styles.allergenBannerTitle}>Allergen Identified</Text>
              <Text style={styles.allergenBannerText}>
                Contains: {item.flaggedAllergens.join(', ')}
              </Text>
            </View>
          </View>
        )}

        {/* Macronutrients Grid */}
        <Text style={styles.sectionHeading}>Nutritional Breakdown</Text>
        <View style={styles.macroGrid}>
          <View style={styles.macroCard}>
            <Flame size={16} color={colors.brand.amber} />
            <Text style={styles.macroValue}>{macros.calories}</Text>
            <Text style={styles.macroUnit}>Calories</Text>
          </View>

          <View style={styles.macroCard}>
            <Leaf size={16} color={colors.brand.primary} />
            <Text style={styles.macroValue}>{macros.protein}g</Text>
            <Text style={styles.macroUnit}>Protein</Text>
          </View>

          <View style={styles.macroCard}>
            <Text style={styles.macroValue}>{macros.carbohydrates}g</Text>
            <Text style={styles.macroUnit}>Carbs ({macros.sugars}g sugar)</Text>
          </View>

          <View style={styles.macroCard}>
            <Text style={styles.macroValue}>{macros.fat}g</Text>
            <Text style={styles.macroUnit}>Fat ({macros.saturatedFat}g sat)</Text>
          </View>
        </View>

        {/* Live Plate Items (if live scan) */}
        {isLiveScan && liveItem.items && (
          <View style={styles.sectionMargin}>
            <Text style={styles.sectionHeading}>Detected Plate Items</Text>
            {liveItem.items.map((plateItem) => (
              <View key={plateItem.id} style={styles.ingredientRow}>
                <CheckCircle2 size={16} color={colors.brand.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.ingredientName}>{plateItem.name}</Text>
                  <Text style={styles.ingredientDetail}>
                    ~{plateItem.estimatedGrams}g · {plateItem.macros.calories} kcal ·{' '}
                    {plateItem.macros.protein}g protein
                  </Text>
                </View>
                <View style={styles.confidencePill}>
                  <Text style={styles.confidenceText}>
                    {Math.round(plateItem.confidence * 100)}%
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Ingredients & Processing Analysis (if packaged) */}
        {!isLiveScan && (
          <View style={styles.sectionMargin}>
            <Text style={styles.sectionHeading}>Ingredients & NOVA Processing</Text>
            <View style={styles.novaCard}>
              <View style={styles.novaHeader}>
                <View style={styles.novaPill}>
                  <Text style={styles.novaPillText}>NOVA Group {item.novaGroup}</Text>
                </View>
                <Text style={styles.novaDescription}>
                  {item.novaGroup === 1
                    ? 'Unprocessed / Minimally Processed Whole Food'
                    : item.novaGroup === 2
                    ? 'Processed Culinary Ingredient'
                    : item.novaGroup === 3
                    ? 'Processed Food'
                    : 'Ultra-Processed Food Product (UPF)'}
                </Text>
              </View>
              <Text style={styles.ingredientsFullText}>
                {item.ingredientsText}
              </Text>
            </View>

            {/* Additives Section */}
            <Text style={[styles.sectionHeading, { marginTop: spacing.md }]}>
              Additives & Preservatives
            </Text>
            {item.additivesDetected.length === 0 ? (
              <View style={styles.cleanAdditivesCard}>
                <ShieldCheck size={20} color={colors.brand.primary} />
                <Text style={styles.cleanAdditivesText}>
                  Zero harmful chemical additives or artificial dyes detected!
                </Text>
              </View>
            ) : (
              item.additivesDetected.map((add, idx) => (
                <View key={idx} style={styles.additiveCard}>
                  <AlertTriangle size={18} color={colors.brand.amber} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.additiveName}>
                      {add.name} ({add.code})
                    </Text>
                    <Text style={styles.additiveDesc}>{add.description}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* Actionable Eating Tips */}
        {item.actionableTips && item.actionableTips.length > 0 && (
          <View style={styles.sectionMargin}>
            <Text style={styles.sectionHeading}>Actionable Eating Tips</Text>
            {item.actionableTips.map((tip, idx) => (
              <View key={idx} style={styles.tipCard}>
                <Sparkles size={16} color={colors.brand.primary} />
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Action Button: Log to Diary */}
        <TouchableOpacity
          style={styles.logButton}
          onPress={handleLogMeal}
          activeOpacity={0.85}
        >
          <Plus size={18} color="#FFFFFF" strokeWidth={2.5} />
          <Text style={styles.logButtonText}>Log to Daily Nutrition Diary</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface.card,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  dragHandle: {
    width: 40,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.surface.border,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  brandText: {
    ...typography.caption,
    color: colors.text.secondary,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  titleText: {
    ...typography.headingLarge,
    color: colors.text.primary,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface.subtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 48,
  },
  sectionMargin: {
    marginBottom: spacing.lg,
  },
  mascotCard: {
    backgroundColor: colors.brand.primaryLight,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#C6F6D5',
    marginBottom: spacing.lg,
  },
  mascotBadgeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  mascotIconMini: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mascotVerdictTitle: {
    ...typography.labelBold,
    color: colors.brand.primaryDark,
    fontSize: 12,
  },
  mascotCommentary: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    fontSize: 13,
    lineHeight: 18,
  },
  allergenBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.brand.crimsonLight,
    borderRadius: radii.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.brand.crimson,
    gap: 12,
    marginBottom: spacing.lg,
  },
  allergenBannerTitle: {
    ...typography.labelBold,
    color: colors.brand.crimson,
    fontSize: 13,
  },
  allergenBannerText: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    fontSize: 12,
    marginTop: 1,
  },
  sectionHeading: {
    ...typography.headingMedium,
    color: colors.text.primary,
    fontSize: 16,
    marginBottom: spacing.sm,
  },
  macroGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: spacing.lg,
  },
  macroCard: {
    flex: 1,
    backgroundColor: colors.surface.background,
    borderRadius: radii.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.surface.border,
    alignItems: 'center',
  },
  macroValue: {
    ...typography.labelBold,
    fontSize: 15,
    color: colors.text.primary,
    marginTop: 4,
  },
  macroUnit: {
    ...typography.caption,
    fontSize: 10,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: 2,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface.background,
    borderRadius: radii.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.surface.border,
    marginBottom: 8,
    gap: 12,
  },
  ingredientName: {
    ...typography.labelBold,
    color: colors.text.primary,
    fontSize: 14,
  },
  ingredientDetail: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: 2,
  },
  confidencePill: {
    backgroundColor: colors.brand.primaryLight,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: radii.full,
  },
  confidenceText: {
    ...typography.caption,
    color: colors.brand.primaryDark,
    fontWeight: '700',
  },
  novaCard: {
    backgroundColor: colors.surface.background,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.surface.border,
  },
  novaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  novaPill: {
    backgroundColor: colors.text.primary,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: radii.sm,
  },
  novaPillText: {
    ...typography.caption,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  novaDescription: {
    ...typography.caption,
    color: colors.text.secondary,
    flex: 1,
    fontWeight: '600',
  },
  ingredientsFullText: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
    fontSize: 12,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  cleanAdditivesCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.brand.primaryLight,
    borderRadius: radii.md,
    padding: spacing.md,
    gap: 10,
  },
  cleanAdditivesText: {
    ...typography.bodyMedium,
    color: colors.brand.primaryDark,
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  additiveCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface.background,
    borderRadius: radii.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.brand.amber,
    marginBottom: 8,
    gap: 12,
  },
  additiveName: {
    ...typography.labelBold,
    color: colors.text.primary,
    fontSize: 13,
  },
  additiveDesc: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: 2,
  },
  logButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brand.primary,
    borderRadius: radii.full,
    paddingVertical: spacing.md,
    gap: 8,
    marginTop: spacing.sm,
    ...shadows.card,
  },
  logButtonText: {
    ...typography.labelBold,
    color: '#FFFFFF',
    fontSize: 15,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface.background,
    borderRadius: radii.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.surface.border,
    marginBottom: 8,
    gap: 10,
  },
  tipText: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
    fontSize: 13,
    flex: 1,
  },
});
