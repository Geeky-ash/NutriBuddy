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
  Minus,
  Sparkles,
  Utensils,
  ChevronDown,
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
  getBaseWeight,
  getBaselineTag,
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

  // Selected food & portion quantity state
  const [selectedFoodId, setSelectedFoodId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [isEditingQty, setIsEditingQty] = useState(false);
  const [qtyInputText, setQtyInputText] = useState('1');

  // AI Fallback state
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiEstimatedItem, setAiEstimatedItem] = useState<FoodSearchItem | null>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Success feedback state
  const [loggedItemId, setLoggedItemId] = useState<string | null>(null);

  const addScanLog = useScanHistoryStore((state) => state.addScanLog);
  const addHistoryEntry = useScanHistoryStore((state) => state.addEntry);
  const triggerReactivity = useMascotStore((state) => state.triggerReactivityForScore);

  // Force active filter category to 'ALL' upon opening
  useEffect(() => {
    setActiveCategory('ALL');
  }, []);

  // Filtered list: forces ALL category if search query is present
  const results = useMemo(() => {
    return searchFoodItems(searchQuery, activeCategory, searchQuery.trim().length > 0);
  }, [searchQuery, activeCategory]);

  // When search query yields exact or single match, auto-select if nothing selected yet
  useEffect(() => {
    if (results.length === 1 && searchQuery.trim().length >= 3 && !selectedFoodId) {
      setSelectedFoodId(results[0].id);
      setQuantity(1);
      setQtyInputText('1');
    }
  }, [results, searchQuery, selectedFoodId]);

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

  const handleSelectFood = (item: FoodSearchItem) => {
    Haptics.selectionAsync();
    if (selectedFoodId === item.id) {
      // Toggle collapse
      setSelectedFoodId(null);
    } else {
      setSelectedFoodId(item.id);
      setQuantity(1);
      setQtyInputText('1');
      setIsEditingQty(false);
    }
  };

  const handleStepChange = (delta: number) => {
    Haptics.selectionAsync();
    setQuantity((prev) => {
      let next: number;
      if (delta > 0) {
        next = prev < 1 ? prev + 0.5 : prev + 1;
      } else {
        next = prev <= 1 ? Math.max(0.5, prev - 0.5) : prev - 1;
      }
      const rounded = Math.round(next * 10) / 10;
      setQtyInputText(String(rounded));
      return rounded;
    });
  };

  const formatQuantityLabel = (item: FoodSearchItem, qty: number): string => {
    const baseGram = getBaseWeight(item);
    const totalGrams = Math.round(baseGram * qty);
    const lowerServing = (item.servingSize || '').toLowerCase();

    if (lowerServing.includes('piece')) {
      return `${qty} ${qty === 1 ? 'piece' : 'pieces'} (${totalGrams}g)`;
    }
    if (lowerServing.includes('roti')) {
      return `${qty} ${qty === 1 ? 'roti' : 'rotis'} (${totalGrams}g)`;
    }
    if (lowerServing.includes('slice')) {
      return `${qty} ${qty === 1 ? 'slice' : 'slices'} (${totalGrams}g)`;
    }
    if (lowerServing.includes('egg')) {
      return `${qty} ${qty === 1 ? 'egg' : 'eggs'} (${totalGrams}g)`;
    }
    if (qty === 1) {
      return `${totalGrams}g`;
    }
    return `${qty}x (${totalGrams}g)`;
  };

  const handleLogItem = (item: FoodSearchItem, qtyMultiplier: number = quantity) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setLoggedItemId(item.id);

    // Live nutrition scaling per multiplier
    const scaledCalories = Math.round(item.calories * qtyMultiplier);
    const scaledProtein = Math.round(item.protein * qtyMultiplier * 10) / 10;
    const scaledCarbs = Math.round(item.carbs * qtyMultiplier * 10) / 10;
    const scaledFat = Math.round(item.fat * qtyMultiplier * 10) / 10;
    const baseGrams = getBaseWeight(item);
    const totalGrams = Math.round(baseGrams * qtyMultiplier);
    const portionText = `${qtyMultiplier}x (${totalGrams}g)`;
    const displayName = formatDisplayName(item.name);

    const historyEntry: HistoryEntry = {
      id: `manual-${Date.now()}`,
      timestamp: Date.now(),
      foodName: qtyMultiplier === 1 ? displayName : `${displayName} (${qtyMultiplier}x)`,
      brand: item.isAiGenerated ? 'AI Estimated' : item.category,
      scanType: 'LIVE_FOOD',
      healthGrade: item.grade,
      healthScore: item.healthScore,
      macros: {
        calories: scaledCalories,
        protein: scaledProtein,
        carbohydrates: scaledCarbs,
        sugars: 0,
        fat: scaledFat,
        saturatedFat: 0,
        fiber: 0,
        sodium: 0,
      },
      flaggedAdditives: [],
      allergenAlerts: [],
      actionableTips: [
        `Standard base: 100g (${item.calories} kcal). Scaled portion: ${portionText} containing ${scaledCalories} kcal, ${scaledProtein}g protein, ${scaledCarbs}g carbs, ${scaledFat}g fat.`,
      ],
    };

    // Commit to SQLite and Supabase through unified store action
    if (addScanLog) {
      addScanLog(historyEntry);
    } else {
      addHistoryEntry(historyEntry);
    }
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
            placeholder="Search food (e.g. Moong Dal Chila, Poha, Idli)..."
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

            <Text style={styles.aiFoodName}>
              {aiEstimatedItem.name}
            </Text>

            {/* Baseline Tag above macros */}
            <View style={styles.baselineTagContainer}>
              <View style={styles.baselineTagBadge}>
                <Text style={styles.baselineTagText}>{getBaselineTag(aiEstimatedItem)}</Text>
              </View>
            </View>

            {/* Live Scaled Macro Row */}
            <View style={styles.macroPillsRow}>
              <View style={styles.macroPill}>
                <Flame size={12} color="#F59E0B" />
                <Text style={styles.macroPillText}>
                  {Math.round(aiEstimatedItem.calories * quantity)} kcal
                </Text>
              </View>
              <View style={styles.macroPill}>
                <Text style={styles.macroPillText}>
                  🥩 {Math.round(aiEstimatedItem.protein * quantity * 10) / 10}g protein
                </Text>
              </View>
              <View style={styles.macroPill}>
                <Text style={styles.macroPillText}>
                  🌾 {Math.round(aiEstimatedItem.carbs * quantity * 10) / 10}g carbs
                </Text>
              </View>
              <View style={styles.macroPill}>
                <Text style={styles.macroPillText}>
                  🥑 {Math.round(aiEstimatedItem.fat * quantity * 10) / 10}g fat
                </Text>
              </View>
            </View>

            {/* Interactive Quantity Stepper */}
            <View style={styles.stepperContainer}>
              <View style={styles.stepperRow}>
                <TouchableOpacity
                  style={[styles.stepBtn, quantity <= 0.5 && styles.stepBtnDisabled]}
                  onPress={() => handleStepChange(-1)}
                  disabled={quantity <= 0.5}
                  activeOpacity={0.7}
                >
                  <Minus size={16} color={quantity <= 0.5 ? '#94A3B8' : '#0F172A'} />
                </TouchableOpacity>

                {/* Single clean quantity string display */}
                <TouchableOpacity
                  style={styles.quantityDisplayBox}
                  onPress={() => setIsEditingQty(true)}
                  activeOpacity={0.8}
                >
                  {isEditingQty ? (
                    <View style={styles.quantityEditingRow}>
                      <TextInput
                        style={styles.quantityNumericInput}
                        value={qtyInputText}
                        keyboardType="decimal-pad"
                        autoFocus
                        selectTextOnFocus
                        onChangeText={(text) => {
                          setQtyInputText(text);
                          const parsed = parseFloat(text);
                          if (!isNaN(parsed) && parsed > 0 && parsed <= 50) {
                            setQuantity(Math.round(parsed * 10) / 10);
                          }
                        }}
                        onBlur={() => {
                          setIsEditingQty(false);
                          const parsed = parseFloat(qtyInputText);
                          if (isNaN(parsed) || parsed <= 0) {
                            setQuantity(1);
                            setQtyInputText('1');
                          } else {
                            const clamped = Math.min(50, Math.max(0.5, Math.round(parsed * 10) / 10));
                            setQuantity(clamped);
                            setQtyInputText(String(clamped));
                          }
                        }}
                        onSubmitEditing={() => setIsEditingQty(false)}
                      />
                      <Text style={styles.quantityEditingSuffix}>x multiplier</Text>
                    </View>
                  ) : (
                    <Text style={styles.quantityCleanText}>
                      {formatQuantityLabel(aiEstimatedItem, quantity)}
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => handleStepChange(1)}
                  activeOpacity={0.7}
                >
                  <Plus size={16} color="#0F172A" />
                </TouchableOpacity>
              </View>

              {/* Quick Step Chips */}
              <View style={styles.quickStepChipsRow}>
                {[0.5, 1, 2, 3].map((preset) => {
                  const isPresetActive = quantity === preset;
                  const gramLabel = Math.round(getBaseWeight(aiEstimatedItem) * preset);
                  return (
                    <TouchableOpacity
                      key={preset}
                      style={[
                        styles.quickStepChip,
                        isPresetActive && styles.quickStepChipActive,
                      ]}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setQuantity(preset);
                        setQtyInputText(String(preset));
                      }}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.quickStepChipText,
                          isPresetActive && styles.quickStepChipTextActive,
                        ]}
                      >
                        {preset}x ({gramLabel}g)
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Simplified Clean Primary Action Button */}
            <TouchableOpacity
              style={[
                styles.logButtonLarge,
                loggedItemId === aiEstimatedItem.id && styles.logButtonSuccess,
              ]}
              onPress={() => handleLogItem(aiEstimatedItem, quantity)}
              activeOpacity={0.8}
            >
              {loggedItemId === aiEstimatedItem.id ? (
                <>
                  <Check size={18} color="#fff" />
                  <Text style={styles.logButtonLargeText}>
                    Added to Diary!
                  </Text>
                </>
              ) : (
                <Text style={styles.logButtonLargeText}>
                  + Add
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Database Matches */}
        {results.length > 0 ? (
          <View style={styles.resultsList}>
            {results.map((item) => {
              const isSelected = selectedFoodId === item.id;
              const badge = getScoreBadgeColor(item.grade);
              const isLogged = loggedItemId === item.id;
              const displayName = formatDisplayName(item.name);

              const itemQty = isSelected ? quantity : 1;
              const scaledCalories = Math.round(item.calories * itemQty);
              const scaledProtein = Math.round(item.protein * itemQty * 10) / 10;
              const scaledCarbs = Math.round(item.carbs * itemQty * 10) / 10;
              const scaledFat = Math.round(item.fat * itemQty * 10) / 10;

              if (isSelected) {
                return (
                  <View key={item.id} style={styles.selectedFoodCard}>
                    {/* Card Header */}
                    <TouchableOpacity
                      style={styles.selectedCardHeader}
                      onPress={() => handleSelectFood(item)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.foodCardLeft}>
                        <View style={styles.foodIconCircleActive}>
                          <Utensils size={18} color="#059669" />
                        </View>
                        <View style={styles.foodDetails}>
                          <Text
                            style={styles.selectedFoodName}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                          >
                            {displayName}
                          </Text>
                          <Text style={styles.foodSubtitle} numberOfLines={1} ellipsizeMode="tail">
                            {item.category} · {item.servingSize}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.foodCardRight}>
                        <View style={[styles.scorePill, { backgroundColor: badge.bg }]}>
                          <Text style={[styles.scorePillText, { color: badge.text }]}>
                            {item.healthScore}
                          </Text>
                        </View>
                        <ChevronDown size={18} color={colors.text.secondary} />
                      </View>
                    </TouchableOpacity>

                    {/* Secondary Baseline Tag above macros */}
                    <View style={styles.baselineTagContainer}>
                      <View style={styles.baselineTagBadge}>
                        <Text style={styles.baselineTagText}>{getBaselineTag(item)}</Text>
                      </View>
                    </View>

                    {/* Live Scaled Macro Row */}
                    <View style={styles.macroPillsRow}>
                      <View style={styles.macroPill}>
                        <Flame size={12} color="#F59E0B" />
                        <Text style={styles.macroPillText}>{scaledCalories} kcal</Text>
                      </View>
                      <View style={styles.macroPill}>
                        <Text style={styles.macroPillText}>🥩 {scaledProtein}g protein</Text>
                      </View>
                      <View style={styles.macroPill}>
                        <Text style={styles.macroPillText}>🌾 {scaledCarbs}g carbs</Text>
                      </View>
                      <View style={styles.macroPill}>
                        <Text style={styles.macroPillText}>🥑 {scaledFat}g fat</Text>
                      </View>
                    </View>

                    {/* Interactive Portion Quantity Stepper Row */}
                    <View style={styles.stepperContainer}>
                      <View style={styles.stepperRow}>
                        {/* Decrement Button (-) */}
                        <TouchableOpacity
                          style={[styles.stepBtn, quantity <= 0.5 && styles.stepBtnDisabled]}
                          onPress={() => handleStepChange(-1)}
                          disabled={quantity <= 0.5}
                          activeOpacity={0.7}
                        >
                          <Minus size={16} color={quantity <= 0.5 ? '#94A3B8' : '#0F172A'} />
                        </TouchableOpacity>

                        {/* Single clean quantity string display */}
                        <TouchableOpacity
                          style={styles.quantityDisplayBox}
                          onPress={() => setIsEditingQty(true)}
                          activeOpacity={0.8}
                        >
                          {isEditingQty ? (
                            <View style={styles.quantityEditingRow}>
                              <TextInput
                                style={styles.quantityNumericInput}
                                value={qtyInputText}
                                keyboardType="decimal-pad"
                                autoFocus
                                selectTextOnFocus
                                onChangeText={(text) => {
                                  setQtyInputText(text);
                                  const parsed = parseFloat(text);
                                  if (!isNaN(parsed) && parsed > 0 && parsed <= 50) {
                                    setQuantity(Math.round(parsed * 10) / 10);
                                  }
                                }}
                                onBlur={() => {
                                  setIsEditingQty(false);
                                  const parsed = parseFloat(qtyInputText);
                                  if (isNaN(parsed) || parsed <= 0) {
                                    setQuantity(1);
                                    setQtyInputText('1');
                                  } else {
                                    const clamped = Math.min(50, Math.max(0.5, Math.round(parsed * 10) / 10));
                                    setQuantity(clamped);
                                    setQtyInputText(String(clamped));
                                  }
                                }}
                                onSubmitEditing={() => setIsEditingQty(false)}
                              />
                              <Text style={styles.quantityEditingSuffix}>x multiplier</Text>
                            </View>
                          ) : (
                            <Text style={styles.quantityCleanText}>
                              {formatQuantityLabel(item, quantity)}
                            </Text>
                          )}
                        </TouchableOpacity>

                        {/* Increment Button (+) */}
                        <TouchableOpacity
                          style={styles.stepBtn}
                          onPress={() => handleStepChange(1)}
                          activeOpacity={0.7}
                        >
                          <Plus size={16} color="#0F172A" />
                        </TouchableOpacity>
                      </View>

                      {/* Quick Step Preset Chips */}
                      <View style={styles.quickStepChipsRow}>
                        {[0.5, 1, 2, 3].map((preset) => {
                          const isPresetActive = quantity === preset;
                          const gramLabel = Math.round(getBaseWeight(item) * preset);
                          return (
                            <TouchableOpacity
                              key={preset}
                              style={[
                                styles.quickStepChip,
                                isPresetActive && styles.quickStepChipActive,
                              ]}
                              onPress={() => {
                                Haptics.selectionAsync();
                                setQuantity(preset);
                                setQtyInputText(String(preset));
                              }}
                              activeOpacity={0.7}
                            >
                              <Text
                                style={[
                                  styles.quickStepChipText,
                                  isPresetActive && styles.quickStepChipTextActive,
                                ]}
                              >
                                {preset}x ({gramLabel}g)
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>

                    {/* Simplified Clean Primary Action Button */}
                    <TouchableOpacity
                      style={[
                        styles.logButtonLarge,
                        isLogged && styles.logButtonSuccess,
                      ]}
                      onPress={() => handleLogItem(item, quantity)}
                      activeOpacity={0.8}
                    >
                      {isLogged ? (
                        <>
                          <Check size={18} color="#fff" />
                          <Text style={styles.logButtonLargeText}>
                            Added to Diary!
                          </Text>
                        </>
                      ) : (
                        <Text style={styles.logButtonLargeText}>
                          + Add
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                );
              }

              return (
                <TouchableOpacity
                  key={item.id}
                  style={styles.foodCard}
                  onPress={() => handleSelectFood(item)}
                  activeOpacity={0.7}
                >
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
                        {item.calories} Cal · Base: 100g
                      </Text>
                    </View>
                  </View>

                  <View style={styles.foodCardRight}>
                    <View style={[styles.scorePill, { backgroundColor: badge.bg }]}>
                      <Text style={[styles.scorePillText, { color: badge.text }]}>
                        {item.healthScore}
                      </Text>
                    </View>

                    <View style={styles.quickLogBtn}>
                      <Plus size={14} color={colors.brand.primaryDark} />
                      <Text style={styles.quickLogText}>Portion</Text>
                    </View>
                  </View>
                </TouchableOpacity>
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
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  baselineTagContainer: {
    marginBottom: 8,
  },
  baselineTagBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F1F5F9',
    borderRadius: radii.xs,
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  baselineTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  macroPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: spacing.md,
  },
  macroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface.card,
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 4,
  },
  macroPillText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.text.primary,
    fontSize: 12,
  },
  stepperContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: radii.lg,
    padding: spacing.sm,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  stepBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.soft,
  },
  stepBtnDisabled: {
    opacity: 0.4,
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
  },
  quantityDisplayBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  quantityCleanText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
  },
  quantityEditingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  quantityNumericInput: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    minWidth: 32,
    textAlign: 'center',
    padding: 0,
    borderBottomWidth: 1.5,
    borderBottomColor: '#10B981',
  },
  quantityEditingSuffix: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  quickStepChipsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  quickStepChip: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: radii.sm,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickStepChipActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  quickStepChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  quickStepChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  logButtonLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brand.primary,
    borderRadius: radii.full,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 6,
    ...shadows.soft,
  },
  logButtonSuccess: {
    backgroundColor: '#059669',
  },
  logButtonLargeText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
    textAlign: 'center',
  },
  resultsList: {
    gap: 10,
    marginTop: 4,
  },
  selectedFoodCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.xl,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: '#10B981',
    ...shadows.card,
  },
  selectedCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  selectedFoodName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
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
  foodIconCircleActive: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  foodDetails: {
    flex: 1,
  },
  foodName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
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
