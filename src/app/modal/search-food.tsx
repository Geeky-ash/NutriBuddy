import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  Search,
  X,
  Plus,
  Sparkles,
  Utensils,
  ChevronRight,
  Flame,
  Check,
} from 'lucide-react-native';
import { colors, spacing, radii, typography, shadows } from '../../theme';
import {
  CURATED_FOOD_DATABASE,
  FoodSearchItem,
  searchFoodItems,
  estimateFoodNutritionWithAi,
  formatDisplayName,
} from '../../services/ai/foodSearchService';
import { useScanHistoryStore, HistoryEntry } from '../../store/useScanHistoryStore';
import { useMascotStore } from '../../store/useMascotStore';

const CATEGORIES = [
  'ALL',
  'Indian Classics',
  'High Protein',
  'Breakfast',
  'Clean Snacks',
  'Live Foods',
] as const;

export default function SearchFoodModal() {
  const router = useRouter();

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  // Always initialize active category to 'ALL' upon opening
  const [activeCategory, setActiveCategory] = useState<string>('ALL');

  // AI Fallback state
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiEstimatedItem, setAiEstimatedItem] = useState<FoodSearchItem | null>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Success feedback state
  const [loggedItemId, setLoggedItemId] = useState<string | null>(null);

  const addHistoryEntry = useScanHistoryStore((state) => state.addEntry);
  const triggerReactivity = useMascotStore((state) => state.triggerReactivityForScore);

  // Force active filter category to 'ALL' upon opening
  useEffect(() => {
    setActiveCategory('ALL');
  }, []);

  // When user types in search bar, ALWAYS force active filter category to 'ALL'
  const handleQueryChange = (text: string) => {
    setSearchQuery(text);
    setActiveCategory('ALL'); // Unrestricted global search: never hide results behind macro pills
    setAiEstimatedItem(null);

    // Auto debounce AI estimation for unfamiliar foods
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    const trimmed = text.trim();
    if (trimmed.length >= 3) {
      debounceTimer.current = setTimeout(async () => {
        const localMatches = searchFoodItems(trimmed, 'ALL', true);
        if (localMatches.length === 0) {
          setIsAiLoading(true);
          try {
            const estimated = await estimateFoodNutritionWithAi(trimmed);
            setAiEstimatedItem(estimated);
          } finally {
            setIsAiLoading(false);
          }
        }
      }, 650);
    }
  };

  // Immediate manual AI trigger
  const handleTriggerAiEstimate = async () => {
    if (!searchQuery.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsAiLoading(true);
    try {
      const estimated = await estimateFoodNutritionWithAi(searchQuery.trim());
      setAiEstimatedItem(estimated);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Filtered list: forces ALL category if search query is present
  const results = useMemo(() => {
    return searchFoodItems(searchQuery, activeCategory, searchQuery.trim().length > 0);
  }, [searchQuery, activeCategory]);

  const handleLogItem = (item: FoodSearchItem) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setLoggedItemId(item.id);

    const historyEntry: HistoryEntry = {
      id: `manual-${Date.now()}`,
      timestamp: Date.now(),
      foodName: formatDisplayName(item.name),
      brand: item.isAiGenerated ? 'AI Estimated' : item.category,
      scanType: 'LIVE_FOOD',
      healthGrade: item.grade,
      healthScore: item.healthScore,
      macros: {
        calories: item.calories,
        protein: item.protein,
        carbohydrates: item.carbs,
        sugars: 0,
        fat: item.fat,
        saturatedFat: 0,
        fiber: 0,
        sodium: 0,
      },
      flaggedAdditives: [],
      allergenAlerts: [],
      actionableTips: [
        `Standard serving: ${item.servingSize}. Contains ${item.calories} kcal, ${item.protein}g protein.`,
      ],
    };

    addHistoryEntry(historyEntry);
    triggerReactivity(item.healthScore, []);

    // Dismiss modal after brief confirmation
    setTimeout(() => {
      router.back();
    }, 450);
  };

  const getScoreBadgeColor = (grade: string) => {
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

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Drag handle bar */}
      <View style={styles.handleContainer}>
        <View style={styles.dragHandle} />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleBox}>
          <Text style={styles.headerTitle}>Quick Add Food</Text>
          <Text style={styles.headerSubtitle}>Search global & Indian regional food database</Text>
        </View>
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={() => router.back()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          activeOpacity={0.7}
        >
          <X size={20} color={colors.text.secondary} />
        </TouchableOpacity>
      </View>

      {/* Search Input Bar */}
      <View style={styles.searchBarContainer}>
        <View style={styles.searchBar}>
          <Search size={18} color={colors.brand.primary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search food (e.g. Poha, Paneer Tikka, Idli)..."
            placeholderTextColor={colors.text.muted}
            value={searchQuery}
            onChangeText={handleQueryChange}
            autoFocus
            clearButtonMode="while-editing"
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => handleQueryChange('')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={16} color={colors.text.muted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Category Filter Pills (Always 'ALL' when searching) */}
      <View style={styles.categoriesSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {CATEGORIES.map((cat) => {
            const isSelected = activeCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryPill,
                  isSelected && styles.categoryPillActive,
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setActiveCategory(cat);
                }}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.categoryText,
                    isSelected && styles.categoryTextActive,
                  ]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {cat === 'ALL' ? 'All Foods' : cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Main Results / Content */}
      <ScrollView
        contentContainerStyle={styles.scrollList}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* AI Estimation Card if generated or loading */}
        {isAiLoading && (
          <View style={styles.aiLoadingCard}>
            <ActivityIndicator size="small" color={colors.brand.primary} />
            <Text style={styles.aiLoadingText}>
              Estimating nutrition for "{searchQuery}" with AI...
            </Text>
          </View>
        )}

        {aiEstimatedItem && (
          <View style={styles.aiResultCard}>
            <View style={styles.aiCardHeader}>
              <View style={styles.aiBadge}>
                <Sparkles size={14} color={colors.brand.primaryDark} />
                <Text style={styles.aiBadgeText}>AI Nutrition Estimation</Text>
              </View>
              <Text
                style={styles.aiServingText}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {aiEstimatedItem.servingSize}
              </Text>
            </View>

            <Text style={styles.aiFoodName}>{aiEstimatedItem.name}</Text>

            {/* Macro Row */}
            <View style={styles.aiMacroRow}>
              <View style={styles.aiMacroPill}>
                <Flame size={12} color={colors.brand.amber} />
                <Text style={styles.aiMacroText}>{aiEstimatedItem.calories} kcal</Text>
              </View>
              <View style={styles.aiMacroPill}>
                <Text style={styles.aiMacroText}>🥩 {aiEstimatedItem.protein}g protein</Text>
              </View>
              <View style={styles.aiMacroPill}>
                <Text style={styles.aiMacroText}>🌾 {aiEstimatedItem.carbs}g carbs</Text>
              </View>
              <View style={styles.aiMacroPill}>
                <Text style={styles.aiMacroText}>🥑 {aiEstimatedItem.fat}g fat</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.logButtonLarge,
                loggedItemId === aiEstimatedItem.id && styles.logButtonSuccess,
              ]}
              onPress={() => handleLogItem(aiEstimatedItem)}
              activeOpacity={0.8}
            >
              {loggedItemId === aiEstimatedItem.id ? (
                <>
                  <Check size={18} color="#fff" />
                  <Text style={styles.logButtonLargeText}>Logged to Diary!</Text>
                </>
              ) : (
                <>
                  <Plus size={18} color="#fff" />
                  <Text style={styles.logButtonLargeText}>Log this to Today's Diary</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Database Matches */}
        {results.length > 0 ? (
          <View style={styles.resultsList}>
            {results.map((item) => {
              const badge = getScoreBadgeColor(item.grade);
              const isLogged = loggedItemId === item.id;
              const displayName = formatDisplayName(item.name);

              return (
                <View key={item.id} style={styles.foodCard}>
                  <View style={styles.foodCardLeft}>
                    <View style={styles.foodIconCircle}>
                      <Utensils size={18} color={colors.brand.primaryDark} />
                    </View>
                    <View style={styles.foodDetails}>
                      <Text
                        style={styles.foodName}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {displayName}
                      </Text>
                      <Text
                        style={styles.foodSubtitle}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {item.calories} Cal, {item.servingSize}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.foodCardRight}>
                    <View style={[styles.scorePill, { backgroundColor: badge.bg }]}>
                      <Text style={[styles.scorePillText, { color: badge.text }]}>
                        {item.healthScore}
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={[styles.quickLogBtn, isLogged && styles.quickLogBtnSuccess]}
                      onPress={() => handleLogItem(item)}
                      activeOpacity={0.7}
                    >
                      {isLogged ? (
                        <Check size={15} color={colors.surface.card} />
                      ) : (
                        <>
                          <Plus size={14} color={colors.brand.primaryDark} />
                          <Text style={styles.quickLogText}>Log</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          /* Empty Search & Manual AI trigger button */
          !isAiLoading &&
          !aiEstimatedItem && (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Sparkles size={28} color={colors.brand.primary} />
              </View>
              <Text style={styles.emptyTitle}>Food Not in Local Index</Text>
              <Text style={styles.emptySubtitle}>
                "{searchQuery}" is not pre-indexed, but NutriBuddy AI can instantly estimate its macros for you!
              </Text>

              {searchQuery.trim().length > 0 && (
                <TouchableOpacity
                  style={styles.aiTriggerButton}
                  onPress={handleTriggerAiEstimate}
                  activeOpacity={0.8}
                >
                  <Sparkles size={16} color={colors.surface.card} />
                  <Text style={styles.aiTriggerButtonText}>
                    Estimate "{searchQuery}" with AI
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface.background,
    paddingTop: Platform.OS === 'android' ? 20 : 0,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: radii.full,
    backgroundColor: colors.surface.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  headerTitleBox: {
    flex: 1,
  },
  headerTitle: {
    ...typography.displayMedium,
    fontSize: 22,
    color: colors.text.primary,
  },
  headerSubtitle: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.surface.border,
  },
  searchBarContainer: {
    paddingHorizontal: spacing.lg,
    marginVertical: spacing.sm,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface.card,
    borderRadius: radii.full,
    paddingHorizontal: spacing.md,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    borderWidth: 1.5,
    borderColor: colors.brand.primary,
    gap: 8,
    ...shadows.soft,
  },
  searchInput: {
    flex: 1,
    ...typography.bodyMedium,
    color: colors.text.primary,
    fontSize: 14,
  },
  categoriesSection: {
    marginBottom: spacing.xs,
  },
  categoryScroll: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'center',
    paddingVertical: 4,
  },
  categoryPill: {
    height: 36,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radii.full,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    flexShrink: 0,
  },
  categoryPillActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#475569',
    textAlign: 'center',
  },
  categoryTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  scrollList: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 100,
  },
  aiLoadingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.brand.primaryLight,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: 10,
  },
  aiLoadingText: {
    ...typography.bodyMedium,
    fontSize: 13,
    color: colors.brand.primaryDark,
  },
  aiResultCard: {
    backgroundColor: '#F0FDF4', // Light emerald
    borderRadius: radii.xl,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: '#10B981',
    marginBottom: spacing.md,
    ...shadows.card,
  },
  aiCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: radii.full,
    flexShrink: 0,
  },
  aiBadgeText: {
    ...typography.labelBold,
    fontSize: 11,
    color: '#047857',
  },
  aiServingText: {
    ...typography.caption,
    color: colors.text.secondary,
    fontSize: 11,
    flex: 1,
    textAlign: 'right',
    marginLeft: 4,
  },
  aiFoodName: {
    ...typography.headingMedium,
    fontSize: 18,
    color: colors.text.primary,
    marginBottom: 8,
  },
  aiMacroRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: spacing.md,
  },
  aiMacroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface.card,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: radii.sm,
    gap: 4,
  },
  aiMacroText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.text.primary,
    fontSize: 12,
  },
  logButtonLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brand.primary,
    borderRadius: radii.full,
    paddingVertical: 10,
    gap: 6,
  },
  logButtonSuccess: {
    backgroundColor: '#059669',
  },
  logButtonLargeText: {
    ...typography.labelBold,
    color: colors.surface.card,
    fontSize: 14,
  },
  resultsList: {
    gap: 10,
    marginTop: 4,
  },
  foodCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface.card,
    borderRadius: radii.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.surface.border,
    ...shadows.soft,
  },
  foodCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.sm,
  },
  foodIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface.subtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  foodDetails: {
    flex: 1,
  },
  foodName: {
    ...typography.labelBold,
    fontSize: 14,
    color: colors.text.primary,
  },
  foodSubtitle: {
    ...typography.caption,
    color: '#64748B', // text-slate-500
    fontSize: 12,
    marginTop: 2,
  },
  foodCardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scorePill: {
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: radii.sm,
  },
  scorePillText: {
    ...typography.labelBold,
    fontSize: 11,
  },
  quickLogBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.brand.primaryLight,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: radii.full,
    gap: 3,
  },
  quickLogBtnSuccess: {
    backgroundColor: '#059669',
  },
  quickLogText: {
    ...typography.labelBold,
    fontSize: 12,
    color: colors.brand.primaryDark,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
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
    textAlign: 'center',
    maxWidth: 280,
    marginTop: 4,
    marginBottom: spacing.lg,
  },
  aiTriggerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.brand.primary,
    borderRadius: radii.full,
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 8,
    ...shadows.soft,
  },
  aiTriggerButtonText: {
    ...typography.labelBold,
    color: colors.surface.card,
    fontSize: 14,
  },
});
