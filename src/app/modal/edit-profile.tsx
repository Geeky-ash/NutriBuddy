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
  ChevronLeft,
  X,
  Camera,
  Image as ImageIcon,
  User,
  Plus,
  Check,
  RotateCcw,
  Calendar,
  Scale,
  Ruler,
  Minus,
  Sparkles,
} from 'lucide-react-native';
import { colors, radii, shadows, spacing, typography } from '../../theme';
import { useAuthStore } from '../../store/useAuthStore';
import { useProfileStore } from '../../store/useProfileStore';
import { saveUserProfileLocal } from '../../services/storage/database';
import { pickImageFromLibrary, capturePhotoWithCamera } from '../../utils/safeImagePicker';
import safeHaptics from '../../utils/haptics';

export const PRESET_AVATARS = [
  {
    id: 'preset_hero_1',
    name: 'Hero Kai',
    bg: '#BAE6FD',
    url: 'https://api.dicebear.com/7.x/personas/png?seed=blazikenaf&backgroundColor=bae6fd',
  },
  {
    id: 'preset_char_2',
    name: 'Amara',
    bg: '#FED7AA',
    url: 'https://api.dicebear.com/7.x/personas/png?seed=Amara&backgroundColor=fed7aa',
  },
  {
    id: 'preset_char_3',
    name: 'Chloe',
    bg: '#FEF08A',
    url: 'https://api.dicebear.com/7.x/personas/png?seed=Chloe&backgroundColor=fef08a',
  },
  {
    id: 'preset_char_4',
    name: 'Mia',
    bg: '#FECDD3',
    url: 'https://api.dicebear.com/7.x/personas/png?seed=Mia&backgroundColor=fecdd3',
  },
  {
    id: 'preset_char_5',
    name: 'Zara',
    bg: '#A7F3D0',
    url: 'https://api.dicebear.com/7.x/personas/png?seed=Zara&backgroundColor=a7f3d0',
  },
  {
    id: 'preset_char_6',
    name: 'Liam',
    bg: '#DDD6FE',
    url: 'https://api.dicebear.com/7.x/personas/png?seed=Liam&backgroundColor=ddd6fe',
  },
  {
    id: 'preset_char_7',
    name: 'Bao Panda',
    bg: '#ECFDF5',
    url: 'https://api.dicebear.com/7.x/bottts/png?seed=BaoPanda&backgroundColor=ecfdf5',
  },
];

const GENDER_OPTIONS = ['Male', 'Female', 'Non-binary'] as const;

export default function EditProfileModal() {
  const router = useRouter();
  const { profile, updateProfile, uploadAvatar } = useAuthStore();
  const profileStore = useProfileStore();

  const [fullName, setFullName] = useState(
    profile?.full_name || profileStore.userName || 'blazikenaf'
  );
  const [genderIndex, setGenderIndex] = useState(() => {
    const currentGender = profile?.gender || profileStore.personalMetrics?.gender || 'Male';
    const idx = GENDER_OPTIONS.findIndex((g) => g.toLowerCase() === currentGender.toLowerCase());
    return idx >= 0 ? idx : 0;
  });
  const [height, setHeight] = useState(() => {
    if (profile?.height_cm) return `${profile.height_cm.toFixed(1)} cm`;
    if (profileStore.personalMetrics?.heightCm) {
      return `${profileStore.personalMetrics.heightCm.toFixed(1)} cm`;
    }
    return '175.0 cm';
  });
  const [weight, setWeight] = useState(() => {
    if (profile?.weight_kg) return `${profile.weight_kg.toFixed(1)} kg`;
    if (profileStore.personalMetrics?.weightKg) {
      return `${profileStore.personalMetrics.weightKg.toFixed(1)} kg`;
    }
    return '63.0 kg';
  });
  const [birthDate, setBirthDate] = useState(
    profile?.birth_date || profileStore.personalMetrics?.birthDate || 'Jan 2, 2005'
  );

  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(
    profile?.avatar_url || profileStore.avatarUrl || PRESET_AVATARS[0].url
  );
  const [isSaving, setIsSaving] = useState(false);

  const currentGender = GENDER_OPTIONS[genderIndex];
  const displayAvatarUri = selectedImageUri || PRESET_AVATARS[0].url;

  const handleSelectPreset = (url: string) => {
    safeHaptics.selection();
    setSelectedImageUri(url);
  };

  const handleResetAvatar = () => {
    safeHaptics.impact(Haptics.ImpactFeedbackStyle.Light);
    // Reset to default preset
    setSelectedImageUri(PRESET_AVATARS[0].url);
  };

  const handleCycleGender = () => {
    safeHaptics.selection();
    setGenderIndex((prev) => (prev + 1) % GENDER_OPTIONS.length);
  };

  const handlePickImage = async () => {
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
      let finalAvatarUrl = selectedImageUri || profile?.avatar_url || null;

      // If local photo picked from gallery/camera, upload to Supabase Storage 'avatars' bucket
      if (
        selectedImageUri &&
        !selectedImageUri.startsWith('http://') &&
        !selectedImageUri.startsWith('https://')
      ) {
        const uploaded = await uploadAvatar(selectedImageUri);
        if (uploaded) {
          finalAvatarUrl = uploaded;
        }
      }

      const cleanName = fullName.trim() || 'blazikenaf';
      const cleanGender = currentGender;
      const parsedHeight = parseFloat(height.replace(/[^0-9.]/g, '')) || 175.0;
      const parsedWeight = parseFloat(weight.replace(/[^0-9.]/g, '')) || 63.0;
      const cleanBirthDate = birthDate.trim() || 'Jan 2, 2005';

      // 1. Update Zustand store
      useProfileStore.getState().setUserName(cleanName);
      useProfileStore.getState().setAvatarUrl(finalAvatarUrl);
      useProfileStore.getState().setPersonalMetrics({
        gender: cleanGender,
        heightCm: parsedHeight,
        weightKg: parsedWeight,
        birthDate: cleanBirthDate,
      });

      // 2. Save locally in SQLite user_profiles table (and AsyncStorage mirror)
      await saveUserProfileLocal({
        id: profile?.id || 'guest-user',
        full_name: cleanName,
        gender: cleanGender,
        height_cm: parsedHeight,
        weight_kg: parsedWeight,
        birth_date: cleanBirthDate,
        avatar_url: finalAvatarUrl,
        updated_at: new Date().toISOString(),
      });

      // 3. Update Supabase remote profiles table
      await updateProfile({
        full_name: cleanName,
        avatar_url: finalAvatarUrl,
        gender: cleanGender,
        height_cm: parsedHeight,
        weight_kg: parsedWeight,
        birth_date: cleanBirthDate,
      });

      setIsSaving(false);
      safeHaptics.notification(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (err) {
      console.warn('[EditProfile] Save error:', err);
      setIsSaving(false);
      router.back();
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerBackBtn}
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ChevronLeft size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <View style={styles.headerPlaceholder} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* 1. Large Main Avatar Preview Card */}
          <View style={styles.previewCardWrapper}>
            <View style={styles.avatarMainCard}>
              {/* Circular guide framing */}
              <View style={styles.circularGuideRing} />

              {/* Avatar Preview Image */}
              <Image
                source={{ uri: displayAvatarUri }}
                style={styles.avatarMainImage}
                resizeMode="cover"
              />

              {/* Top-Right Badge Overlay Button */}
              <TouchableOpacity
                style={styles.avatarBadgeBtn}
                onPress={handleResetAvatar}
                activeOpacity={0.8}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Minus size={14} color="#EF4444" strokeWidth={3} />
              </TouchableOpacity>
            </View>
          </View>

          {/* 2. Preset Avatar Quick-Selector Row */}
          <View style={styles.presetSection}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.presetsScrollContent}
            >
              {PRESET_AVATARS.map((preset) => {
                const isSelected = displayAvatarUri === preset.url;
                return (
                  <TouchableOpacity
                    key={preset.id}
                    style={[
                      styles.presetCircle,
                      { backgroundColor: preset.bg },
                      isSelected && styles.presetCircleSelected,
                    ]}
                    onPress={() => handleSelectPreset(preset.url)}
                    activeOpacity={0.75}
                  >
                    <Image source={{ uri: preset.url }} style={styles.presetCircleImage} />
                    {isSelected && (
                      <View style={styles.presetCheckmarkBadge}>
                        <Check size={9} color="#FFFFFF" strokeWidth={3.5} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}

              {/* Final (+) Custom Photo Button */}
              <TouchableOpacity
                style={styles.customPhotoCircle}
                onPress={handlePickImage}
                activeOpacity={0.8}
              >
                <Plus size={22} color="#FFFFFF" strokeWidth={2.8} />
              </TouchableOpacity>
            </ScrollView>

            {/* Side-by-Side [ Gallery ] and [ Camera ] Action Buttons */}
            <View style={styles.dualPhotoActions}>
              <TouchableOpacity
                style={styles.photoPillBtn}
                onPress={handlePickImage}
                activeOpacity={0.8}
              >
                <ImageIcon size={18} color="#0F172A" />
                <Text style={styles.photoPillText}>Gallery</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.photoPillBtn}
                onPress={handleTakePhoto}
                activeOpacity={0.8}
              >
                <Camera size={18} color="#0F172A" />
                <Text style={styles.photoPillText}>Camera</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 3. Editable Personal Info Form Cards */}
          {/* Name Field Card */}
          <View style={styles.nameCard}>
            <TextInput
              style={styles.nameInput}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Username / Full Name"
              placeholderTextColor={colors.text.muted}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Grouped Personal Metrics Card */}
          <View style={styles.metricsCard}>
            {/* Gender Row */}
            <TouchableOpacity
              style={styles.metricRow}
              onPress={handleCycleGender}
              activeOpacity={0.7}
            >
              <View style={styles.metricIconBox}>
                <User size={20} color="#10B981" />
              </View>
              <Text style={styles.metricValueText}>{currentGender}</Text>
              <View style={styles.genderCyclePill}>
                <Text style={styles.genderCycleText}>Change</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.metricDivider} />

            {/* Height Row */}
            <View style={styles.metricRow}>
              <View style={styles.metricIconBox}>
                <Ruler size={20} color="#10B981" />
              </View>
              <TextInput
                style={styles.metricInput}
                value={height}
                onChangeText={setHeight}
                placeholder="175.0 cm"
                placeholderTextColor={colors.text.muted}
                keyboardType="decimal-pad"
              />
            </View>

            <View style={styles.metricDivider} />

            {/* Weight Row */}
            <View style={styles.metricRow}>
              <View style={styles.metricIconBox}>
                <Scale size={20} color="#10B981" />
              </View>
              <TextInput
                style={styles.metricInput}
                value={weight}
                onChangeText={setWeight}
                placeholder="63.0 kg"
                placeholderTextColor={colors.text.muted}
                keyboardType="decimal-pad"
              />
            </View>

            <View style={styles.metricDivider} />

            {/* Date of Birth Row */}
            <View style={styles.metricRow}>
              <View style={styles.metricIconBox}>
                <Calendar size={20} color="#10B981" />
              </View>
              <TextInput
                style={styles.metricInput}
                value={birthDate}
                onChangeText={setBirthDate}
                placeholder="Jan 2, 2005"
                placeholderTextColor={colors.text.muted}
              />
            </View>
          </View>

          {/* Descriptive Note */}
          <Text style={styles.descriptiveNote}>
            Gender, height, weight, and date of birth are used to calculate optimal calorie intake and health metrics.
          </Text>
        </ScrollView>

        {/* 4. Fixed Bottom Action Bar */}
        <View style={styles.bottomBarContainer} pointerEvents="box-none">
          <View style={styles.floatingCapsule}>
            <TouchableOpacity
              style={styles.capsuleBtn}
              onPress={() => router.back()}
              activeOpacity={0.7}
              disabled={isSaving}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <View style={styles.capsuleDivider} />

            <TouchableOpacity
              style={styles.capsuleBtn}
              onPress={handleSave}
              activeOpacity={0.7}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#34D399" />
              ) : (
                <Text style={styles.saveBtnText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerBackBtn: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
  },
  headerPlaceholder: {
    width: 36,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: 110,
  },

  // 1. Large Main Avatar Preview Card
  previewCardWrapper: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  avatarMainCard: {
    position: 'relative',
    width: 192,
    height: 192,
    borderRadius: 28,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    ...shadows.card,
  },
  circularGuideRing: {
    position: 'absolute',
    width: 168,
    height: 168,
    borderRadius: 84,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.75)',
  },
  avatarMainImage: {
    width: 144,
    height: 144,
    borderRadius: 72,
  },
  avatarBadgeBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },

  // 2. Preset Row & Action Buttons
  presetSection: {
    marginBottom: spacing.lg,
  },
  presetsScrollContent: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: 2,
    gap: 12,
  },
  presetCircle: {
    position: 'relative',
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  presetCircleSelected: {
    borderColor: '#10B981',
    transform: [{ scale: 1.06 }],
    ...shadows.card,
  },
  presetCircleImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  presetCheckmarkBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 17,
    height: 17,
    borderRadius: 8.5,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  customPhotoCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#064E3B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#047857',
  },
  dualPhotoActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: spacing.md,
  },
  photoPillBtn: {
    flex: 1,
    height: 48,
    borderRadius: radii.full,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...shadows.card,
  },
  photoPillText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },

  // 3. Name Card
  nameCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 20,
    paddingVertical: 14,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...shadows.card,
  },
  nameInput: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    padding: 0,
  },

  // 4. Metrics Card
  metricsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...shadows.card,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  metricIconBox: {
    width: 34,
    alignItems: 'flex-start',
  },
  metricValueText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  genderCyclePill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.full,
  },
  genderCycleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  metricInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    padding: 0,
  },
  metricDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  descriptiveNote: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 19,
    color: '#64748B',
    marginTop: 10,
    paddingHorizontal: 8,
  },

  // 5. Fixed Bottom Action Bar
  bottomBarContainer: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  floatingCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: radii.full,
    paddingVertical: 12,
    paddingHorizontal: 32,
    gap: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
      },
      android: {
        elevation: 8,
      },
      default: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
      },
    }),
  },
  capsuleBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  cancelBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  capsuleDivider: {
    width: 1,
    height: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#34D399',
  },
});
