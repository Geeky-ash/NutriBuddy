import React, { useState, useMemo } from 'react';
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
  Calendar as CalendarIcon,
  Sparkles,
  Package,
  UtensilsCrossed,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Search,
  X,
  Trash2,
  AlertTriangle,
  Flame,
  Activity,
  Plus,
} from 'lucide-react-native';
import { colors, spacing, radii, typography, shadows } from '../../theme';
import { useScanHistoryStore, HistoryEntry, formatDateToKey } from '../../store/useScanHistoryStore';
import { useScanStore } from '../../store/useScanStore';
import { useMascotStore } from '../../store/useMascotStore';
import { useProfileStore } from '../../store/useProfileStore';

export default function HistoryScreen() {
  const router = useRouter();

  // Selected date state (defaults to today 'YYYY-MM-DD')
  const [selectedDate, setSelectedDate] = useState<string>(() => formatDateToKey(Date.now()));
  const [isCalendarExpanded, setIsCalendarExpanded] = useState<boolean>(false);
  const [calendarMonthDate, setCalendarMonthDate] = useState<Date>(() => new Date());

  const entries = useScanHistoryStore((state) => state.entries);
  const searchQuery = useScanHistoryStore((state) => state.searchQuery);
  const activeFilter = useScanHistoryStore((state) => state.activeFilter);
  const setSearchQuery = useScanHistoryStore((state) => state.setSearchQuery);
  const setActiveFilter = useScanHistoryStore((state) => state.setActiveFilter);
  const getFilteredEntries = useScanHistoryStore((state) => state.getFilteredEntries);
  const getDailySummary = useScanHistoryStore((state) => state.getDailySummary);
  const getDatesWithEntries = useScanHistoryStore((state) => state.getDatesWithEntries);
  const removeEntry = useScanHistoryStore((state) => state.removeEntry);
  const deleteScanLog = useScanHistoryStore((state) => state.deleteScanLog);

  const setScanSuccess = useScanStore((state) => state.setScanSuccess);
  const triggerReactivity = useMascotStore((state) => state.triggerReactivityForScore);
  const userGoals = useProfileStore((state) => state.goals);

  // Derived metrics for the selected date
  const filteredItems = getFilteredEntries(selectedDate);
  const dailySummary = getDailySummary(selectedDate);
  const datesWithEntries = getDatesWithEntries();

  const todayKey = formatDateToKey(Date.now());
  const isSelectedToday = selectedDate === todayKey;

  // Generate 14-day horizontal strip centered on selected date
  const dayStripDays = useMemo(() => {
    const selected = new Date(selectedDate + 'T12:00:00');
    const days: { key: string; dayNum: number; dayName: string; isToday: boolean }[] = [];

    for (let i = -7; i <= 6; i++) {
      const d = new Date(selected);
      d.setDate(selected.getDate() + i);
      const key = formatDateToKey(d);
      days.push({
        key,
        dayNum: d.getDate(),
        dayName: d.toLocaleDateString(undefined, { weekday: 'short' }),
        isToday: key === todayKey,
      });
    }
    return days;
  }, [selectedDate, todayKey]);

  // Generate monthly calendar grid for calendarMonthDate
  const monthGridDays = useMemo(() => {
    const year = calendarMonthDate.getFullYear();
    const month = calendarMonthDate.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells: { key: string; dayNum: number; isCurrentMonth: boolean }[] = [];

    // Empty cells before first day of month
    for (let i = 0; i < firstDayIndex; i++) {
      cells.push({ key: `empty-${i}`, dayNum: 0, isCurrentMonth: false });
    }

    // Days of current month
    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(year, month, d);
      cells.push({
        key: formatDateToKey(dateObj),
        dayNum: d,
        isCurrentMonth: true,
      });
    }

    return cells;
  }, [calendarMonthDate]);

  const handleSelectDate = (dateKey: string) => {
    Haptics.selectionAsync();
    setSelectedDate(dateKey);
  };

  const handleJumpToToday = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedDate(todayKey);
    setCalendarMonthDate(new Date());
  };

  const handlePrevMonth = () => {
    Haptics.selectionAsync();
    setCalendarMonthDate(
      new Date(calendarMonthDate.getFullYear(), calendarMonthDate.getMonth() - 1, 1)
    );
  };

  const handleNextMonth = () => {
    Haptics.selectionAsync();
    setCalendarMonthDate(
      new Date(calendarMonthDate.getFullYear(), calendarMonthDate.getMonth() + 1, 1)
    );
  };

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

  const handleDeleteItem = async (id: string, e: any) => {
    e.stopPropagation();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    await deleteScanLog(id);
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

  const formatSelectedDateTitle = (dateKey: string) => {
    if (dateKey === todayKey) return 'Today';
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (dateKey === formatDateToKey(yesterday)) return 'Yesterday';

    const d = new Date(dateKey + 'T12:00:00');
    return d.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  // Calorie & Macro calculations
  const targetCalories = userGoals?.dailyCalories || 2100;
  const targetProtein = userGoals?.targetProtein || 130;
  const targetCarbs = userGoals?.targetCarbs || 220;
  const targetFat = userGoals?.targetFat || 65;

  const calProgressPct = Math.min(100, Math.round((dailySummary.calories / targetCalories) * 100));
  const proteinProgressPct = Math.min(100, Math.round((dailySummary.protein / targetProtein) * 100));
  const carbsProgressPct = Math.min(100, Math.round((dailySummary.carbs / targetCarbs) * 100));
  const fatProgressPct = Math.min(100, Math.round((dailySummary.fat / targetFat) * 100));

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
            <Text style={styles.headerSubtitle}>Track daily wholesome fuel & macros</Text>
          </View>
          <TouchableOpacity
            style={[styles.calendarToggleBtn, isCalendarExpanded && styles.calendarToggleBtnActive]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setIsCalendarExpanded((prev) => !prev);
            }}
            activeOpacity={0.7}
          >
            <CalendarIcon
              size={20}
              color={isCalendarExpanded ? colors.surface.card : colors.brand.primary}
            />
          </TouchableOpacity>
        </View>

        {/* Interactive Calendar Section */}
        <View style={styles.calendarSection}>
          {/* Calendar Controls & Month Title */}
          <View style={styles.calendarHeaderRow}>
            <View style={styles.calendarMonthBox}>
              <Text style={styles.calendarMonthText}>
                {calendarMonthDate.toLocaleDateString(undefined, {
                  month: 'long',
                  year: 'numeric',
                })}
              </Text>
              <TouchableOpacity
                onPress={() => setIsCalendarExpanded((p) => !p)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={styles.expandChevron}
              >
                {isCalendarExpanded ? (
                  <ChevronUp size={16} color={colors.text.secondary} />
                ) : (
                  <ChevronDown size={16} color={colors.text.secondary} />
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.calendarActions}>
              {!isSelectedToday && (
                <TouchableOpacity
                  style={styles.todayButton}
                  onPress={handleJumpToToday}
                  activeOpacity={0.7}
                >
                  <Text style={styles.todayButtonText}>Today</Text>
                </TouchableOpacity>
              )}
              {isCalendarExpanded && (
                <View style={styles.monthNavButtons}>
                  <TouchableOpacity
                    style={styles.navArrow}
                    onPress={handlePrevMonth}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <ChevronLeft size={18} color={colors.text.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.navArrow}
                    onPress={handleNextMonth}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <ChevronRight size={18} color={colors.text.primary} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>

          {/* Expanded Month Grid View */}
          {isCalendarExpanded ? (
            <View style={styles.monthGridContainer}>
              <View style={styles.weekdaysHeader}>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                  <Text key={d} style={styles.weekdayText}>
                    {d}
                  </Text>
                ))}
              </View>

              <View style={styles.gridDaysWrapper}>
                {monthGridDays.map((cell) => {
                  if (!cell.isCurrentMonth) {
                    return <View key={cell.key} style={styles.monthDayCellEmpty} />;
                  }

                  const isSelected = cell.key === selectedDate;
                  const isToday = cell.key === todayKey;
                  const hasEntries = Boolean(datesWithEntries[cell.key]);

                  return (
                    <TouchableOpacity
                      key={cell.key}
                      style={[
                        styles.monthDayCell,
                        isSelected && styles.monthDayCellSelected,
                        isToday && !isSelected && styles.monthDayCellToday,
                      ]}
                      onPress={() => handleSelectDate(cell.key)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.monthDayNumber,
                          isSelected && styles.monthDayNumberSelected,
                          isToday && !isSelected && styles.monthDayNumberToday,
                        ]}
                      >
                        {cell.dayNum}
                      </Text>
                      {hasEntries && (
                        <View
                          style={[
                            styles.entryDot,
                            isSelected && styles.entryDotSelected,
                          ]}
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ) : (
            /* Horizontal 14-Day Strip View */
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.dayStripContainer}
            >
              {dayStripDays.map((item) => {
                const isSelected = item.key === selectedDate;
                const hasEntries = Boolean(datesWithEntries[item.key]);

                return (
                  <TouchableOpacity
                    key={item.key}
                    style={[
                      styles.dayStripPill,
                      isSelected && styles.dayStripPillSelected,
                      item.isToday && !isSelected && styles.dayStripPillToday,
                    ]}
                    onPress={() => handleSelectDate(item.key)}
                    activeOpacity={0.75}
                  >
                    <Text
                      style={[
                        styles.dayStripName,
                        isSelected && styles.dayStripNameSelected,
                      ]}
                    >
                      {item.dayName}
                    </Text>
                    <Text
                      style={[
                        styles.dayStripNumber,
                        isSelected && styles.dayStripNumberSelected,
                        item.isToday && !isSelected && styles.dayStripNumberToday,
                      ]}
                    >
                      {item.dayNum}
                    </Text>
                    <View style={styles.dotContainer}>
                      {hasEntries && (
                        <View
                          style={[
                            styles.entryDot,
                            isSelected && styles.entryDotSelected,
                          ]}
                        />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>

        {/* Daily Summary & Macro Breakdown Card (Interactive Link to Nutrition Info) */}
        <TouchableOpacity
          style={styles.summaryCard}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/modal/nutrition-info' as any);
          }}
          activeOpacity={0.88}
        >
          <View style={styles.summaryHeader}>
            <View>
              <View style={styles.titleRowWithChevron}>
                <Text style={styles.selectedDateBadge}>
                  {formatSelectedDateTitle(selectedDate)}
                </Text>
                <Text style={styles.nutritionInfoLabel}>· Nutrition Info</Text>
                <ChevronRight size={15} color={colors.brand.primary} strokeWidth={2.5} />
              </View>
              <Text style={styles.summarySubtext}>
                {dailySummary.count === 0
                  ? 'No meals logged yet'
                  : `${dailySummary.count} ${dailySummary.count === 1 ? 'meal' : 'meals'} logged`}
              </Text>
            </View>

            {dailySummary.count > 0 && (
              <View style={styles.scoreBadgeMini}>
                <Activity size={13} color={colors.brand.primaryDark} />
                <Text style={styles.scoreBadgeMiniText}>
                  Avg {dailySummary.averageScore}/100
                </Text>
              </View>
            )}
          </View>

          {/* Calorie Gauge vs Daily Target */}
          <View style={styles.calorieSection}>
            <View style={styles.calorieRow}>
              <View style={styles.calorieIconBox}>
                <Flame size={20} color={colors.brand.amber} />
              </View>
              <View style={styles.calorieTexts}>
                <View style={styles.calNumberRow}>
                  <Text style={styles.calorieConsumed}>{dailySummary.calories}</Text>
                  <Text style={styles.calorieTarget}> / {targetCalories} kcal</Text>
                </View>
                <Text style={styles.calorieSublabel}>
                  {calProgressPct}% of daily calorie budget
                </Text>
              </View>
            </View>

            {/* Calorie Progress Bar */}
            <View style={styles.progressBarTrack}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${calProgressPct}%`,
                    backgroundColor:
                      calProgressPct > 105 ? colors.brand.crimson : colors.brand.primary,
                  },
                ]}
              />
            </View>
          </View>

          {/* 3 Macro Target Breakdowns */}
          <View style={styles.macrosContainer}>
            {/* Protein */}
            <View style={styles.macroCard}>
              <View style={styles.macroHeader}>
                <Text style={styles.macroName}>Protein</Text>
                <Text style={styles.macroValue}>
                  {dailySummary.protein}
                  <Text style={styles.macroTargetSmall}>/{targetProtein}g</Text>
                </Text>
              </View>
              <View style={styles.macroTrack}>
                <View
                  style={[
                    styles.macroFill,
                    {
                      width: `${proteinProgressPct}%`,
                      backgroundColor: '#10B981', // Emerald
                    },
                  ]}
                />
              </View>
            </View>

            {/* Carbs */}
            <View style={styles.macroCard}>
              <View style={styles.macroHeader}>
                <Text style={styles.macroName}>Carbs</Text>
                <Text style={styles.macroValue}>
                  {dailySummary.carbs}
                  <Text style={styles.macroTargetSmall}>/{targetCarbs}g</Text>
                </Text>
              </View>
              <View style={styles.macroTrack}>
                <View
                  style={[
                    styles.macroFill,
                    {
                      width: `${carbsProgressPct}%`,
                      backgroundColor: '#F59E0B', // Amber
                    },
                  ]}
                />
              </View>
            </View>

            {/* Fat */}
            <View style={styles.macroCard}>
              <View style={styles.macroHeader}>
                <Text style={styles.macroName}>Fat</Text>
                <Text style={styles.macroValue}>
                  {dailySummary.fat}
                  <Text style={styles.macroTargetSmall}>/{targetFat}g</Text>
                </Text>
              </View>
              <View style={styles.macroTrack}>
                <View
                  style={[
                    styles.macroFill,
                    {
                      width: `${fatProgressPct}%`,
                      backgroundColor: '#EC4899', // Berry
                    },
                  ]}
                />
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {/* Dedicated Quick Add Food Button */}
        <TouchableOpacity
          style={styles.quickAddFoodButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/modal/search-food' as any);
          }}
          activeOpacity={0.8}
        >
          <View style={styles.quickAddIconCircle}>
            <Plus size={16} color="#059669" strokeWidth={2.5} />
          </View>
          <Text style={styles.quickAddFoodText}>+ Quick Add Meal or Search Database</Text>
        </TouchableOpacity>

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
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
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
              All ({filteredItems.length})
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
            <Text
              style={[
                styles.filterText,
                activeFilter === 'PACKAGED' && styles.filterTextActive,
              ]}
            >
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
            <Text
              style={[
                styles.filterText,
                activeFilter === 'LIVE_FOOD' && styles.filterTextActive,
              ]}
            >
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
            <Text
              style={[
                styles.filterText,
                activeFilter === 'WARNINGS' && styles.filterTextActive,
              ]}
            >
              Warnings
            </Text>
          </TouchableOpacity>
        </View>

        {/* List of Scans for Selected Date */}
        {filteredItems.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconCircle}>
              <Sparkles size={28} color={colors.brand.primary} />
            </View>
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'No Matching Scans' : `No Meals for ${formatSelectedDateTitle(selectedDate)}`}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery
                ? 'Try a different search keyword.'
                : 'Snap a food item, meal, or packaged barcode to log your nutrition.'}
            </Text>
            <TouchableOpacity
              style={styles.emptyActionButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/(tabs)/scan' as any);
              }}
              activeOpacity={0.8}
            >
              <Plus size={16} color={colors.surface.card} />
              <Text style={styles.emptyActionText}>Scan Food Now</Text>
            </TouchableOpacity>
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
                      <Package
                        size={20}
                        color={hasAlert ? colors.brand.crimson : colors.brand.primary}
                      />
                    ) : (
                      <UtensilsCrossed
                        size={20}
                        color={hasAlert ? colors.brand.crimson : colors.brand.amber}
                      />
                    )}
                  </View>

                  <View style={styles.cardInfo}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {item.foodName}
                    </Text>
                    <Text style={styles.cardMeta}>
                      {formatTime(item.timestamp)} · {item.macros.calories} kcal ·{' '}
                      {item.macros.protein}g protein
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
    marginVertical: spacing.md,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 2,
  },
  calendarToggleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.surface.border,
    ...shadows.soft,
  },
  calendarToggleBtnActive: {
    backgroundColor: colors.brand.primary,
    borderColor: colors.brand.primary,
  },
  calendarSection: {
    backgroundColor: colors.surface.card,
    borderRadius: radii.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.surface.border,
    marginBottom: spacing.md,
    ...shadows.soft,
  },
  calendarHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    paddingHorizontal: 4,
  },
  calendarMonthBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  calendarMonthText: {
    ...typography.headingMedium,
    fontSize: 16,
    color: colors.text.primary,
  },
  expandChevron: {
    padding: 2,
  },
  calendarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  todayButton: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: colors.brand.primaryLight,
    borderRadius: radii.full,
  },
  todayButtonText: {
    ...typography.labelBold,
    fontSize: 11,
    color: colors.brand.primaryDark,
  },
  monthNavButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  navArrow: {
    padding: 4,
    borderRadius: radii.sm,
    backgroundColor: colors.surface.subtle,
  },
  dayStripContainer: {
    paddingVertical: 4,
    gap: 8,
  },
  dayStripPill: {
    width: 48,
    paddingVertical: 8,
    borderRadius: radii.lg,
    backgroundColor: colors.surface.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayStripPillSelected: {
    backgroundColor: colors.brand.primary,
    ...shadows.soft,
  },
  dayStripPillToday: {
    borderWidth: 1.5,
    borderColor: colors.brand.primary,
  },
  dayStripName: {
    ...typography.caption,
    fontSize: 11,
    color: colors.text.muted,
    fontWeight: '500',
    marginBottom: 2,
  },
  dayStripNameSelected: {
    color: colors.surface.card,
    fontWeight: '600',
  },
  dayStripNumber: {
    ...typography.headingMedium,
    fontSize: 16,
    color: colors.text.primary,
  },
  dayStripNumberSelected: {
    color: colors.surface.card,
  },
  dayStripNumberToday: {
    color: colors.brand.primaryDark,
  },
  dotContainer: {
    height: 6,
    marginTop: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  entryDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.brand.primary,
  },
  entryDotSelected: {
    backgroundColor: colors.surface.card,
  },
  monthGridContainer: {
    marginTop: 4,
  },
  weekdaysHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface.subtle,
    paddingBottom: 4,
  },
  weekdayText: {
    ...typography.caption,
    fontSize: 11,
    color: colors.text.muted,
    width: 38,
    textAlign: 'center',
    fontWeight: '600',
  },
  gridDaysWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  monthDayCell: {
    width: '14.28%',
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
    marginVertical: 2,
  },
  monthDayCellEmpty: {
    width: '14.28%',
    height: 40,
  },
  monthDayCellSelected: {
    backgroundColor: colors.brand.primary,
  },
  monthDayCellToday: {
    borderWidth: 1.5,
    borderColor: colors.brand.primary,
  },
  monthDayNumber: {
    ...typography.bodyMedium,
    fontSize: 13,
    color: colors.text.primary,
  },
  monthDayNumberSelected: {
    color: colors.surface.card,
    fontWeight: '700',
  },
  monthDayNumberToday: {
    color: colors.brand.primaryDark,
    fontWeight: '700',
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
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  titleRowWithChevron: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  selectedDateBadge: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  nutritionInfoLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.brand.primaryDark,
  },
  summarySubtext: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 2,
  },
  scoreBadgeMini: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.brand.primaryLight,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: radii.full,
    gap: 4,
  },
  scoreBadgeMiniText: {
    color: colors.brand.primaryDark,
    fontSize: 12,
    fontWeight: '700',
  },
  calorieSection: {
    marginBottom: spacing.md,
  },
  calorieRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  calorieIconBox: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  calorieTexts: {
    flex: 1,
  },
  calNumberRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  calorieConsumed: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
  },
  calorieTarget: {
    fontSize: 15,
    fontWeight: '700',
    color: '#64748B',
  },
  calorieSublabel: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '500',
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: colors.surface.subtle,
    borderRadius: radii.full,
    overflow: 'hidden',
    marginTop: 6,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: radii.full,
  },
  macrosContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.surface.subtle,
  },
  macroCard: {
    flex: 1,
    backgroundColor: colors.surface.subtle,
    borderRadius: radii.md,
    padding: spacing.sm,
  },
  macroHeader: {
    marginBottom: 4,
  },
  macroName: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '700',
  },
  macroValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  macroTargetSmall: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  macroTrack: {
    height: 4,
    backgroundColor: colors.surface.border,
    borderRadius: radii.full,
    overflow: 'hidden',
    marginTop: 4,
  },
  macroFill: {
    height: '100%',
    borderRadius: radii.full,
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
    marginBottom: spacing.md,
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
    color: colors.text.secondary,
    fontSize: 12,
    fontWeight: '700',
  },
  filterTextActive: {
    color: colors.brand.primaryDark,
    fontWeight: '700',
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
    maxWidth: 260,
    marginBottom: spacing.lg,
  },
  emptyActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.brand.primary,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: radii.full,
    gap: 6,
    ...shadows.soft,
  },
  emptyActionText: {
    ...typography.labelBold,
    color: colors.surface.card,
    fontSize: 13,
  },
  quickAddFoodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ECFDF5', // bg-emerald-50
    borderWidth: 1.5,
    borderColor: '#10B981', // border-emerald-500
    borderRadius: radii.xl,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    gap: 8,
    ...shadows.soft,
  },
  quickAddIconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickAddFoodText: {
    ...typography.labelBold,
    fontSize: 14,
    color: '#047857', // emerald-700
    fontWeight: '700',
  },
});
