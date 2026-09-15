/**
 * NutriBuddy Theme — Color Palette
 * Warm Organic Minimalism ("Apple Health meets Studio Ghibli")
 */

export const colors = {
  // Core Brand & Accent
  brand: {
    primary: '#10B981',        // Emerald Green (freshness, vitality)
    primaryLight: '#ECFDF5',
    primaryDark: '#047857',
    amber: '#F59E0B',          // Warm Amber (caution, energy)
    amberLight: '#FFFBEB',
    crimson: '#F43F5E',        // Coral Crimson (hazard, alert)
    crimsonLight: '#FFF1F2',
  },

  // Surfaces & Backgrounds
  surface: {
    background: '#F8FAFC',     // Base canvas off-white
    card: '#FFFFFF',           // Pure white elevated cards
    subtle: '#F1F5F9',         // Inset panels and chips
    border: '#E2E8F0',         // Delicate hairline borders
    borderFocus: '#CBD5E1',
    overlay: 'rgba(15, 23, 42, 0.45)', // Backdrop dimming
    glass: 'rgba(255, 255, 255, 0.88)', // Frosted glass sheets
    glassDark: 'rgba(15, 23, 42, 0.75)',
  },

  // Hairline & Structural Borders
  border: {
    subtle: '#E2E8F0',
    focus: '#CBD5E1',
    divider: '#F1F5F9',
  },

  // Typography & Inks
  text: {
    primary: '#0F172A',        // Slate 900 text (deep, readable)
    secondary: '#475569',      // Slate 600 secondary text
    muted: '#94A3B8',          // Slate 400 caption / placeholder
    inverse: '#FFFFFF',        // Pure white on dark surfaces
    emerald: '#10B981',
    amber: '#D97706',
    crimson: '#E11D48',
  },

  // Health Score Tiers
  score: {
    excellent: {
      bg: '#ECFDF5',
      text: '#047857',
      border: '#A7F3D0',
      badge: '#10B981',
      label: 'Optimal',
    },
    good: {
      bg: '#F0FDF4',
      text: '#15803D',
      border: '#BBF7D0',
      badge: '#22C55E',
      label: 'Good',
    },
    moderate: {
      bg: '#FFFBEB',
      text: '#B45309',
      border: '#FDE68A',
      badge: '#F59E0B',
      label: 'Moderate',
    },
    poor: {
      bg: '#FFF7ED',
      text: '#C2410C',
      border: '#FED7AA',
      badge: '#F97316',
      label: 'Poor',
    },
    critical: {
      bg: '#FFF1F2',
      text: '#BE123C',
      border: '#FECDD3',
      badge: '#F43F5E',
      label: 'Ultra-Processed / Toxic',
    },
  },

  // Mascot Emotion Tones
  mascot: {
    happy: '#10B981',
    cautious: '#F59E0B',
    sad: '#F43F5E',
    idle: '#64748B',
    speechBubbleBg: 'rgba(255, 255, 255, 0.94)',
    speechBubbleBorder: '#E2E8F0',
  },
} as const;

export type ColorTheme = typeof colors;
