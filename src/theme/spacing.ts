import { ViewStyle, Platform } from 'react-native';

/**
 * NutriBuddy Theme — Spacing, Radii, and Shadows
 */

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radii = {
  xs: 6,
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 9999,
  full: 9999,
} as const;

export const shadows: Record<string, ViewStyle> = {
  subtle: Platform.select({
    ios: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.03,
      shadowRadius: 4,
    },
    android: {
      elevation: 1,
    },
    default: {},
  }) as ViewStyle,

  soft: Platform.select({
    ios: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 8,
    },
    android: {
      elevation: 2,
    },
    default: {},
  }) as ViewStyle,

  card: Platform.select({
    ios: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 14,
    },
    android: {
      elevation: 4,
    },
    default: {},
  }) as ViewStyle,

  floating: Platform.select({
    ios: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 24,
    },
    android: {
      elevation: 8,
    },
    default: {},
  }) as ViewStyle,
};
