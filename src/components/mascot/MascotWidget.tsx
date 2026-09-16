import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Platform,
  useWindowDimensions,
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
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { X, Sparkles, Palette } from 'lucide-react-native';
import { colors, radii, shadows, typography } from '../../theme';
import { useMascotStore } from '../../store/useMascotStore';
import {
  MascotMood,
  MASCOT_SKINS,
  MASCOT_ACCESSORIES,
} from '../../types/mascot';
import { Mascot2DAvatar } from './Mascot2DAvatar';
import safeHaptics from '../../utils/haptics';

const MASCOT_WIDTH = 80;
const MASCOT_HEIGHT = 100;
const PADDING_HORIZONTAL = 12;
const TOP_INSET = Platform.OS === 'ios' ? 60 : 48;
const BOTTOM_INSET = 74; // Safe margin above bottom tab bar navigation
const INITIAL_BOTTOM = 90;
const INITIAL_LEFT = 16;

interface MascotWidgetProps {
  onTapMascot?: () => void;
}

export const MascotWidget: React.FC<MascotWidgetProps> = ({ onTapMascot }) => {
  const router = useRouter();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const screenWidth = windowWidth || 360;
  const screenHeight = windowHeight || 780;

  const mood = useMascotStore((state) => state.mood);
  const activeSkin = useMascotStore((state) => state.activeSkin);
  const activeAccessory = useMascotStore((state) => state.activeAccessory);
  const speechText = useMascotStore((state) => state.speechText);
  const isSpeechVisible = useMascotStore((state) => state.isSpeechVisible);
  const dismissSpeech = useMascotStore((state) => state.dismissSpeech);
  const setSpeech = useMascotStore((state) => state.setSpeech);
  const interact = useMascotStore((state) => state.interact);

  const [use3D, setUse3D] = useState(false);
  const [isMascotReady, setIsMascotReady] = useState(false);

  // Clamping boundaries relative to INITIAL_LEFT and INITIAL_BOTTOM
  const minX = PADDING_HORIZONTAL - INITIAL_LEFT;
  const maxX = Math.max(minX, screenWidth - MASCOT_WIDTH - PADDING_HORIZONTAL - INITIAL_LEFT);
  const initialTop = screenHeight - INITIAL_BOTTOM - MASCOT_HEIGHT;
  const minY = TOP_INSET - initialTop;
  const maxY = Math.min(16, (screenHeight - BOTTOM_INSET - MASCOT_HEIGHT) - initialTop);

  // Drag coordinates shared values
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const isDragging = useSharedValue(false);

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

  const animatedShadowStyle = useAnimatedStyle(() => {
    const progress = Math.min(Math.abs(bounceY.value) / 6, 1);
    return {
      transform: [
        { scaleX: 1 - progress * 0.25 },
        { scaleY: 1 - progress * 0.15 },
      ],
      opacity: 0.25 - progress * 0.1,
    };
  });

  const animatedDragStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
      ],
    };
  });

  const animatedSpeechBubbleStyle = useAnimatedStyle(() => {
    const isNearRight = maxX > 0 && translateX.value > maxX * 0.5;
    return {
      transform: [
        {
          translateX: withTiming(isNearRight ? -120 : 0, { duration: 180 }),
        },
      ],
    };
  });

  const animatedTailStyle = useAnimatedStyle(() => {
    const isNearRight = maxX > 0 && translateX.value > maxX * 0.5;
    return {
      marginLeft: withTiming(isNearRight ? 146 : 26, { duration: 180 }),
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

  const triggerDropHaptic = () => {
    safeHaptics.impact(Haptics.ImpactFeedbackStyle.Light);
  };

  // Drag Gesture with clamping boundaries and spring physics
  const panGesture = Gesture.Pan()
    .minDistance(5)
    .onStart(() => {
      'worklet';
      isDragging.value = true;
      startX.value = translateX.value;
      startY.value = translateY.value;
    })
    .onUpdate((event) => {
      'worklet';
      const rawX = startX.value + event.translationX;
      const rawY = startY.value + event.translationY;
      // Clamp boundaries so Bao cannot be dragged off-screen or hidden behind bars
      translateX.value = Math.min(Math.max(rawX, minX), maxX);
      translateY.value = Math.min(Math.max(rawY, minY), maxY);
    })
    .onFinalize((event) => {
      'worklet';
      isDragging.value = false;

      // Current position from left of screen
      const currentLeft = INITIAL_LEFT + translateX.value;
      const edgeThreshold = Math.min(76, screenWidth * 0.22);

      let targetX = translateX.value;
      // Snap softly to nearest edge if dropped near margins or flicked with velocity
      if (currentLeft < edgeThreshold || event.velocityX < -400) {
        targetX = minX;
      } else if (currentLeft > screenWidth - MASCOT_WIDTH - edgeThreshold || event.velocityX > 400) {
        targetX = maxX;
      }

      const targetY = Math.min(Math.max(translateY.value, minY), maxY);

      const springConfig = {
        damping: 16,
        stiffness: 140,
        mass: 0.8,
      };

      translateX.value = withSpring(targetX, springConfig);
      translateY.value = withSpring(targetY, springConfig);
      runOnJS(triggerDropHaptic)();
    });

  const tapGesture = Gesture.Tap()
    .maxDuration(250)
    .onEnd(() => {
      'worklet';
      runOnJS(handleTap)();
    });

  const mascotGesture = Gesture.Exclusive(panGesture, tapGesture);

  const openCustomizer = () => {
    safeHaptics.impact(Haptics.ImpactFeedbackStyle.Light);
    router.push('/modal/mascot-customizer');
  };

  const handleToggleEngine = () => {
    safeHaptics.impact(Haptics.ImpactFeedbackStyle.Medium);
    const next3D = !use3D;
    setUse3D(next3D);
    setSpeech(
      next3D ? '3D Engine Enabled' : '2D Vector Mode Active',
      3500
    );
  };

  // Lightweight 2D Reanimated Full-Body Avatar Component (size: 54)
  const render2DAvatar = () => (
    <Mascot2DAvatar
      mood={mood}
      skin={activeSkin}
      accessory={activeAccessory}
      equippedSkin={activeSkin}
      equippedAccessory={activeAccessory}
      size={54}
    />
  );

  return (
    <View
      style={styles.container}
      pointerEvents="box-none"
      onLayout={() => setIsMascotReady(true)}
    >
      <Animated.View
        style={[styles.dragContainer, animatedDragStyle]}
        pointerEvents="box-none"
      >
        {/* Dynamic Glassmorphism Speech Bubble */}
        {isSpeechVisible && (
          <Animated.View
            key="mascot-speech-bubble-wrapper"
            entering={FadeInUp.springify().damping(12)}
            exiting={FadeOutDown.duration(200)}
            style={styles.speechBubbleWrapper}
            pointerEvents="box-none"
          >
            <Animated.View
              style={animatedSpeechBubbleStyle}
              pointerEvents="box-none"
            >
              <View style={styles.speechBubble} pointerEvents="auto">
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
              <Animated.View style={[styles.speechTail, animatedTailStyle]} />
            </Animated.View>
          </Animated.View>
        )}

        {/* Mascot Avatar Stage */}
        <View style={styles.avatarWrapper} pointerEvents="box-none">
          <GestureDetector gesture={mascotGesture}>
            <Animated.View style={styles.avatarTouchable}>
              {/* Dynamic Ground Shadow underneath Bao's feet */}
              <Animated.View
                key="mascot-ground-shadow"
                style={[styles.groundShadow, animatedShadowStyle]}
              />

              <Animated.View
                key="mascot-avatar-animated-frame"
                style={[
                  styles.avatarContainer,
                  animatedAvatarStyle,
                ]}
              >
                {render2DAvatar()}
              </Animated.View>
            </Animated.View>
          </GestureDetector>

          {/* Quick Wardrobe Button (🎨 Painter Palette Icon) */}
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.wardrobeButton}
            onPress={openCustomizer}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Palette size={12} color={colors.text.secondary} />
          </TouchableOpacity>

          {/* Dedicated 2D/3D Engine Toggle Button (✨ Green Sparkle Icon) */}
          <TouchableOpacity
            activeOpacity={0.8}
            style={[
              styles.engineToggleButton,
              { backgroundColor: use3D ? '#10B981' : '#64748B' },
            ]}
            onPress={handleToggleEngine}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Sparkles size={12} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 90,
    left: 16,
    width: 80,
    height: 100,
    zIndex: 20,
    alignItems: 'flex-start',
  },
  dragContainer: {
    width: 80,
    height: 100,
    position: 'relative',
  },
  speechBubbleWrapper: {
    position: 'absolute',
    bottom: 104,
    left: 0,
    width: 210,
    maxWidth: 220,
    zIndex: 30,
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
    width: 80,
    height: 100,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTouchable: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    width: 72,
    height: 90,
  },
  groundShadow: {
    position: 'absolute',
    bottom: 6,
    width: 38,
    height: 6,
    borderRadius: 19,
    backgroundColor: 'rgba(15, 23, 42, 0.22)',
    alignSelf: 'center',
    zIndex: 0,
  },
  avatarContainer: {
    width: 64,
    height: 74,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  wardrobeButton: {
    position: 'absolute',
    top: 2,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border.subtle,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.subtle,
    zIndex: 15,
  },
  engineToggleButton: {
    position: 'absolute',
    bottom: 6,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.subtle,
    zIndex: 15,
  },
});

