import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  Mail,
  Lock,
  Phone,
  User,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  KeyRound,
  AlertCircle,
} from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';
import { colors, radii, shadows, spacing, typography } from '../../theme';
import { useAuthStore } from '../../store/useAuthStore';
import safeHaptics from '../../utils/haptics';

function GoogleIcon({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
      />
      <Path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
      />
      <Path
        fill="#FBBC05"
        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.04 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
      />
      <Path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
      />
    </Svg>
  );
}

type AuthMode = 'EMAIL' | 'PHONE';
type EmailSubMode = 'SIGN_IN' | 'SIGN_UP';

export default function AuthScreen() {
  const router = useRouter();
  const {
    signUpWithEmail,
    signInWithEmail,
    signInWithPhone,
    verifyPhoneOTP,
    signInWithGoogle,
    signInAsGuest,
    isLoading,
    authError,
    clearError,
  } = useAuthStore();

  const [mode, setMode] = useState<AuthMode>('EMAIL');
  const [emailSubMode, setEmailSubMode] = useState<EmailSubMode>('SIGN_IN');

  // Email form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Phone form state
  const [phone, setPhone] = useState('');
  const [otpToken, setOtpToken] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);

  // Local form validation error
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    safeHaptics.impact(Haptics.ImpactFeedbackStyle.Medium);
    clearError();
    setValidationError(null);
    setIsGoogleLoading(true);

    try {
      const res = await signInWithGoogle();
      setIsGoogleLoading(false);

      if (res.success) {
        safeHaptics.notification(Haptics.NotificationFeedbackType.Success);
        router.replace('/(tabs)');
      } else if (res.error && !res.error.includes('cancelled') && !res.error.includes('dismissed')) {
        setValidationError(res.error);
      }
    } catch (err: any) {
      setIsGoogleLoading(false);
      setValidationError(err?.message || 'Failed to sign in with Google');
    }
  };

  const handleTabChange = (newMode: AuthMode) => {
    safeHaptics.impact(Haptics.ImpactFeedbackStyle.Light);
    clearError();
    setValidationError(null);
    setMode(newMode);
  };

  const handleSubModeChange = (newSubMode: EmailSubMode) => {
    safeHaptics.impact(Haptics.ImpactFeedbackStyle.Light);
    clearError();
    setValidationError(null);
    setEmailSubMode(newSubMode);
  };

  const handleEmailSubmit = async () => {
    safeHaptics.impact(Haptics.ImpactFeedbackStyle.Medium);
    clearError();
    setValidationError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !trimmedEmail.includes('@') || !trimmedEmail.includes('.')) {
      setValidationError('Please enter a valid email address');
      return;
    }

    if (!password || password.length < 6) {
      setValidationError('Password must be at least 6 characters');
      return;
    }

    if (emailSubMode === 'SIGN_UP') {
      const trimmedName = fullName.trim();
      if (!trimmedName) {
        setValidationError('Please enter your full name');
        return;
      }

      const res = await signUpWithEmail(trimmedEmail, password, trimmedName);
      if (res.success) {
        safeHaptics.notification(Haptics.NotificationFeedbackType.Success);
        router.replace('/(tabs)');
      }
    } else {
      const res = await signInWithEmail(trimmedEmail, password);
      if (res.success) {
        safeHaptics.notification(Haptics.NotificationFeedbackType.Success);
        router.replace('/(tabs)');
      }
    }
  };

  const handleSendPhoneOTP = async () => {
    safeHaptics.impact(Haptics.ImpactFeedbackStyle.Medium);
    clearError();
    setValidationError(null);

    const trimmedPhone = phone.trim();
    if (!trimmedPhone || trimmedPhone.length < 8) {
      setValidationError('Please enter a valid phone number with country code (e.g. +1234567890)');
      return;
    }

    const res = await signInWithPhone(trimmedPhone);
    if (res.success) {
      safeHaptics.notification(Haptics.NotificationFeedbackType.Success);
      setIsOtpSent(true);
    }
  };

  const handleVerifyPhoneOTP = async () => {
    safeHaptics.impact(Haptics.ImpactFeedbackStyle.Medium);
    clearError();
    setValidationError(null);

    const trimmedToken = otpToken.trim();
    if (!trimmedToken || trimmedToken.length < 4) {
      setValidationError('Please enter the verification code sent to your phone');
      return;
    }

    const res = await verifyPhoneOTP(phone.trim(), trimmedToken);
    if (res.success) {
      safeHaptics.notification(Haptics.NotificationFeedbackType.Success);
      router.replace('/(tabs)');
    }
  };

  const handleGuestLogin = () => {
    safeHaptics.impact(Haptics.ImpactFeedbackStyle.Light);
    signInAsGuest();
    router.replace('/(tabs)');
  };

  const activeError = validationError || authError;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Brand & Mascot Greeting Banner */}
          <View style={styles.headerCard}>
            <View style={styles.mascotBadge}>
              <Sparkles size={14} color={colors.brand.primaryDark} />
              <Text style={styles.mascotBadgeText}>NutriBuddy Intelligence</Text>
            </View>

            <Text style={styles.heroTitle}>Fuel your body with intention.</Text>
            <Text style={styles.heroSubtitle}>
              Meet Bao the Red Panda — your private AI nutrition companion for ingredient transparency and whole foods.
            </Text>
          </View>

          {/* Google One-Tap Sign In */}
          <TouchableOpacity
            style={[styles.googleButton, isGoogleLoading && styles.googleButtonDisabled]}
            onPress={handleGoogleSignIn}
            disabled={isGoogleLoading || isLoading}
            activeOpacity={0.85}
          >
            {isGoogleLoading ? (
              <ActivityIndicator size="small" color={colors.text.primary} />
            ) : (
              <>
                <GoogleIcon size={20} />
                <Text style={styles.googleButtonText}>Continue with Google</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Sleek Divider */}
          <View style={styles.googleDividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or continue with email & phone</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Primary Segmented Tab (Email vs Phone) */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tabButton, mode === 'EMAIL' && styles.tabButtonActive]}
              onPress={() => handleTabChange('EMAIL')}
              activeOpacity={0.8}
            >
              <Mail size={16} color={mode === 'EMAIL' ? colors.brand.primaryDark : colors.text.muted} />
              <Text style={[styles.tabText, mode === 'EMAIL' && styles.tabTextActive]}>
                Email Account
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabButton, mode === 'PHONE' && styles.tabButtonActive]}
              onPress={() => handleTabChange('PHONE')}
              activeOpacity={0.8}
            >
              <Phone size={16} color={mode === 'PHONE' ? colors.brand.primaryDark : colors.text.muted} />
              <Text style={[styles.tabText, mode === 'PHONE' && styles.tabTextActive]}>
                Phone OTP
              </Text>
            </TouchableOpacity>
          </View>

          {/* Error Message Banner */}
          {activeError && (
            <View style={styles.errorCard}>
              <AlertCircle size={16} color={colors.brand.crimson} />
              <Text style={styles.errorText}>{activeError}</Text>
            </View>
          )}

          {/* EMAIL LOGIN TAB */}
          {mode === 'EMAIL' && (
            <View style={styles.formCard}>
              {/* Sign In vs Sign Up Toggle */}
              <View style={styles.subModeToggle}>
                <TouchableOpacity
                  style={[styles.subModeBtn, emailSubMode === 'SIGN_IN' && styles.subModeBtnActive]}
                  onPress={() => handleSubModeChange('SIGN_IN')}
                >
                  <Text style={[styles.subModeText, emailSubMode === 'SIGN_IN' && styles.subModeTextActive]}>
                    Sign In
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.subModeBtn, emailSubMode === 'SIGN_UP' && styles.subModeBtnActive]}
                  onPress={() => handleSubModeChange('SIGN_UP')}
                >
                  <Text style={[styles.subModeText, emailSubMode === 'SIGN_UP' && styles.subModeTextActive]}>
                    Create Account
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Full Name field if Sign Up */}
              {emailSubMode === 'SIGN_UP' && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Full Name</Text>
                  <View style={styles.inputWrapper}>
                    <User size={18} color={colors.text.muted} style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. Alex Sharma"
                      placeholderTextColor={colors.text.muted}
                      value={fullName}
                      onChangeText={setFullName}
                      autoCapitalize="words"
                    />
                  </View>
                </View>
              )}

              {/* Email field */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email Address</Text>
                <View style={styles.inputWrapper}>
                  <Mail size={18} color={colors.text.muted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="alex@nutribuddy.app"
                    placeholderTextColor={colors.text.muted}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              {/* Password field */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Password</Text>
                <View style={styles.inputWrapper}>
                  <Lock size={18} color={colors.text.muted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="••••••••"
                    placeholderTextColor={colors.text.muted}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    {showPassword ? (
                      <EyeOff size={18} color={colors.text.muted} />
                    ) : (
                      <Eye size={18} color={colors.text.muted} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Action Button */}
              <TouchableOpacity
                style={[styles.primaryButton, isLoading && styles.primaryButtonDisabled]}
                onPress={handleEmailSubmit}
                disabled={isLoading}
                activeOpacity={0.85}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Text style={styles.primaryButtonText}>
                      {emailSubMode === 'SIGN_IN' ? 'Sign In to NutriBuddy' : 'Join NutriBuddy'}
                    </Text>
                    <ArrowRight size={18} color="#FFFFFF" />
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* PHONE OTP TAB */}
          {mode === 'PHONE' && (
            <View style={styles.formCard}>
              {!isOtpSent ? (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Mobile Phone Number</Text>
                    <Text style={styles.inputHelp}>
                      Include international country code prefix (e.g. +1 555-0199 or +91)
                    </Text>
                    <View style={styles.inputWrapper}>
                      <Phone size={18} color={colors.text.muted} style={styles.inputIcon} />
                      <TextInput
                        style={styles.textInput}
                        placeholder="+1 555 123 4567"
                        placeholderTextColor={colors.text.muted}
                        value={phone}
                        onChangeText={setPhone}
                        keyboardType="phone-pad"
                        autoCapitalize="none"
                      />
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[styles.primaryButton, isLoading && styles.primaryButtonDisabled]}
                    onPress={handleSendPhoneOTP}
                    disabled={isLoading}
                    activeOpacity={0.85}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <>
                        <Text style={styles.primaryButtonText}>Send One-Time Passcode</Text>
                        <ArrowRight size={18} color="#FFFFFF" />
                      </>
                    )}
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Enter 6-Digit Code</Text>
                    <Text style={styles.inputHelp}>
                      Passcode sent to <Text style={styles.boldText}>{phone}</Text>
                    </Text>
                    <View style={styles.inputWrapper}>
                      <KeyRound size={18} color={colors.brand.primary} style={styles.inputIcon} />
                      <TextInput
                        style={[styles.textInput, styles.otpInput]}
                        placeholder="123456"
                        placeholderTextColor={colors.text.muted}
                        value={otpToken}
                        onChangeText={setOtpToken}
                        keyboardType="number-pad"
                        maxLength={8}
                        autoFocus
                      />
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[styles.primaryButton, isLoading && styles.primaryButtonDisabled]}
                    onPress={handleVerifyPhoneOTP}
                    disabled={isLoading}
                    activeOpacity={0.85}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <>
                        <Text style={styles.primaryButtonText}>Verify & Continue</Text>
                        <ShieldCheck size={18} color="#FFFFFF" />
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.secondaryLink}
                    onPress={() => {
                      setIsOtpSent(false);
                      setOtpToken('');
                    }}
                  >
                    <Text style={styles.secondaryLinkText}>Change Phone Number</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}

          {/* Guest / Offline Demo Option */}
          <View style={styles.guestSection}>
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or continue without account</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={styles.guestButton}
              onPress={handleGuestLogin}
              activeOpacity={0.8}
            >
              <ShieldCheck size={16} color={colors.brand.primaryDark} />
              <Text style={styles.guestButtonText}>Try Offline Explorer Demo</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: Platform.OS === 'android' ? 36 : 16,
    paddingBottom: 40,
  },
  headerCard: {
    backgroundColor: colors.surface.card,
    borderRadius: radii.xl,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.surface.border,
    ...shadows.card,
  },
  mascotBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.brand.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.full,
    gap: 6,
    marginBottom: spacing.md,
  },
  mascotBadgeText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.brand.primaryDark,
    fontSize: 11,
  },
  heroTitle: {
    ...typography.headingLarge,
    fontSize: 26,
    lineHeight: 32,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  heroSubtitle: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
    lineHeight: 22,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#EDF2F7',
    borderRadius: radii.lg,
    padding: 4,
    marginBottom: spacing.md,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: radii.md,
    gap: 8,
  },
  tabButtonActive: {
    backgroundColor: '#FFFFFF',
    ...shadows.subtle,
  },
  tabText: {
    ...typography.bodyMedium,
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.muted,
  },
  tabTextActive: {
    color: colors.brand.primaryDark,
    fontWeight: '700',
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.brand.crimsonLight,
    borderWidth: 1,
    borderColor: '#FECDD3',
    borderRadius: radii.md,
    padding: spacing.md,
    gap: 8,
    marginBottom: spacing.md,
  },
  errorText: {
    ...typography.caption,
    color: colors.brand.crimson,
    flex: 1,
    fontWeight: '600',
  },
  formCard: {
    backgroundColor: colors.surface.card,
    borderRadius: radii.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.surface.border,
    ...shadows.card,
  },
  subModeToggle: {
    flexDirection: 'row',
    backgroundColor: colors.surface.subtle,
    borderRadius: radii.md,
    padding: 3,
    marginBottom: spacing.lg,
  },
  subModeBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: radii.sm,
  },
  subModeBtnActive: {
    backgroundColor: '#FFFFFF',
    ...shadows.subtle,
  },
  subModeText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.text.muted,
  },
  subModeTextActive: {
    color: colors.text.primary,
    fontWeight: '700',
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
    letterSpacing: 0.5,
  },
  inputHelp: {
    ...typography.caption,
    fontSize: 11,
    color: colors.text.secondary,
    marginBottom: 8,
  },
  boldText: {
    fontWeight: '700',
    color: colors.text.primary,
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
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    ...typography.bodyMedium,
    color: colors.text.primary,
    fontSize: 15,
  },
  otpInput: {
    letterSpacing: 8,
    fontSize: 20,
    fontWeight: '700',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brand.primary,
    borderRadius: radii.lg,
    paddingVertical: 14,
    gap: 8,
    marginTop: spacing.sm,
    ...shadows.button,
  },
  primaryButtonDisabled: {
    opacity: 0.65,
  },
  primaryButtonText: {
    ...typography.bodyLarge,
    fontWeight: '700',
    color: '#FFFFFF',
    fontSize: 15,
  },
  secondaryLink: {
    alignItems: 'center',
    marginTop: spacing.md,
    paddingVertical: 4,
  },
  secondaryLinkText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.brand.primaryDark,
  },
  guestSection: {
    marginTop: spacing.xl,
    alignItems: 'center',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border.subtle,
  },
  dividerText: {
    ...typography.caption,
    color: colors.text.muted,
    paddingHorizontal: spacing.md,
    fontSize: 11,
  },
  guestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border.subtle,
    borderRadius: radii.full,
    paddingHorizontal: 18,
    paddingVertical: 10,
    gap: 8,
    ...shadows.subtle,
  },
  guestButtonText: {
    ...typography.bodyMedium,
    fontWeight: '600',
    color: colors.brand.primaryDark,
    fontSize: 13,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderColor: colors.border.subtle,
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    gap: 12,
    marginBottom: spacing.lg,
    ...shadows.card,
  },
  googleButtonDisabled: {
    opacity: 0.65,
  },
  googleButtonText: {
    ...typography.bodyMedium,
    fontWeight: '700',
    color: colors.text.primary,
    fontSize: 15,
  },
  googleDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: spacing.lg,
  },
});
