# Design System & UI/UX Specifications (DESIGN.md) — NutriBuddy

**Version:** 1.0.0  
**Aesthetic Style:** Warm Organic Minimalism ("Apple Health meets Studio Ghibli")  
**Design Tokens Implementation:** Pure TypeScript Theme Tokens + React Native StyleSheet  

---

## 1. Design Philosophy

NutriBuddy avoids the sterile, clinical look of medical apps as well as the garish, cluttered, neon aesthetics typical of AI gimmicks. The visual language is centered on:
- **Calm Clarity:** White-dominant, breathable layouts with purposeful white space that lets nutritional data breathe.
- **Warm Tactility:** Soft rounded corners, subtle warm off-whites, and organic earth tones that make nutrition feel wholesome and approachable.
- **Playful Character:** A living 3D mascot that humanizes data and turns nutrition tracking from a chore into a comforting ritual.
- **Physical Feedback:** Micro-animations and synchronized tactile haptics that make scanning physical objects feel magical.

---

## 2. Color Palette & Theme Tokens

### 2.1. Core Palette
```typescript
export const Palette = {
  // Backgrounds & Base Surfaces
  surface: {
    base: '#FAFAF7',       // Warm milk white (main screen canvas)
    card: '#FFFFFF',       // Pure white elevated cards
    subtle: '#F4F4F0',     // Inset panels and secondary containers
    glass: 'rgba(255, 255, 255, 0.82)', // Frosted glass overlays
    darkBase: '#121312',   // Oled dark background
    darkCard: '#1C1D1B',   // Dark card surface
  },

  // Typography & Inks
  ink: {
    primary: '#1A1C1A',    // Deep slate charcoal (high contrast, softer than pure black)
    secondary: '#5E635E',  // Muted olive charcoal for subheadings
    tertiary: '#969C96',   // Inactive states, metadata, timestamp
    inverse: '#FFFFFF',    // White text on dark accents
  },

  // Brand & Accent Colors
  brand: {
    primary: '#2E7D5B',    // Forest Sage Green (vitality, freshness)
    primaryLight: '#EAF5EF',
    primaryDark: '#1E573F',
    accent: '#E67E43',     // Warm Terracotta Apricot (energy, mascot highlights)
    accentLight: '#FDF1EB',
  },

  // Health Score Tier Colors
  score: {
    excellent: { bg: '#EAF5EF', text: '#23734D', border: '#A8D9BE', label: 'Optimal' },     // 85-100
    good:      { bg: '#F1F7EB', text: '#557F26', border: '#CBE5AA', label: 'Good' },        // 70-84
    moderate:  { bg: '#FFF9E6', text: '#946C00', border: '#F2DF99', label: 'Moderate' },    // 50-69
    poor:      { bg: '#FDF1EB', text: '#BF4D24', border: '#F3BFA9', label: 'Poor' },        // 30-49
    critical:  { bg: '#FDECEB', text: '#BD271E', border: '#F4A9A4', label: 'Ultra-Processed / Toxic' }, // 0-29
  },

  // Allergen & Hazard Alerts
  hazard: {
    red: '#D93829',        // Immediate allergen warning
    redLight: '#FDF0EE',
    yellow: '#E69B00',     // Additive caution
    yellowLight: '#FFF8E8',
  }
} as const;
```

---

## 3. Typography System

The typography uses **Plus Jakarta Sans** (or system fallback **San Francisco / Roboto**) to deliver a crisp, humanist feel with high legibility on small mobile displays.

### 3.1. Type Scale Hierarchy
| Token Name | Size | Line Height | Weight | Letter Spacing | Purpose |
|---|---|---|---|---|---|
| `displayLarge` | 34px | 40px | Bold (700) | -0.6px | Hero statistics, celebration scores |
| `displayMedium` | 28px | 34px | SemiBold (600) | -0.4px | Primary screen titles |
| `headingLarge` | 22px | 28px | SemiBold (600) | -0.2px | Food item card headers |
| `headingMedium` | 18px | 24px | SemiBold (600) | 0.0px | Section headers, card titles |
| `bodyLarge` | 16px | 22px | Regular (400) | 0.1px | Main readable content, descriptions |
| `bodyMedium` | 14px | 20px | Regular (400) | 0.1px | Secondary metadata, ingredient lists |
| `labelBold` | 13px | 18px | SemiBold (600) | 0.2px | Button labels, badge tags |
| `caption` | 11px | 15px | Medium (500) | 0.3px | Timestamps, footnote warnings |
| `numberMetric` | 24px | 28px | Bold (700) | -0.2px | Calories, Protein, Carb counts (tabular numbers) |

---

## 4. Spacing, Radii & Elevation

### 4.1. Spacing Scale (8-Point Grid)
```typescript
export const Spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};
```

### 4.2. Border Radii
- `sm: 8px` (Tags, small ingredient badges)
- `md: 14px` (Secondary cards, buttons, text inputs)
- `lg: 20px` (Primary food cards, modal sheets)
- `xl: 28px` (Full floating action cards, score overview hero)
- `pill: 9999px` (Status badges, macro pill toggles)

### 4.3. Elevation & Shadows (Tailored Soft Umbra)
- **Soft Ambient Card Shadow:**
  - `shadowColor: '#1A1C1A'`
  - `shadowOffset: { width: 0, height: 4 }`
  - `shadowOpacity: 0.05`
  - `shadowRadius: 12`
  - `elevation: 2` (Android)
- **Floating Button / Modal Shadow:**
  - `shadowColor: '#1A1C1A'`
  - `shadowOffset: { width: 0, height: 10 }`
  - `shadowOpacity: 0.08`
  - `shadowRadius: 24`
  - `elevation: 6` (Android)

---

## 5. Component Specifications

### 5.1. NutriBuddy Health Score Gauge
- **Visual Form:** Circular segmented arc (240-degree sweep) or bold rounded rectangular pill with progress bar.
- **Center Element:** Large tabular numerical score (e.g., `88`) flanked by a grade pill (`Grade A`).
- **Animation:** Fluid spring animation on mount (interpolates from 0 to target score in 600ms via `react-native-reanimated`).

### 5.2. Viewfinder & Camera Reticle
- **Aesthetic:** Minimal white rounded-corner reticle frame (`rgba(255, 255, 255, 0.85)`).
- **Scanning Beam:** Subtle, glowing sage-tinted laser bar gently oscillating vertically across the bounding zone with a soft fade mask.
- **Multi-Object Bounding Tags:** Floating translucent tags anchored to recognized items (e.g., `Avocado Toast · 240 kcal`) with pulse micro-animations on lock-on.

### 5.3. Ingredient & Additive Pill Badges
- **Safe:** Light sage pill with checkmark icon (`#EAF5EF` / `#23734D`).
- **Moderate:** Warm buttercup pill (`#FFF9E6` / `#946C00`).
- **Harmful / Ultra-Processed:** Soft terracotta pill with warning dot (`#FDF1EB` / `#BF4D24`).
- **Allergen Alert:** Bold crimson badge with exclamation glyph (`#D93829` with `#FFFFFF` text).

### 5.4. Dynamic Mascot Speech Bubble
- Positioned above the 3D companion with a playful curved tail pointing toward the mascot.
- Smooth spring pop-in with staggered letter fade-in.
- Tapping the bubble expands into actionable advice cards.

---

## 6. 3D Interactive Mascot Design System

### 6.1. Visual Specification ("Bao the Panda")
- **Style:** Stylized, charming vinyl-toy / Studio Ghibli aesthetic.
- **Polygon Count:** Under 14,000 triangles optimized for mobile GPU rasterization.
- **Materials:** Non-photorealistic stylized PBR with soft velvet rim lighting, subtle subsurface scattering feel, and warm directional key light.
- **Rigging:** Skeletal rig with facial blend shapes for eyes (blink, squint, wide-eyed wonder), ears (perk, droop), mouth (smile, open cheerful, neutral, worried pout), and bouncy tail physics.

### 6.2. Interactive Gestures
- **Follow Touch:** Mascot head and eyes softly track the user's touch finger across the display (clamped to 35-degree yaw/pitch).
- **Tap Reaction:** Tap triggers an instant playful hop, gentle ear flutter, and haptic bump.
- **Drag Rotate:** User can spin Bao 360 degrees to inspect from all angles. On release, Bao smoothly springs back to front-facing orientation.

---

## 7. Haptic & Sound Engineering

### 7.1. Haptic Feedback Patterns (`expo-haptics`)
- **Scan Barcode Locked:** `Haptics.notificationAsync(NotificationFeedbackType.Success)`
- **Allergen Danger Detected:** `Haptics.notificationAsync(NotificationFeedbackType.Error)` + double heavy impact.
- **Ingredient Card Expansion:** `Haptics.impactAsync(ImpactFeedbackStyle.Light)`
- **Mascot Poke / Tap:** `Haptics.impactAsync(ImpactFeedbackStyle.Medium)`

### 7.2. Sound Design (`expo-av` or sound engine)
- Soft, organic foley and acoustic instruments (wooden marimba, warm harp, soft paper snap).
- Never loud, harsh, or synthetic 8-bit beeps.
- Global mute toggle easily accessible in user settings.
