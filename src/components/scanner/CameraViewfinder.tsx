import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import safeHaptics from '../../utils/haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import {
  Zap,
  ZapOff,
  RefreshCw,
  Camera as CameraIcon,
  Sparkles,
  Package,
  UtensilsCrossed,
  AlertCircle,
} from 'lucide-react-native';
import { colors, spacing, radii, typography, shadows } from '../../theme';
import { useScanStore } from '../../store/useScanStore';
import { useMascotStore } from '../../store/useMascotStore';
import { useProfileStore } from '../../store/useProfileStore';
import { ScanType } from '../../types/scan';
import { processPackagedLabelScan } from '../../services/ai/agents/packagedScanAgent';
import { processLiveFoodScan } from '../../services/ai/agents/liveFoodAgent';
import { syncMascotWithScanResult } from '../../services/ai/agents/mascotAgent';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const RETICLE_SIZE = Math.min(SCREEN_WIDTH * 0.78, 300);

interface CameraViewfinderProps {
  onCapture?: (imageUri?: string) => void;
  onOpenResults?: () => void;
}

export const CameraViewfinder: React.FC<CameraViewfinderProps> = ({
  onCapture,
  onOpenResults,
}) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isReticleReady, setIsReticleReady] = useState(false);
  const cameraRef = useRef<any>(null);

  const scanType = useScanStore((state) => state.scanType);
  const processingStatus = useScanStore((state) => state.processingStatus);
  const setScanType = useScanStore((state) => state.setScanType);
  const startScan = useScanStore((state) => state.startScan);
  const setScanSuccess = useScanStore((state) => state.setScanSuccess);
  const setScanError = useScanStore((state) => state.setScanError);

  // Scanline animation - only triggers after reticle view mounts
  const scanLineY = useSharedValue(0);

  useEffect(() => {
    if (!isReticleReady) return;
    scanLineY.value = withRepeat(
      withTiming(RETICLE_SIZE - 4, {
        duration: 2200,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );
  }, [isReticleReady]);

  const animatedScanLineStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: scanLineY.value }],
    };
  });

  const handleToggleTorch = () => {
    safeHaptics.impact(Haptics.ImpactFeedbackStyle.Light);
    setTorchEnabled((prev) => !prev);
  };

  const handleToggleFacing = () => {
    safeHaptics.impact(Haptics.ImpactFeedbackStyle.Light);
    setFacing((prev) => (prev === 'back' ? 'front' : 'back'));
  };

  const handleSelectScanType = (type: ScanType) => {
    if (type === scanType) return;
    safeHaptics.selection();
    setScanType(type);
    setLocalError(null);
  };

  const executePipeline = async (base64Image?: string, imageUri?: string) => {
    setLocalError(null);
    startScan(imageUri);

    try {
      const activeUserAllergens = useProfileStore.getState().getSelectedAllergensList();

      if (scanType === 'PACKAGED') {
        const result = await processPackagedLabelScan({
          base64Image,
          userAllergens: activeUserAllergens,
        });
        setScanSuccess(result);
        syncMascotWithScanResult(result);
      } else {
        const result = await processLiveFoodScan({
          base64Image,
          imageUri: imageUri || '',
        });
        setScanSuccess(result);
        syncMascotWithScanResult(result);
      }

      if (onOpenResults) {
        onOpenResults();
      }
    } catch (err: any) {
      console.error('[Scanner Pipeline Error]', err);
      const msg = err?.message || 'Unable to analyze image. Please ensure good lighting and try again.';
      setLocalError(msg);
      setScanError(msg);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleCapture = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    let base64: string | undefined;
    let uri: string | undefined;

    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.85,
          base64: true,
          skipProcessing: false,
        });
        base64 = photo?.base64;
        uri = photo?.uri;
        if (onCapture && uri) onCapture(uri);
      } catch (err) {
        // Fall back gracefully for emulator / mock camera
        console.warn('Camera takePictureAsync unavailable, running fallback.');
      }
    }

    await executePipeline(base64, uri);
  };

  const handleDemoScan = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await executePipeline(undefined, undefined);
  };

  // Permission Request View
  if (!permission) {
    return <View style={styles.darkBackground} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <View style={styles.permissionIconCircle}>
          <CameraIcon size={36} color={colors.brand.primary} />
        </View>
        <Text style={styles.permissionTitle}>Camera Access Required</Text>
        <Text style={styles.permissionSubtitle}>
          NutriBuddy uses your camera to scan barcodes, packaging ingredients, and live plated meals.
        </Text>
        <TouchableOpacity
          style={styles.permissionButton}
          activeOpacity={0.8}
          onPress={requestPermission}
        >
          <Text style={styles.permissionButtonText}>Enable Camera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isScanning = processingStatus === 'SCANNING';

  return (
    <View style={styles.container}>
      {/* Edge-to-edge Camera */}
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFillObject}
        facing={facing}
        enableTorch={torchEnabled}
      >
        {/* Top Control Bar with Segmented Toggle */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.iconCircle}
            onPress={handleToggleTorch}
            activeOpacity={0.7}
          >
            {torchEnabled ? (
              <Zap size={20} color={colors.brand.amber} />
            ) : (
              <ZapOff size={20} color="#FFFFFF" />
            )}
          </TouchableOpacity>

          {/* Segmented Control */}
          <View style={styles.segmentedContainer}>
            <TouchableOpacity
              style={[
                styles.segmentTab,
                scanType === 'PACKAGED' && styles.segmentTabActive,
              ]}
              onPress={() => handleSelectScanType('PACKAGED')}
              activeOpacity={0.8}
            >
              <Package
                size={14}
                color={scanType === 'PACKAGED' ? colors.brand.primaryDark : 'rgba(255,255,255,0.7)'}
              />
              <Text
                style={[
                  styles.segmentText,
                  scanType === 'PACKAGED' && styles.segmentTextActive,
                ]}
              >
                Packaged
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.segmentTab,
                scanType === 'LIVE_FOOD' && styles.segmentTabActive,
              ]}
              onPress={() => handleSelectScanType('LIVE_FOOD')}
              activeOpacity={0.8}
            >
              <UtensilsCrossed
                size={14}
                color={scanType === 'LIVE_FOOD' ? colors.brand.primaryDark : 'rgba(255,255,255,0.7)'}
              />
              <Text
                style={[
                  styles.segmentText,
                  scanType === 'LIVE_FOOD' && styles.segmentTextActive,
                ]}
              >
                Live Food
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.iconCircle}
            onPress={handleToggleFacing}
            activeOpacity={0.7}
          >
            <RefreshCw size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Center Viewfinder Reticle */}
        <View style={styles.centerContainer}>
          <View
            style={[
              styles.reticleFrame,
              scanType === 'LIVE_FOOD' && styles.reticleFrameRound,
            ]}
            onLayout={() => setIsReticleReady(true)}
          >
            {/* Corner Bracket Accents */}
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />

            {/* Glowing animated scanline */}
            <Animated.View style={[styles.scanLine, animatedScanLineStyle]} />

            {/* Guiding Helper Text */}
            <View style={styles.guideBadge}>
              <Sparkles size={13} color={colors.brand.primary} />
              <Text style={styles.guideText}>
                {scanType === 'PACKAGED'
                  ? 'Center barcode or ingredient label'
                  : 'Frame your plate or dish'}
              </Text>
            </View>
          </View>

          {/* Error Banner if any */}
          {localError && (
            <View style={styles.errorToast}>
              <AlertCircle size={16} color="#FFFFFF" />
              <Text style={styles.errorToastText}>{localError}</Text>
            </View>
          )}
        </View>

        {/* Bottom Shutter Action Bar */}
        <View style={styles.bottomBar}>
          {/* Quick Demo Scan button */}
          <TouchableOpacity
            style={styles.quickScanButton}
            onPress={handleDemoScan}
            disabled={isScanning}
            activeOpacity={0.8}
          >
            <Text style={styles.quickScanText}>AI Demo</Text>
          </TouchableOpacity>

          {/* Shutter Button */}
          <TouchableOpacity
            style={[styles.shutterOuter, isScanning && styles.shutterDisabled]}
            onPress={handleCapture}
            disabled={isScanning}
            activeOpacity={0.85}
          >
            <View style={styles.shutterInner} />
          </TouchableOpacity>

          {/* Spacer */}
          <View style={{ width: 80 }} />
        </View>

        {/* Real-time AI Processing Overlay */}
        {isScanning && (
          <Animated.View
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(200)}
            style={styles.processingBackdrop}
          >
            <View style={styles.processingCard}>
              <ActivityIndicator size="large" color={colors.brand.primary} />
              <Text style={styles.processingTitle}>
                {scanType === 'PACKAGED'
                  ? 'Decoding Ingredients & Additives...'
                  : 'Analyzing Plate & Estimating Macros...'}
              </Text>
              <Text style={styles.processingSubtitle}>
                Bao is evaluating health index and checking allergens
              </Text>
            </View>
          </Animated.View>
        )}
      </CameraView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  darkBackground: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: colors.surface.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  permissionIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.brand.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  permissionTitle: {
    ...typography.headingLarge,
    color: colors.text.primary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  permissionSubtitle: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  permissionButton: {
    backgroundColor: colors.brand.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.pill,
    ...shadows.card,
  },
  permissionButtonText: {
    ...typography.labelBold,
    color: '#FFFFFF',
    fontSize: 15,
  },
  topBar: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : 40,
    left: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentedContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    borderRadius: radii.full,
    padding: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  segmentTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: radii.full,
    gap: 6,
  },
  segmentTabActive: {
    backgroundColor: '#FFFFFF',
  },
  segmentText: {
    ...typography.labelBold,
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  segmentTextActive: {
    color: colors.brand.primaryDark,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reticleFrame: {
    width: RETICLE_SIZE,
    height: RETICLE_SIZE,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    position: 'relative',
    overflow: 'hidden',
  },
  reticleFrameRound: {
    borderRadius: RETICLE_SIZE / 2,
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: colors.brand.primary,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 3.5,
    borderLeftWidth: 3.5,
    borderTopLeftRadius: 16,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 3.5,
    borderRightWidth: 3.5,
    borderTopRightRadius: 16,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3.5,
    borderLeftWidth: 3.5,
    borderBottomLeftRadius: 16,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3.5,
    borderRightWidth: 3.5,
    borderBottomRightRadius: 16,
  },
  scanLine: {
    height: 2.5,
    width: '100%',
    backgroundColor: colors.brand.primary,
    shadowColor: colors.brand.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
  },
  guideBadge: {
    position: 'absolute',
    bottom: 16,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radii.full,
    gap: 6,
  },
  guideText: {
    ...typography.caption,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  errorToast: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.brand.crimson,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radii.full,
    maxWidth: SCREEN_WIDTH * 0.85,
    gap: 8,
    ...shadows.card,
  },
  errorToastText: {
    ...typography.caption,
    color: '#FFFFFF',
    fontWeight: '600',
    flex: 1,
  },
  bottomBar: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 100 : 80,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    zIndex: 10,
  },
  quickScanButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  quickScanText: {
    ...typography.caption,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  shutterOuter: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    ...shadows.floating,
  },
  shutterDisabled: {
    opacity: 0.5,
  },
  shutterInner: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#FFFFFF',
  },
  processingBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 30,
    paddingHorizontal: spacing.xl,
  },
  processingCard: {
    backgroundColor: colors.surface.card,
    borderRadius: radii.xl,
    padding: spacing.xl,
    alignItems: 'center',
    maxWidth: 320,
    ...shadows.floating,
  },
  processingTitle: {
    ...typography.headingMedium,
    color: colors.text.primary,
    textAlign: 'center',
    marginTop: spacing.md,
    fontSize: 16,
  },
  processingSubtitle: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: 6,
    fontSize: 12,
    lineHeight: 16,
  },
});
