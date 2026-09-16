import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  X,
  Camera,
  Image as ImageIcon,
  User,
  Flame,
  Check,
  LogOut,
  Target,
  Sparkles,
  RotateCcw,
} from 'lucide-react-native';
import { colors, radii, shadows, spacing, typography } from '../../theme';
import { useAuthStore } from '../../store/useAuthStore';
import safeHaptics from '../../utils/haptics';
import { pickImageFromLibrary, capturePhotoWithCamera } from '../../utils/safeImagePicker';

export const PRESET_AVATARS = [
  {
    id: 'bao_classic',
    name: 'Bao the Panda',
    emoji: '🐼',
    bg: '#ECFDF5',
    url: 'https://api.dicebear.com/7.x/bottts/png?seed=BaoPanda&backgroundColor=ecfdf5',
  },
  {
    id: 'avocado_zen',
    name: 'Avocado Zen',
    emoji: '🥑',
    bg: '#F0FDF4',
    url: 'https://api.dicebear.com/7.x/bottts/png?seed=AvocadoZen&backgroundColor=f0fdf4',
  },
  {
    id: 'chef_bao',
    name: 'Master Chef',
    emoji: '👨‍🍳',
    bg: '#FFFBEB',
    url: 'https://api.dicebear.com/7.x/bottts/png?seed=MasterChef&backgroundColor=fffbeb',
  },
  {
    id: 'berry_bliss',
    name: 'Berry Vitality',
    emoji: '🫐',
    bg: '#EEF2FF',
    url: 'https://api.dicebear.com/7.x/bottts/png?seed=BerryVitality&backgroundColor=eef2ff',
  },
  {
    id: 'green_sprout',
    name: 'Living Sprout',
    emoji: '🌱',
    bg: '#FEF9C3',
    url: 'https://api.dicebear.com/7.x/bottts/png?seed=GoldenSprout&backgroundColor=fef9c3',
  },
  {
    id: 'mindful_salad',
    name: 'Clean Whole',
    emoji: '🥗',
    bg: '#F0FDFA',
    url: 'https://api.dicebear.com/7.x/bottts/png?seed=MindfulEater&backgroundColor=f0fdfa',
  },
  {
    id: 'active_pulse',
    name: 'Active Flame',
    emoji: '🔥',
    bg: '#FFF1F2',
    url: 'https://api.dicebear.com/7.x/bottts/png?seed=ActivePulse&backgroundColor=fff1f2',
  },
  {
    id: 'zen_capybara',
    name: 'Zen Capy',
    emoji: '🧘',
    bg: '#F5F3FF',
    url: 'https://api.dicebear.com/7.x/bottts/png?seed=ZenCapy&backgroundColor=f5f3ff',
  },
];

export default function EditProfileModal() {
  const router = useRouter();
  const { profile, updateProfile, uploadAvatar, signOut } = useAuthStore();

  const [fullName, setFullName] = useState(profile?.full_name || 'NutriExplorer');
  const [dailyCalories, setDailyCalories] = useState(String(profile?.daily_calories || 2100));
  const [proteinG, setProteinG] = useState(String(profile?.protein_g || 130));
  const [carbsG, setCarbsG] = useState(String(profile?.carbs_g || 220));
  const [fatG, setFatG] = useState(String(profile?.fat_g || 65));

  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(profile?.avatar_url || null);
  const [isSaving, setIsSaving] = useState(false);

  const displayAvatarUri = selectedImageUri;

  const handleSelectPreset = (url: string) => {
    safeHaptics.selection();
    setSelectedImageUri(url);
  };

  const handleResetToInitials = () => {
    safeHaptics.impact(Haptics.ImpactFeedbackStyle.Light);
    setSelectedImageUri(null);
  };

  const handleChooseFromLibrary = async () => {
    safeHaptics.impact(Haptics.ImpactFeedbackStyle.Light);
    const uri = await pickImageFromLibrary();
    if (uri) {
      setSelectedImageUri(uri);
      safeHaptics.impact(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const handleTakePhoto = async () => {
    safeHaptics.impact(Haptics.ImpactFeedbackStyle.Light);
    const uri = await capturePhotoWithCamera();
    if (uri) {
      setSelectedImageUri(uri);
      safeHaptics.impact(Haptics.ImpactFeedbackStyle.Medium);
    }
  };



  const handleSave = async () => {
    safeHaptics.impact(Haptics.ImpactFeedbackStyle.Medium);
    setIsSaving(true);

    try {
      let finalAvatarUrl = profile?.avatar_url || null;

      if (selectedImageUri) {
        if (selectedImageUri.startsWith('http://') || selectedImageUri.startsWith('https://')) {
          finalAvatarUrl = selectedImageUri;
        } else {
          const uploaded = await uploadAvatar(selectedImageUri);
          if (uploaded) {
            finalAvatarUrl = uploaded;
          }
        }
      }

      const parsedCalories = parseInt(dailyCalories, 10) || 2100;
      const parsedProtein = parseInt(proteinG, 10) || 130;
      const parsedCarbs = parseInt(carbsG, 10) || 220;
      const parsedFat = parseInt(fatG, 10) || 65;

      const res = await updateProfile({
        full_name: fullName.trim() || 'NutriExplorer',
        daily_calories: parsedCalories,
        protein_g: parsedProtein,
        carbs_g: parsedCarbs,
        fat_g: parsedFat,
        avatar_url: finalAvatarUrl,
      });

      setIsSaving(false);

      if (res.success) {
        safeHaptics.notification(Haptics.NotificationFeedbackType.Success);
        router.back();
      } else {
        if (res.error && res.error.includes('schema cache')) {
          Alert.alert(
            'Profile Saved Locally',
            'Your changes are saved on this device. To sync with your Supabase cloud database, run the SQL migration in your Supabase dashboard SQL editor.'
          );
        } else {
          Alert.alert('Save Notice', res.error || 'Changes saved locally.');
        }
        router.back();
      }
    } catch (err) {
      console.warn('[EditProfile] Save error:', err);
      setIsSaving(false);
      router.back();
    }
  };

  const handleSignOutPress = () => {
    safeHaptics.impact(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of NutriBuddy on this device?',
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
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => router.back()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <X size={20} color={colors.text.secondary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Avatar Showcase & Edit Stage */}
          <View style={styles.avatarCard}>
            <View style={styles.avatarContainer}>
              {displayAvatarUri ? (
                <Image source={{ uri: displayAvatarUri }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarInitial}>
                    {(fullName || 'N').charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={styles.cameraIconBadge}>
                <Sparkles size={13} color="#FFFFFF" />
              </View>
            </View>

            <Text style={styles.avatarLabel}>Select Mascot Avatar</Text>
            <Text style={styles.avatarSubtext}>
              Tap any companion below for instant 1-tap customization
            </Text>

            {/* Curated Preset Avatars Grid */}
            <View style={styles.presetsGrid}>
              {PRESET_AVATARS.map((preset) => {
                const isSelected = displayAvatarUri === preset.url;
                return (
                  <TouchableOpacity
                    key={preset.id}
                    style={[
                      styles.presetItem,
                      isSelected && styles.presetItemActive,
                      { backgroundColor: preset.bg },
                    ]}
                    onPress={() => handleSelectPreset(preset.url)}
                    activeOpacity={0.75}
                  >
                    <Image source={{ uri: preset.url }} style={styles.presetImage} />
                    <View style={styles.presetEmojiBadge}>
                      <Text style={styles.presetEmojiText}>{preset.emoji}</Text>
                    </View>
                    {isSelected && (
                      <View style={styles.presetCheckmark}>
                        <Check size={10} color="#FFFFFF" strokeWidth={3} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Auxiliary Photo Actions */}
            <View style={styles.photoActions}>
              <TouchableOpacity
                style={styles.photoActionBtn}
                onPress={handleChooseFromLibrary}
                activeOpacity={0.8}
              >
                <ImageIcon size={14} color={colors.text.secondary} />
                <Text style={styles.photoActionText}>Custom Photo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.photoActionBtn}
                onPress={handleTakePhoto}
                activeOpacity={0.8}
              >
                <Camera size={14} color={colors.text.secondary} />
                <Text style={styles.photoActionText}>Camera</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.photoActionBtn}
                onPress={handleResetToInitials}
                activeOpacity={0.8}
              >
                <RotateCcw size={14} color={colors.text.secondary} />
                <Text style={styles.photoActionText}>Initials</Text>
              </TouchableOpacity>
            </View>
          </View>


          {/* Personal Information */}
          <Text style={styles.sectionHeader}>Personal Information</Text>
          <View style={styles.formCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name</Text>
              <View style={styles.inputWrapper}>
                <User size={18} color={colors.text.muted} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Your Name"
                  placeholderTextColor={colors.text.muted}
                />
              </View>
            </View>

            {profile?.email && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email (Read-only)</Text>
                <View style={[styles.inputWrapper, styles.readOnlyWrapper]}>
                  <Text style={styles.readOnlyText}>{profile.email}</Text>
                </View>
              </View>
            )}

            {profile?.phone && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Phone (Read-only)</Text>
                <View style={[styles.inputWrapper, styles.readOnlyWrapper]}>
                  <Text style={styles.readOnlyText}>{profile.phone}</Text>
                </View>
              </View>
            )}
          </View>

          {/* Nutritional Macro Goals */}
          <Text style={styles.sectionHeader}>Daily Macro Targets</Text>
          <View style={styles.formCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Daily Calorie Budget (kcal)</Text>
              <View style={styles.inputWrapper}>
                <Flame size={18} color={colors.brand.amber} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  value={dailyCalories}
                  onChangeText={setDailyCalories}
                  placeholder="2100"
                  placeholderTextColor={colors.text.muted}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.macroRow}>
              <View style={[styles.inputGroup, styles.macroCol]}>
                <Text style={styles.inputLabel}>Protein (g)</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.textInput}
                    value={proteinG}
                    onChangeText={setProteinG}
                    placeholder="130"
                    placeholderTextColor={colors.text.muted}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={[styles.inputGroup, styles.macroCol]}>
                <Text style={styles.inputLabel}>Carbs (g)</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.textInput}
                    value={carbsG}
                    onChangeText={setCarbsG}
                    placeholder="220"
                    placeholderTextColor={colors.text.muted}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={[styles.inputGroup, styles.macroCol]}>
                <Text style={styles.inputLabel}>Fat (g)</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.textInput}
                    value={fatG}
                    onChangeText={setFatG}
                    placeholder="65"
                    placeholderTextColor={colors.text.muted}
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </View>
          </View>

          {/* Save Changes Button */}
          <TouchableOpacity
            style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={isSaving}
            activeOpacity={0.85}
          >
            {isSaving ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Check size={18} color="#FFFFFF" strokeWidth={2.5} />
                <Text style={styles.saveBtnText}>Save Profile Changes</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Sign Out Section */}
          <TouchableOpacity
            style={styles.signOutBtn}
            onPress={handleSignOutPress}
            activeOpacity={0.8}
          >
            <LogOut size={16} color={colors.brand.crimson} />
            <Text style={styles.signOutBtnText}>Sign Out of NutriBuddy</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface.background,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    ...typography.headingMedium,
    color: colors.text.primary,
  },
  closeBtn: {
    padding: 6,
    borderRadius: radii.full,
    backgroundColor: colors.surface.subtle,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: 60,
  },
  avatarCard: {
    backgroundColor: colors.surface.card,
    borderRadius: radii.xl,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.surface.border,
    ...shadows.card,
  },
  avatarContainer: {
    position: 'relative',
    width: 88,
    height: 88,
    borderRadius: 44,
    marginBottom: spacing.sm,
  },
  avatarImage: {
    width: 88,
    height: 88,
    borderRadius: 44,
  },
  avatarFallback: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.brand.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    ...typography.displayMedium,
    fontSize: 34,
    color: colors.brand.primaryDark,
    fontWeight: '700',
  },
  cameraIconBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarLabel: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  avatarSubtext: {
    ...typography.caption,
    color: colors.text.secondary,
    fontSize: 11,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginBottom: spacing.lg,
    maxWidth: 320,
  },
  presetItem: {
    position: 'relative',
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 3,
  },
  presetItemActive: {
    borderColor: colors.brand.primary,
    transform: [{ scale: 1.08 }],
    ...shadows.card,
  },
  presetImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  presetEmojiBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  presetEmojiText: {
    fontSize: 10,
  },
  presetCheckmark: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: colors.brand.primary,
    borderRadius: radii.full,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  photoActions: {
    flexDirection: 'row',
    gap: 12,
  },
  photoActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.brand.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radii.full,
    gap: 6,
  },
  photoActionText: {
    ...typography.caption,
    color: colors.brand.primaryDark,
    fontWeight: '700',
    fontSize: 12,
  },
  sectionHeader: {
    ...typography.headingSmall,
    color: colors.text.primary,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  formCard: {
    backgroundColor: colors.surface.card,
    borderRadius: radii.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.surface.border,
    ...shadows.card,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 6,
    textTransform: 'uppercase',
    fontSize: 10,
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface.subtle,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.surface.border,
    paddingHorizontal: 12,
    height: 48,
  },
  readOnlyWrapper: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
  },
  readOnlyText: {
    ...typography.bodyMedium,
    color: colors.text.muted,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    ...typography.bodyMedium,
    color: colors.text.primary,
    fontSize: 15,
  },
  macroRow: {
    flexDirection: 'row',
    gap: 10,
  },
  macroCol: {
    flex: 1,
    marginBottom: 0,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brand.primary,
    borderRadius: radii.lg,
    paddingVertical: 14,
    gap: 8,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
    ...shadows.button,
  },
  saveBtnDisabled: {
    opacity: 0.65,
  },
  saveBtnText: {
    ...typography.bodyLarge,
    fontWeight: '700',
    color: '#FFFFFF',
    fontSize: 15,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    borderRadius: radii.lg,
    paddingVertical: 12,
    gap: 8,
    marginBottom: spacing.xl,
  },
  signOutBtnText: {
    ...typography.bodyMedium,
    fontWeight: '700',
    color: colors.brand.crimson,
    fontSize: 14,
  },
});
