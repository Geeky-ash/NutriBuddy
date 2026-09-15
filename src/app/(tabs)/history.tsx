import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  Calendar,
  Sparkles,
  Package,
  UtensilsCrossed,
  ChevronRight,
  TrendingUp,
  Search,
  X,
  Trash2,
  AlertTriangle,
} from 'lucide-react-native';
import { colors, spacing, radii, typography, shadows } from '../../theme';
import { useScanHistoryStore, HistoryEntry } from '../../store/useScanHistoryStore';
import { useScanStore } from '../../store/useScanStore';
import { useMascotStore } from '../../store/useMascotStore';

export default function HistoryScreen() {
  const router = useRouter();

  const entries = useScanHistoryStore((state) => state.entries);
  const searchQuery = useScanHistoryStore((state) => state.searchQuery);
  const activeFilter = useScanHistoryStore((state) => state.activeFilter);
  const setSearchQuery = useScanHistoryStore((state) => state.setSearchQuery);
  const setActiveFilter = useScanHistoryStore((state) => state.setActiveFilter);
  const getFilteredEntries = useScanHistoryStore((state) => state.getFilteredEntries);
  const getTodayCalories = useScanHistoryStore((state) => state.getTodayCalories);
  const getTodayProtein = useScanHistoryStore((state) => state.getTodayProtein);
  const getAverageScore = useScanHistoryStore((state) => state.getAverageScore);
  const removeEntry = useScanHistoryStore((state) => state.removeEntry);

  const setScanSuccess = useScanStore((state) => state.setScanSuccess);
  const triggerReactivity = useMascotStore((state) => state.triggerReactivityForScore);

  const filteredItems = getFilteredEntries();
  const todayCalories = getTodayCalories();
  const todayProtein = getTodayProtein();
  const averageScore = getAverageScore();

  const handleSelectItem = (item: HistoryEntry) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (item.rawResult) {
      setScanSuccess(item.rawResult);
    } else if (item.scanType === 'PACKAGED') {
      setScanSuccess({
        id: item.id,
        name: item.foodName,
        brand: item.brand,
        servingSize: '100g',
        macrosPer100g: item.macros,
        ingredientsText: `${item.foodName} ingredients`,
        parsedIngredients: [item.foodName],
        additivesDetected: item.flaggedAdditives.map((name) => ({
          code: 'FLAG',
          name,
          riskTier: 'caution' as const,
          description: 'Flagged in scan',
        })),
        flaggedAllergens: item.allergenAlerts,
        novaGroup: item.healthScore > 70 ? 1 : 4,
        healthScore: item.healthScore,
        grade: item.healthGrade,
        actionableTips: item.actionableTips,
        createdAt: item.timestamp,
      });
    } else {
      setScanSuccess({
        id: item.id,
        imageUri: item.imageUri || '',
        items: [],
        totalMacros: item.macros,
        overallHealthScore: item.healthScore,
        healthGrade: item.healthGrade,
        dietaryHighlights: ['Prepared Meal'],
        mascotReactionText: 'Wholesome balanced meal!',
        actionableTips: item.actionableTips,
        timestamp: item.timestamp,
      });
    }

    triggerReactivity(item.healthScore, item.allergenAlerts);
    router.push('/modal/scan-results' as any);
  };

  const handleDeleteItem = (id: string, e: any) => {
    e.stopPropagation();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    removeEntry(id);
  };

  const getBadgeStyle = (grade: string) => {
    switch (grade) {
      case 'A':
        return colors.score.excellent;
      case 'B':
        return colors.score.good;
      case 'C':
        return colors.score.moderate;
      case 'D':
        return colors.score.poor;
      default:
        return colors.score.critical;
    }
  };

  const formatTimeAgo = (timestamp: number) => {
    const diffMs = Date.now() - timestamp;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return new Date(timestamp).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Screen Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Nutrition Diary</Text>
            <Text style={styles.headerSubtitle}>Your daily wholesome food choices</Text>
          </View>
          <View style={styles.calendarIcon}>
            <Calendar size={20} color={colors.brand.primary} />
          </View>
        </View>

        {/* Daily Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryTop}>
            <View>
              <Text style={styles.summaryCaption}>Overall Health Index</Text>
              <View style={styles.scoreRow}>
                <Text style={styles.scoreLarge}>{averageScore}</Text>
                <Text style={styles.scoreMax}>/100</Text>
              </View>
            </View>
            <View style={styles.trendBadge}>
              <TrendingUp size={14} color={colors.brand.primaryDark} />
              <Text style={styles.trendText}>
                {averageScore >= 80 ? 'Optimal Fuel' : averageScore >= 50 ? 'Moderate' : 'Needs Focus'}
              </Text>
            </View>
          </View>

          <View style={styles.metricRow}>
            <View style={styles.metricItem}>
              <Text style={styles.metricNumber}>{entries.length}</Text>
              <Text style={styles.metricLabel}>Scans Logged</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={styles.metricNumber}>{todayCalories}</Text>
              <Text style={styles.metricLabel}>Today Kcal</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricItem}>
              <Text style={styles.metricNumber}>{todayProtein}g</Text>
              <Text style={styles.metricLabel}>Today Protein</Text>
            </View>
          </View>
        </View>

        {/* Search Input Bar */}
        <View style={styles.searchBar}>
          <Search size={18} color={colors.text.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search logged foods or brands..."
            placeholderTextColor={colors.text.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={16} color={colors.text.muted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Pills */}
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterPill, activeFilter === 'ALL' && styles.filterPillActive]}
            onPress={() => {
              Haptics.selectionAsync();
              setActiveFilter('ALL');
            }}
          >
            <Text style={[styles.filterText, activeFilter === 'ALL' && styles.filterTextActive]}>
              All ({entries.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterPill, activeFilter === 'PACKAGED' && styles.filterPillActive]}
            onPress={() => {
              Haptics.selectionAsync();
              setActiveFilter('PACKAGED');
            }}
          >
            <Package
              size={13}
              color={activeFilter === 'PACKAGED' ? colors.brand.primaryDark : colors.text.secondary}
            />
            <Text style={[styles.filterText, activeFilter === 'PACKAGED' && styles.filterTextActive]}>
              Packaged
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterPill, activeFilter === 'LIVE_FOOD' && styles.filterPillActive]}
            onPress={() => {
              Haptics.selectionAsync();
              setActiveFilter('LIVE_FOOD');
            }}
          >
            <UtensilsCrossed
              size={13}
              color={activeFilter === 'LIVE_FOOD' ? colors.brand.primaryDark : colors.text.secondary}
            />
            <Text style={[styles.filterText, activeFilter === 'LIVE_FOOD' && styles.filterTextActive]}>
              Live Food
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterPill, activeFilter === 'WARNINGS' && styles.filterPillActive]}
            onPress={() => {
              Haptics.selectionAsync();
              setActiveFilter('WARNINGS');
            }}
          >
            <AlertTriangle
              size={13}
              color={activeFilter === 'WARNINGS' ? colors.brand.crimson : colors.text.secondary}
            />
            <Text style={[styles.filterText, activeFilter === 'WARNINGS' && styles.filterTextActive]}>
              Warnings
            </Text>
          </TouchableOpacity>
        </View>

        {/* List of Scans */}
        {filteredItems.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconCircle}>
              <Sparkles size={28} color={colors.brand.primary} />
            </View>
            <Text style={styles.emptyTitle}>No Matching Scans</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery ? 'Try a different search keyword.' : 'Snap a food item or label to begin logging.'}
            </Text>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {filteredItems.map((item) => {
              const badge = getBadgeStyle(item.healthGrade);
              const hasAlert = item.allergenAlerts.length > 0 || item.healthScore < 50;

              return (
                <TouchableOpacity
                  key={item.id}
                  style={styles.historyCard}
                  activeOpacity={0.75}
                  onPress={() => handleSelectItem(item)}
                >
                  <View style={[styles.cardIconBox, hasAlert && styles.cardIconBoxAlert]}>
                    {item.scanType === 'PACKAGED' ? (
                      <Package size={20} color={hasAlert ? colors.brand.crimson : colors.brand.primary} />
                    ) : (
                      <UtensilsCrossed size={20} color={hasAlert ? colors.brand.crimson : colors.brand.amber} />
                    )}
                  </View>

                  <View style={styles.cardInfo}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {item.foodName}
                    </Text>
                    <Text style={styles.cardMeta}>
                      {formatTimeAgo(item.timestamp)} · {item.macros.calories} kcal · {item.macros.protein}g protein
                    </Text>
                    {item.allergenAlerts.length > 0 && (
                      <Text style={styles.cardAlertText} numberOfLines={1}>
                        ⚠️ Contains {item.allergenAlerts.join(', ')}
                      </Text>
                    )}
                  </View>

                  <View style={[styles.scoreBadge, { backgroundColor: badge.bg }]}>
                    <Text style={[styles.scoreBadgeText, { color: badge.text }]}>
                      {item.healthScore}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.trashBtn}
                    onPress={(e) => handleDeleteItem(item.id, e)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Trash2 size={16} color={colors.text.muted} />
                  </TouchableOpacity>

                  <ChevronRight size={18} color={colors.text.muted} />
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface.background,
    paddingTop: Platform.OS === 'android' ? 24 : 0,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 120,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  headerTitle: {
    ...typography.displayMedium,
    color: colors.text.primary,
  },
  headerSubtitle: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
    marginTop: 2,
  },
  calendarIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.soft,
  },
  summaryCard: {
    backgroundColor: colors.surface.card,
    borderRadius: radii.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.surface.border,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  summaryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  summaryCaption: {
    ...typography.caption,
    color: colors.text.secondary,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 4,
  },
  scoreLarge: {
    ...typography.displayLarge,
    fontSize: 38,
    color: colors.brand.primary,
  },
  scoreMax: {
    ...typography.headingMedium,
    fontSize: 16,
    color: colors.text.muted,
    marginLeft: 4,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.brand.primaryLight,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: radii.full,
    gap: 4,
  },
  trendText: {
    ...typography.labelBold,
    color: colors.brand.primaryDark,
    fontSize: 12,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.surface.subtle,
  },
  metricItem: {
    alignItems: 'center',
  },
  metricNumber: {
    ...typography.headingMedium,
    color: colors.text.primary,
  },
  metricLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.surface.border,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface.card,
    borderRadius: radii.full,
    paddingHorizontal: spacing.md,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    borderWidth: 1,
    borderColor: colors.surface.border,
    marginBottom: spacing.md,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    ...typography.bodyMedium,
    color: colors.text.primary,
    fontSize: 13,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: spacing.lg,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface.card,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.surface.border,
    gap: 6,
  },
  filterPillActive: {
    backgroundColor: colors.brand.primaryLight,
    borderColor: colors.brand.primary,
  },
  filterText: {
    ...typography.labelBold,
    color: colors.text.secondary,
    fontSize: 12,
  },
  filterTextActive: {
    color: colors.brand.primaryDark,
  },
  listContainer: {
    gap: 10,
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface.card,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.surface.border,
    ...shadows.soft,
  },
  cardIconBox: {
    width: 42,
    height: 42,
    borderRadius: radii.md,
    backgroundColor: colors.surface.subtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  cardIconBoxAlert: {
    backgroundColor: colors.brand.crimsonLight,
  },
  cardInfo: {
    flex: 1,
    marginRight: 4,
  },
  cardTitle: {
    ...typography.labelBold,
    color: colors.text.primary,
    fontSize: 14,
    marginBottom: 2,
  },
  cardMeta: {
    ...typography.caption,
    color: colors.text.secondary,
    fontSize: 11,
  },
  cardAlertText: {
    ...typography.caption,
    color: colors.brand.crimson,
    fontWeight: '600',
    fontSize: 11,
    marginTop: 2,
  },
  scoreBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: radii.sm,
    marginRight: 6,
  },
  scoreBadgeText: {
    ...typography.labelBold,
    fontSize: 12,
  },
  trashBtn: {
    padding: 6,
    marginRight: 2,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.brand.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyTitle: {
    ...typography.headingMedium,
    color: colors.text.primary,
  },
  emptySubtitle: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
    marginTop: 4,
    textAlign: 'center',
    maxWidth: 240,
  },
});
