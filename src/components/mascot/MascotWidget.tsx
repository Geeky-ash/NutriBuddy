import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  FadeInUp,
  FadeOutDown,
} from 'react-native-reanimated';
import { X, Sparkles, AlertCircle, Palette } from 'lucide-react-native';
import { colors, radii, shadows, typography } from '../../theme';
import { useMascotStore } from '../../store/useMascotStore';
import {
  MascotMood,
  MASCOT_SKINS,
  MASCOT_ACCESSORIES,
} from '../../types/mascot';
import { Mascot3DErrorBoundary } from './Mascot3DErrorBoundary';
import safeHaptics from '../../utils/haptics';

// Lazy load 3D Canvas only when activated, keeping initial boot bundle fast and light
const LazyMascot3DCanvas = React.lazy(() => import('./Mascot3DCanvas'));

interface MascotWidgetProps {
  onTapMascot?: () => void;
}

export const MascotWidget: React.FC<MascotWidgetProps> = ({ onTapMascot }) => {
  const router = useRouter();
  const mood = useMascotStore((state) => state.mood);
  const activeSkin = useMascotStore((state) => state.activeSkin);
  const activeAccessory = useMascotStore((state) => state.activeAccessory);
  const speechText = useMascotStore((state) => state.speechText);
  const isSpeechVisible = useMascotStore((state) => state.isSpeechVisible);
  const dismissSpeech = useMascotStore((state) => state.dismissSpeech);
  const interact = useMascotStore((state) => state.interact);

  const [use3D, setUse3D] = useState(false);
  const [isMascotReady, setIsMascotReady] = useState(false);

  const skinData = MASCOT_SKINS[activeSkin] || MASCOT_SKINS.classic_panda;
  const currentAccessory = MASCOT_ACCESSORIES.find(
    (a) => a.id === activeAccessory
  );

  // Reanimated shared values for 2D avatar
  const bounceY = useSharedValue(0);
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);

  // Idle floating animation - only starts after outer view mounts
  useEffect(() => {
    if (!isMascotReady) return;
    bounceY.value = withRepeat(
      withSequence(
        withTiming(-6, { duration: 1400 }),
        withTiming(0, { duration: 1400 })
      ),
      -1,
      true
    );
  }, [isMascotReady]);

  // React to mood changes
  useEffect(() => {
    if (!isMascotReady) return;
    if (mood === 'HAPPY') {
      scale.value = withSequence(
        withSpring(1.15, { damping: 4, stiffness: 200 }),
        withSpring(1.0)
      );
      rotation.value = withSequence(
        withTiming(-8, { duration: 80 }),
        withTiming(8, { duration: 160 }),
        withTiming(0, { duration: 100 })
      );
    } else if (mood === 'SAD') {
      scale.value = withSequence(
        withSpring(0.92, { damping: 6 }),
        withSpring(1.0)
      );
    }
  }, [mood, isMascotReady]);

  const animatedAvatarStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: bounceY.value },
        { scale: scale.value },
        { rotateZ: `${rotation.value}deg` },
      ],
    };
  });

  const handleTap = () => {
    safeHaptics.impact(Haptics.ImpactFeedbackStyle.Medium);
    scale.value = withSequence(
      withSpring(1.2, { damping: 5, stiffness: 250 }),
      withSpring(1.0)
    );
    rotation.value = withSequence(
      withTiming(-12, { duration: 70 }),
      withTiming(12, { duration: 140 }),
      withTiming(0, { duration: 90 })
    );

    interact();
    if (onTapMascot) onTapMascot();
  };

  const openCustomizer = () => {
    safeHaptics.impact(Haptics.ImpactFeedbackStyle.Light);
    router.push('/modal/mascot-customizer');
  };

  const getMoodAuraColor = (currentMood: MascotMood) => {
    switch (currentMood) {
      case 'HAPPY':
        return colors.brand.primary;
      case 'CAUTIOUS':
        return colors.brand.amber;
      case 'SAD':
        return colors.brand.crimson;
      default:
        return skinData.badgeAccent || colors.mascot.idle;
    }
  };

  // Safe 2D Reanimated Avatar Component
  const render2DAvatar = () => (
    <View style={styles.mascotHead}>
      {/* 2D Accessory indicator badge if active */}
      {activeAccessory !== 'none' && currentAccessory && (
        <View style={styles.accessoryTopBadge}>
          <Text style={styles.accessoryEmoji}>{currentAccessory.emoji}</Text>
        </View>
      )}

      {/* Fluffy Round Ears with dynamic skin coloring */}
      <View
        style={[
          styles.ear,
          styles.earLeft,
          { backgroundColor: skinData.earColor },
        ]}
      >
        <View
          style={[
            styles.innerEar,
            { backgroundColor: skinData.innerEarColor },
          ]}
        />
      </View>
      <View
        style={[
          styles.ear,
          styles.earRight,
          { backgroundColor: skinData.earColor },
        ]}
      >
        <View
          style={[
            styles.innerEar,
            { backgroundColor: skinData.innerEarColor },
          ]}
        />
      </View>

      {/* Face Mask & Cheeks */}
      <View
        style={[styles.faceCircle, { backgroundColor: skinData.coatColor }]}
      >
        {/* White Brow Markings */}
        <View style={styles.eyebrowRow}>
          <View style={styles.eyebrow} />
          <View style={styles.eyebrow} />
        </View>

        {/* Eyes Expression based on mood */}
        <View style={styles.eyeRow}>
          {mood === 'HAPPY' ? (
            <>
              <Text style={styles.eyeSmile}>^</Text>
              <Text style={styles.eyeSmile}>^</Text>
            </>
          ) : mood === 'CAUTIOUS' ? (
            <>
              <View style={styles.eyeDot} />
              <View
                style={[styles.eyeDot, { transform: [{ scaleY: 0.6 }] }]}
              />
            </>
          ) : mood === 'SAD' ? (
            <>
              <Text style={styles.eyeSad}>v</Text>
              <Text style={styles.eyeSad}>v</Text>
            </>
          ) : (
            <>
              <View style={styles.eyeDot} />
              <View style={styles.eyeDot} />
            </>
          )}
        </View>

        {/* Nose & Cute Mouth */}
        <View
          style={[styles.snout, { backgroundColor: skinData.snoutColor }]}
        >
          <View style={styles.noseDot} />
          {mood === 'HAPPY' ? (
            <View style={styles.mouthSmile} />
          ) : mood === 'SAD' ? (
            <View style={styles.mouthPout} />
          ) : (
            <View style={styles.mouthNeutral} />
          )}
        </View>

        {/* Cheeks blush */}
        <View style={styles.blushLeft} />
        <View style={styles.blushRight} />
      </View>
    </View>
  );

  return (
    <View
      style={styles.container}
      pointerEvents="box-none"
      onLayout={() => setIsMascotReady(true)}
    >
      {/* Dynamic Glassmorphism Speech Bubble */}
      {isSpeechVisible && (
        <Animated.View
          entering={FadeInUp.springify().damping(12)}
          exiting={FadeOutDown.duration(200)}
          style={styles.speechBubbleWrapper}
        >
          <View style={styles.speechBubble}>
            <View style={styles.speechHeader}>
              <TouchableOpacity
                style={styles.mascotBadge}
                onPress={openCustomizer}
                activeOpacity={0.7}
              >
                <Sparkles size={11} color={colors.brand.primaryDark} />
                <Text style={styles.mascotBadgeText}>Bao the Buddy</Text>
                <Palette size={10} color={colors.text.muted} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={dismissSpeech}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={styles.closeButton}
              >
                <X size={12} color={colors.text.muted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.speechContent}>{speechText}</Text>
          </View>
          {/* Speech bubble pointer notch */}
          <View style={styles.speechTail} />
        </Animated.View>
      )}

      {/* Mascot Avatar Stage */}
      <View style={styles.avatarWrapper}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={handleTap}
          style={styles.avatarTouchable}
        >
          <Animated.View
            style={[
              styles.avatarContainer,
              { borderColor: getMoodAuraColor(mood) },
              animatedAvatarStyle,
            ]}
          >
            {use3D ? (
              /* Render 3D Stylized PBR Mesh with strict ErrorBoundary and dynamic lazy load */
              <Mascot3DErrorBoundary
                fallback={render2DAvatar()}
                onError={() => {
                  console.warn(
                    '[MascotWidget] 3D canvas failed to initialize in environment. Falling back to 2D.'
                  );
                  setUse3D(false);
                }}
              >
                <React.Suspense fallback={render2DAvatar()}>
                  <LazyMascot3DCanvas
                    mood={mood}
                    skin={activeSkin}
                    accessory={activeAccessory}
                    size={58}
                    onError={() => setUse3D(false)}
                  />
                </React.Suspense>
              </Mascot3DErrorBoundary>
            ) : (
              /* Render 2D Expressive Mascot Character */
              render2DAvatar()
            )}

            {/* Mood status mini-chip badge (toggles 3D view) */}
            <TouchableOpacity
              style={[
                styles.statusChip,
                { backgroundColor: getMoodAuraColor(mood) },
              ]}
              onPress={() => {
                Haptics.selectionAsync();
                setUse3D((prev) => !prev);
              }}
            >
              {mood === 'SAD' ? (
                <AlertCircle size={9} color="#FFFFFF" />
              ) : (
                <Sparkles size={9} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>

        {/* Quick Wardrobe Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.wardrobeButton}
          onPress={openCustomizer}
        >
          <Palette size={11} color={colors.text.secondary} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 104 : 88,
    left: 16,
    zIndex: 20,
    alignItems: 'flex-start',
  },
  speechBubbleWrapper: {
    marginBottom: 8,
    maxWidth: 220,
  },
  speechBubble: {
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    ...shadows.card,
  },
  speechHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  mascotBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  mascotBadgeText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.brand.primaryDark,
    fontSize: 10,
  },
  closeButton: {
    padding: 2,
  },
  speechContent: {
    ...typography.bodyMedium,
    fontSize: 12,
    lineHeight: 16,
    color: colors.text.primary,
  },
  speechTail: {
    width: 10,
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    marginLeft: 26,
    marginTop: -2,
    transform: [{ rotate: '45deg' }],
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarTouchable: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarContainer: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#FFFFFF',
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.floating,
  },
  mascotHead: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  accessoryTopBadge: {
    position: 'absolute',
    top: -10,
    alignSelf: 'center',
    zIndex: 10,
  },
  accessoryEmoji: {
    fontSize: 14,
  },
  ear: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 9,
    top: -2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  earLeft: {
    left: 2,
    transform: [{ rotate: '-18deg' }],
  },
  earRight: {
    right: 2,
    transform: [{ rotate: '18deg' }],
  },
  innerEar: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
  },
  faceCircle: {
    width: 46,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  eyebrowRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 24,
    marginTop: 2,
  },
  eyebrow: {
    width: 6,
    height: 2.5,
    borderRadius: 1,
    backgroundColor: '#FFFFFF',
  },
  eyeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 22,
    marginTop: 2,
    alignItems: 'center',
  },
  eyeDot: {
    width: 4.5,
    height: 4.5,
    borderRadius: 2.25,
    backgroundColor: '#1E293B',
  },
  eyeSmile: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E293B',
    lineHeight: 12,
  },
  eyeSad: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1E293B',
    lineHeight: 10,
  },
  snout: {
    width: 18,
    height: 12,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  noseDot: {
    width: 4,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#1E293B',
  },
  mouthSmile: {
    width: 6,
    height: 3,
    borderBottomWidth: 1.5,
    borderColor: '#1E293B',
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
  },
  mouthPout: {
    width: 5,
    height: 2.5,
    borderTopWidth: 1.5,
    borderColor: '#1E293B',
    borderTopLeftRadius: 2.5,
    borderTopRightRadius: 2.5,
  },
  mouthNeutral: {
    width: 4,
    height: 1.5,
    backgroundColor: '#1E293B',
  },
  blushLeft: {
    position: 'absolute',
    left: 4,
    bottom: 12,
    width: 6,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
  },
  blushRight: {
    position: 'absolute',
    right: 4,
    bottom: 12,
    width: 6,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
  },
  statusChip: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wardrobeButton: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border.subtle,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.subtle,
    zIndex: 10,
  },
});

