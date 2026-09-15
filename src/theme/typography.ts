import { TextStyle, Platform } from 'react-native';

/**
 * NutriBuddy Theme — Typography System
 * Clean, humanist typography with high legibility on mobile viewports.
 */

const fontFamily = Platform.select({
  ios: 'System',
  android: 'Roboto',
  default: 'System',
});

export const typography: Record<string, TextStyle> = {
  displayLarge: {
    fontFamily,
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '700',
    letterSpacing: -0.6,
  },
  displayMedium: {
    fontFamily,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '600',
    letterSpacing: -0.4,
  },
  headingLarge: {
    fontFamily,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  headingMedium: {
    fontFamily,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600',
    letterSpacing: 0,
  },
  bodyLarge: {
    fontFamily,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '400',
    letterSpacing: 0.1,
  },
  bodyMedium: {
    fontFamily,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
    letterSpacing: 0.1,
  },
  labelBold: {
    fontFamily,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  caption: {
    fontFamily,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  numberMetric: {
    fontFamily,
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
};

export type TypographyToken = keyof typeof typography;
