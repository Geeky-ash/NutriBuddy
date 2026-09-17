import React, { useMemo } from 'react';
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
import { ChevronLeft } from 'lucide-react-native';
import { colors, spacing, radii, typography, shadows } from '../../theme';
import { useScanHistoryStore, formatDateToKey, HistoryEntry } from '../../store/useScanHistoryStore';
import { useProfileStore } from '../../store/useProfileStore';
import { NutritionHeroBanner } from '../../components/nutrition/NutritionHeroBanner';

interface NutrientData {
  id: string;
  name: string;
  unit: string;
  current: number;
  target: number;
  status: 'low' | 'average' | 'high';
  statusColor: string;
  progressPercentOnTrack: number; // 0 to 100 on the visual track
  isLimit: boolean;
  topContributors: string[];
}

export default function NutritionInfoModal() {
  const router = useRouter();
  const entries = useScanHistoryStore((state) => state.entries);
  const userGoals = useProfileStore((state) => state.goals);

  const todayKey = useMemo(() => formatDateToKey(Date.now()), []);

  // Filter food items logged for today
  const todayEntries = useMemo(() => {
    return entries.filter((e) => formatDateToKey(e.timestamp) === todayKey);
  }, [entries, todayKey]);

  // Aggregate live daily consumed amounts
  const liveMacros = useMemo(() => {
    let protein = 0;
    let fiber = 0;
    let sugars = 0;
    let saturatedFat = 0;
    let sodium = 0;
    let vitaminA = 0;
    let vitaminC = 0;
    let potassium = 0;
    let calcium = 0;
    let iron = 0;

    todayEntries.forEach((entry) => {
      const m = entry.macros || ({} as any);
      protein += m.protein || 0;
      fiber += m.fiber || 0;
      sugars += m.sugars || m.addedSugars || 0;
      saturatedFat += m.saturatedFat || 0;
      sodium += m.sodium || 0;

      const r = entry.rawResult || {};
      const cal = m.calories || 0;
      const isWholeFood = entry.scanType === 'LIVE_FOOD';

      if (r.vitaminA) {
        vitaminA += r.vitaminA;
      } else {
        vitaminA += isWholeFood ? Math.round(cal * 0.45) : Math.round(cal * 0.15);
      }

      if (r.vitaminC) {
        vitaminC += r.vitaminC;
      } else {
        vitaminC += isWholeFood ? Math.round(cal * 0.04) : Math.round(cal * 0.01);
      }

      if (r.potassium) {
        potassium += r.potassium;
      } else {
        potassium += isWholeFood ? Math.round(cal * 1.6) : Math.round(cal * 0.8);
      }

      if (r.calcium) {
        calcium += r.calcium;
      } else {
        calcium += Math.round(cal * 0.35);
      }

      if (r.iron) {
        iron += r.iron;
      } else {
        iron += isWholeFood ? Math.round(cal * 0.012 * 10) / 10 : Math.round(cal * 0.005 * 10) / 10;
      }
    });

    return {
      protein: Math.round(protein * 10) / 10,
      fiber: Math.round(fiber * 10) / 10,
      sugars: Math.round(sugars * 10) / 10,
      saturatedFat: Math.round(saturatedFat * 10) / 10,
      sodium: Math.round(sodium),
      vitaminA: Math.round(vitaminA),
      vitaminC: Math.round(vitaminC),
      potassium: Math.round(potassium),
      calcium: Math.round(calcium),
      iron: Math.round(iron * 10) / 10,
    };
  }, [todayEntries]);

  // Extract top contributing foods from today's / recent logged meals
  const getTopFoods = (nutrientId: string): string[] => {
    const pool = todayEntries.length > 0 ? todayEntries : entries.slice(0, 5);
    if (pool.length === 0) return [];

    const scored = pool.map((item) => {
      const m = item.macros || {};
      let val = 0;
      if (nutrientId === 'protein') val = m.protein || 0;
      else if (nutrientId === 'fiber') val = m.fiber || 0;
      else if (nutrientId === 'saturated-fat') val = m.saturatedFat || 0;
      else if (nutrientId === 'sodium') val = m.sodium || 0;
      else if (nutrientId === 'sugar') val = m.sugars || m.addedSugars || 0;
      else val = m.calories || 0;

      return { name: item.foodName, val };
    });

    return scored
      .filter((s) => s.val > 0)
      .sort((a, b) => b.val - a.val)
      .slice(0, 3)
      .map((s) => s.name);
  };

  // Build the 10 nutrients list with range slider calculations
  const nutrientList = useMemo<NutrientData[]>(() => {
    const targetProtein = userGoals?.targetProtein || 56; // 56g benchmark matching Image 1

    const definitions = [
      {
        id: 'protein',
        name: 'Protein',
        unit: 'g',
        current: liveMacros.protein,
        target: targetProtein,
        isLimit: false,
      },
      {
        id: 'fiber',
        name: 'Fiber',
        unit: 'g',
        current: liveMacros.fiber,
        target: 38, // 38g benchmark matching Image 1
        isLimit: false,
      },
      {
        id: 'vitamin-a',
        name: 'Vitamin A',
        unit: 'mcg',
        current: liveMacros.vitaminA,
        target: 900,
        isLimit: false,
      },
      {
        id: 'vitamin-c',
        name: 'Vitamin C',
        unit: 'mg',
        current: liveMacros.vitaminC,
        target: 90,
        isLimit: false,
      },
      {
        id: 'potassium',
        name: 'Potassium',
        unit: 'mg',
        current: liveMacros.potassium,
        target: 3400,
        isLimit: false,
      },
      {
        id: 'calcium',
        name: 'Calcium',
        unit: 'mg',
        current: liveMacros.calcium,
        target: 1000,
        isLimit: false,
      },
      {
        id: 'iron',
        name: 'Iron',
        unit: 'mg',
        current: liveMacros.iron,
        target: 18,
        isLimit: false,
      },
      {
        id: 'saturated-fat',
        name: 'Saturated Fat',
        unit: 'g',
        current: liveMacros.saturatedFat,
        target: 20,
        isLimit: true,
      },
      {
        id: 'sodium',
        name: 'Sodium',
        unit: 'mg',
        current: liveMacros.sodium,
        target: 2300,
        isLimit: true,
      },
      {
        id: 'sugar',
        name: 'Sugar',
        unit: 'g',
        current: liveMacros.sugars,
        target: 36,
        isLimit: true,
      },
    ];

    // Position the target marker at 60% across the track width
    const TARGET_MARKER_PCT = 60;

    return definitions.map((item) => {
      const ratio = item.target > 0 ? item.current / item.target : 0;
      let status: 'low' | 'average' | 'high';
      let statusColor: string;

      if (!item.isLimit) {
        if (ratio < 0.5) {
          status = 'low';
          statusColor = '#EAB308'; // 🟡 Yellow for Low intake
        } else if (ratio <= 1.15) {
          status = 'average';
          statusColor = '#22C55E'; // 🟢 Green for Average intake (recommended)
        } else {
          status = 'high';
          statusColor = '#F97316'; // 🟠 Orange for High intake
        }
      } else {
        // Limit nutrients (Saturated Fat, Sodium, Sugar)
        if (ratio <= 0.6) {
          status = 'average';
          statusColor = '#22C55E'; // 🟢 Green (within healthy limit)
        } else if (ratio <= 1.0) {
          status = 'low';
          statusColor = '#EAB308'; // 🟡 Yellow (moderate intake)
        } else {
          status = 'high';
          statusColor = '#F97316'; // 🟠 Orange (high / exceeds limit)
        }
      }

      // Compute width on the track (target sits at TARGET_MARKER_PCT %)
      const trackFill = Math.min(100, Math.max(0, ratio * TARGET_MARKER_PCT));

      return {
        ...item,
        status,
        statusColor,
        progressPercentOnTrack: trackFill,
        topContributors: getTopFoods(item.id),
      };
    });
  }, [liveMacros, userGoals, todayEntries, entries]);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Drag Handle */}
      <View style={styles.handleContainer}>
        <View style={styles.dragHandle} />
      </View>

      {/* Screen Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          activeOpacity={0.7}
        >
          <ChevronLeft size={28} color={colors.text.primary} strokeWidth={2.4} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nutrition info</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Card Container (rounded-3xl, zero inner padding around vector banner) */}
        <View style={styles.heroCard}>
          {/* Vector Illustration Banner */}
          <NutritionHeroBanner />

          {/* Card Body Content */}
          <View style={styles.cardBody}>
            <Text style={styles.cardTitle}>Checking your intake</Text>

            <Text style={styles.paragraph}>
              Your nutrient intake is shown on a bar with 3 colors that represent
              different intake ranges.
            </Text>

            {/* Color Legend List */}
            <View style={styles.legendContainer}>
              <View style={styles.legendRow}>
                <View style={[styles.legendDot, { backgroundColor: '#EAB308' }]} />
                <Text style={styles.legendLabel}>Low intake</Text>
              </View>

              <View style={styles.legendRow}>
                <View style={[styles.legendDot, { backgroundColor: '#22C55E' }]} />
                <Text style={styles.legendLabel}>Average intake (recommended)</Text>
              </View>

              <View style={styles.legendRow}>
                <View style={[styles.legendDot, { backgroundColor: '#F97316' }]} />
                <Text style={styles.legendLabel}>High intake</Text>
              </View>
            </View>

            <Text style={styles.paragraphSecondary}>
              To form healthy eating habits, try to keep your intake within the green
              range for each nutrient. To help, the top 3 foods for each nutrient in
              your last recorded meal are listed below.
            </Text>
          </View>
        </View>

        {/* Section Divider Line */}
        <View style={styles.dividerLine} />

        {/* Individual Nutrient Goal Range Bars */}
        <View style={styles.nutrientsContainer}>
          {nutrientList.map((nutrient) => {
            const hasIntake = nutrient.current > 0;

            return (
              <View key={nutrient.id} style={styles.nutrientCard}>
                {/* Header Row: Nutrient Name on Left, Current Consumed on Right */}
                <View style={styles.nutrientHeader}>
                  <Text style={styles.nutrientName}>{nutrient.name}</Text>
                  <Text style={styles.nutrientConsumed}>
                    {nutrient.current.toLocaleString()}{' '}
                    <Text style={styles.nutrientUnit}>{nutrient.unit}</Text>
                  </Text>
                </View>

                {/* Progress Range Track with Target Marker */}
                <View style={styles.trackContainer}>
                  <View style={styles.trackBackground}>
                    {/* Active Progress Fill Bar */}
                    {hasIntake && (
                      <View
                        style={[
                          styles.trackFill,
                          {
                            width: `${nutrient.progressPercentOnTrack}%`,
                            backgroundColor: nutrient.statusColor,
                          },
                        ]}
                      />
                    )}

                    {/* Target Boundary Line Marker at 60% */}
                    <View style={[styles.targetTickLine, { left: '60%' }]} />
                  </View>

                  {/* Target Goal Label under the boundary marker */}
                  <View style={styles.targetLabelRow}>
                    <Text style={[styles.targetLabel, { left: '57%' }]}>
                      {nutrient.target}
                    </Text>
                  </View>
                </View>

                {/* Top Contributing Foods for this Nutrient */}
                {nutrient.topContributors.length > 0 ? (
                  <Text style={styles.topContributorsText} numberOfLines={1}>
                    Top in meals: {nutrient.topContributors.join(' · ')}
                  </Text>
                ) : (
                  <Text style={styles.topContributorsEmpty}>
                    No {nutrient.name.toLowerCase()} recorded today
                  </Text>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC', // Warm light-mode canvas (bg-slate-50)
    paddingTop: Platform.OS === 'android' ? 24 : 0,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  dragHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  backButton: {
    padding: 4,
    marginLeft: -6,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 60,
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24, // rounded-3xl
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    ...shadows.card,
  },
  cardBody: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 22,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 22,
    color: '#475569',
    marginBottom: 14,
  },
  legendContainer: {
    gap: 10,
    marginBottom: 16,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  legendDot: {
    width: 11,
    height: 11,
    borderRadius: 6,
  },
  legendLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  paragraphSecondary: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 22,
    color: '#475569',
  },
  dividerLine: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 20,
  },
  nutrientsContainer: {
    gap: 18,
  },
  nutrientCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...shadows.soft,
  },
  nutrientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 10,
  },
  nutrientName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  nutrientConsumed: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  nutrientUnit: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  trackContainer: {
    marginBottom: 6,
  },
  trackBackground: {
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E2E8F0', // Neutral light grey track
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'center',
  },
  trackFill: {
    height: '100%',
    borderRadius: 6,
  },
  targetTickLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: '#94A3B8', // Boundary target tick
  },
  targetLabelRow: {
    height: 18,
    position: 'relative',
    marginTop: 3,
  },
  targetLabel: {
    position: 'absolute',
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  topContributorsText: {
    fontSize: 12,
    color: '#059669', // Fresh green tint
    fontWeight: '600',
    marginTop: 4,
  },
  topContributorsEmpty: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
    marginTop: 4,
  },
});
