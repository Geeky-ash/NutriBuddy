import React, { useState } from 'react';
import {
  View,
  Image,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import Svg, {
  Defs,
  LinearGradient,
  Stop,
  Rect,
} from 'react-native-svg';
import { UtensilsCrossed, Sparkles } from 'lucide-react-native';

interface NutritionHeroBannerProps {
  style?: ViewStyle;
}

let bundledHeroImage: any = null;
try {
  bundledHeroImage = require('../../../assets/images/nutrition-hero.png');
} catch {
  bundledHeroImage = null;
}

/**
 * NutritionHeroBanner
 * Renders the clean bundled food illustration hero banner:
 * - Bundled high-res food asset: pasta, cucumber, tomato, peas, and falafel
 * - Sleek minimal gradient fallback (soft emerald/amber tones + centered food icon)
 * - Container styled with width: 100%, height: 140, borderTopLeftRadius: 24, borderTopRightRadius: 24
 */
export function NutritionHeroBanner({ style }: NutritionHeroBannerProps) {
  const [hasError, setHasError] = useState(false);

  // If asset is not available or encounters error, render sleek minimal gradient fallback
  if (!bundledHeroImage || hasError) {
    return (
      <View style={[styles.container, style]}>
        <Svg width="100%" height={140} style={styles.gradientSvg}>
          <Defs>
            <LinearGradient id="heroGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#ECFDF5" />
              <Stop offset="50%" stopColor="#F0FDF4" />
              <Stop offset="100%" stopColor="#FEF3C7" />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height={140} fill="url(#heroGradient)" />
        </Svg>
        <View style={styles.fallbackIconOverlay}>
          <View style={styles.iconCircle}>
            <UtensilsCrossed size={32} color="#059669" />
          </View>
          <View style={styles.sparkleBadge}>
            <Sparkles size={16} color="#D97706" />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <Image
        source={bundledHeroImage}
        style={styles.image}
        resizeMode="cover"
        onError={() => setHasError(true)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 140,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#ECEEF2',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 140,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  gradientSvg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  fallbackIconOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  sparkleBadge: {
    position: 'absolute',
    top: 36,
    right: '38%',
    backgroundColor: '#FFFBEB',
    padding: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
});
