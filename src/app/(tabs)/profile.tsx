import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  SafeAreaView,
  Platform,
  Image,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  ShieldAlert,
  Flame,
  Volume2,
  Database,
  Check,
  Heart,
  Award,
  Sparkles,
  Target,
  Pencil,
  LogOut,
} from 'lucide-react-native';
import { colors, spacing, radii, typography, shadows } from '../../theme';
import { useProfileStore, ALLERGEN_LIST, DIETARY_MODES } from '../../store/useProfileStore';
import { useAuthStore } from '../../store/useAuthStore';
import safeHaptics from '../../utils/haptics';

export default function ProfileScreen() {
  const router = useRouter();
  const { profile, signOut } = useAuthStore();
  const userName = useProfileStore((state) => state.userName);
  const userTag = useProfileStore((state) => state.userTag);
  const goals = useProfileStore((state) => state.goals);
  const activeAllergens = useProfileStore((state) => state.activeAllergens);
  const activeDietaryModes = useProfileStore((state) => state.activeDietaryModes);
  const mascotVoiceEnabled = useProfileStore((state) => state.mascotVoiceEnabled);
  const toggleAllergen = useProfileStore((state) => state.toggleAllergen);
  const toggleDietaryMode = useProfileStore((state) => state.toggleDietaryMode);
  const setMascotVoiceEnabled = useProfileStore((state) => state.setMascotVoiceEnabled);

  const selectedAllergenCount = Object.values(activeAllergens).filter(Boolean).length;
  const avatarUrl = profile?.avatar_url;

  const handleToggleAllergen = (name: string) => {
    safeHaptics.impact(Haptics.ImpactFeedbackStyle.Light);
    toggleAllergen(name);
  };

  const handleToggleDietaryMode = (mode: string) => {
    safeHaptics.selection();
    toggleDietaryMode(mode);
  };

  const handleOpenEditProfile = () => {
    safeHaptics.impact(Haptics.ImpactFeedbackStyle.Light);
    router.push('/modal/edit-profile' as any);
  };

  const handleSignOut = () => {
    safeHaptics.impact(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of NutriBuddy?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/auth' as any);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* User Card */}
        <View style={styles.userCard}>
          <TouchableOpacity
            style={styles.avatarWrapper}
            onPress={handleOpenEditProfile}
            activeOpacity={0.8}
          >
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.userAvatarImage} />
            ) : (
              <View style={styles.userAvatar}>
                <Text style={styles.userInitial}>{userName.charAt(0)}</Text>
              </View>
            )}
            <View style={styles.editAvatarBadge}>
              <Pencil size={11} color="#FFFFFF" />
            </View>
          </TouchableOpacity>

          <View style={styles.userInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.userName}>{userName}</Text>
            </View>
            <Text style={styles.userTag}>
              {profile?.email || profile?.phone || userTag}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.editBtn}
            onPress={handleOpenEditProfile}
            activeOpacity={0.8}
          >
            <Pencil size={14} color={colors.brand.primaryDark} />
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>
        </View>


        {/* Nutritional Targets Overview */}
        <View style={styles.targetCard}>
          <View style={styles.targetHeader}>
            <Target size={18} color={colors.brand.primary} />
            <Text style={styles.targetTitle}>Daily Nutritional Targets</Text>
          </View>
          <View style={styles.targetRow}>
            <View style={styles.targetItem}>
              <Text style={styles.targetValue}>{goals.dailyCalories}</Text>
              <Text style={styles.targetLabel}>Calories</Text>
            </View>
            <View style={styles.targetDivider} />
            <View style={styles.targetItem}>
              <Text style={styles.targetValue}>{goals.targetProtein}g</Text>
              <Text style={styles.targetLabel}>Protein</Text>
            </View>
            <View style={styles.targetDivider} />
            <View style={styles.targetItem}>
              <Text style={styles.targetValue}>{goals.targetCarbs}g</Text>
              <Text style={styles.targetLabel}>Carbs</Text>
            </View>
            <View style={styles.targetDivider} />
            <View style={styles.targetItem}>
              <Text style={styles.targetValue}>{goals.targetFat}g</Text>
              <Text style={styles.targetLabel}>Fat</Text>
            </View>
          </View>
        </View>

        {/* Dietary Modes Selector */}
        <Text style={styles.sectionHeader}>Dietary Modes & Focus</Text>
        <View style={styles.modesWrap}>
          {DIETARY_MODES.map((mode) => {
            const isSelected = Boolean(activeDietaryModes[mode]);
            return (
              <TouchableOpacity
                key={mode}
                style={[styles.modeChip, isSelected && styles.modeChipActive]}
                onPress={() => handleToggleDietaryMode(mode)}
                activeOpacity={0.8}
              >
                {isSelected ? (
                  <Sparkles size={13} color={colors.brand.primaryDark} />
                ) : (
                  <Heart size={13} color={colors.text.secondary} />
                )}
                <Text style={[styles.modeChipText, isSelected && styles.modeChipTextActive]}>
                  {mode}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Allergen Guardrail Checklist */}
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionHeader}>Dynamic Allergen Guard</Text>
          <View style={styles.allergenAlertCount}>
            <ShieldAlert size={14} color={colors.brand.crimson} />
            <Text style={styles.allergenAlertText}>{selectedAllergenCount} Active</Text>
          </View>
        </View>
        <Text style={styles.sectionSubtext}>
          Bao immediately triggers protective alarms and flags items when scanning food containing these ingredients.
        </Text>

        <View style={styles.allergenGrid}>
          {ALLERGEN_LIST.map((name) => {
            const isSelected = Boolean(activeAllergens[name]);
            return (
              <TouchableOpacity
                key={name}
                style={[
                  styles.allergenChip,
                  isSelected && styles.allergenChipSelected,
                ]}
                onPress={() => handleToggleAllergen(name)}
                activeOpacity={0.75}
              >
                <View
                  style={[
                    styles.checkCircle,
                    isSelected && styles.checkCircleSelected,
                  ]}
                >
                  {isSelected && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
                </View>
                <Text
                  style={[
                    styles.allergenName,
                    isSelected && styles.allergenNameSelected,
                  ]}
                >
                  {name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Preferences & Hardware */}
        <Text style={styles.sectionHeader}>Preferences & Offline Intelligence</Text>
        <View style={styles.settingsCard}>
          <View style={styles.settingsRow}>
            <View style={styles.settingsTextCol}>
              <View style={styles.settingsIconRow}>
                <Volume2 size={18} color={colors.brand.primary} />
                <Text style={styles.settingsTitle}>Mascot Voice & Audio Cues</Text>
              </View>
              <Text style={styles.settingsSubtitle}>
                Bao speaks supportive verbal commentary upon scan completions
              </Text>
            </View>
            <Switch
              value={mascotVoiceEnabled}
              onValueChange={(val) => {
                Haptics.selectionAsync();
                setMascotVoiceEnabled(val);
              }}
              trackColor={{ false: colors.surface.border, true: colors.brand.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.settingsRow}>
            <View style={styles.settingsTextCol}>
              <View style={styles.settingsIconRow}>
                <Database size={18} color={colors.brand.amber} />
                <Text style={styles.settingsTitle}>Offline Additive Index</Text>
              </View>
              <Text style={styles.settingsSubtitle}>
                2,500 E-numbers & chemicals pre-indexed locally in SQLite
              </Text>
            </View>
            <View style={styles.statusPill}>
              <Text style={styles.statusPillText}>Synced</Text>
            </View>
          </View>
        </View>

        {/* Sign Out Action Button */}
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={handleSignOut}
          activeOpacity={0.8}
        >
          <LogOut size={16} color={colors.brand.crimson} />
          <Text style={styles.signOutButtonText}>Sign Out of NutriBuddy</Text>
        </TouchableOpacity>
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
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface.card,
    borderRadius: radii.xl,
    padding: spacing.lg,
    marginVertical: spacing.lg,
    borderWidth: 1,
    borderColor: colors.surface.border,
    ...shadows.card,
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: spacing.md,
  },
  userAvatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.brand.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarImage: {
    width: 54,
    height: 54,
    borderRadius: 27,
  },
  editAvatarBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.brand.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  userInitial: {
    ...typography.displayMedium,
    fontSize: 22,
    color: colors.brand.primaryDark,
  },
  userInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    ...typography.headingMedium,
    color: colors.text.primary,
  },
  userTag: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: 2,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.brand.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.full,
    gap: 4,
  },
  editBtnText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.brand.primaryDark,
    fontSize: 12,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    borderRadius: radii.lg,
    paddingVertical: 13,
    marginTop: spacing.xl,
    gap: 8,
  },
  signOutButtonText: {
    ...typography.bodyMedium,
    fontWeight: '700',
    color: colors.brand.crimson,
    fontSize: 14,
  },

  streakText: {
    ...typography.labelBold,
    color: '#B45309',
    fontSize: 12,
  },
  targetCard: {
    backgroundColor: colors.surface.card,
    borderRadius: radii.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.surface.border,
    marginBottom: spacing.lg,
    ...shadows.soft,
  },
  targetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  targetTitle: {
    ...typography.labelBold,
    color: colors.text.primary,
    fontSize: 13,
  },
  targetRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  targetItem: {
    alignItems: 'center',
  },
  targetValue: {
    ...typography.headingMedium,
    color: colors.brand.primaryDark,
    fontSize: 16,
  },
  targetLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: 2,
  },
  targetDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.surface.subtle,
  },
  sectionHeader: {
    ...typography.headingMedium,
    color: colors.text.primary,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  modesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: spacing.lg,
  },
  modeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface.card,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.surface.border,
    gap: 6,
  },
  modeChipActive: {
    backgroundColor: colors.brand.primaryLight,
    borderColor: colors.brand.primary,
  },
  modeChipText: {
    ...typography.caption,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  modeChipTextActive: {
    color: colors.brand.primaryDark,
    fontWeight: '700',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  sectionSubtext: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
    fontSize: 13,
    marginBottom: spacing.md,
    lineHeight: 18,
  },
  allergenAlertCount: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.brand.crimsonLight,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: radii.full,
    gap: 4,
  },
  allergenAlertText: {
    ...typography.caption,
    color: colors.brand.crimson,
    fontWeight: '700',
  },
  allergenGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: spacing.lg,
  },
  allergenChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface.card,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.surface.border,
    gap: 8,
  },
  allergenChipSelected: {
    backgroundColor: colors.brand.crimsonLight,
    borderColor: colors.brand.crimson,
  },
  checkCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: colors.text.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircleSelected: {
    backgroundColor: colors.brand.crimson,
    borderColor: colors.brand.crimson,
  },
  allergenName: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
    fontSize: 13,
  },
  allergenNameSelected: {
    color: colors.brand.crimson,
    fontWeight: '600',
  },
  settingsCard: {
    backgroundColor: colors.surface.card,
    borderRadius: radii.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.surface.border,
    ...shadows.card,
    marginTop: spacing.xs,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  settingsTextCol: {
    flex: 1,
    paddingRight: spacing.md,
  },
  settingsIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  settingsTitle: {
    ...typography.labelBold,
    color: colors.text.primary,
    fontSize: 14,
  },
  settingsSubtitle: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  statusPill: {
    backgroundColor: colors.brand.primaryLight,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: radii.full,
  },
  statusPillText: {
    ...typography.caption,
    color: colors.brand.primaryDark,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: colors.surface.subtle,
    marginVertical: 10,
  },
});
