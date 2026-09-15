# Project Memory & Operational State (MEMORY.md) — NutriBuddy

**Last Updated:** 2026-09-15  
**Current Phase:** Phase 4 Complete — All Core Phases (1-4) Fully Implemented  
**Status:** Production-Ready Mobile Application Scaffold  

---

## 1. Project Identity & Objective

NutriBuddy is a modern, high-craft mobile app (iOS & Android) built on React Native (Expo SDK) that transforms food nutrition into a clear, beautiful, and emotionally engaging habit.

### Core Distinctions
- **Packaged Food Scanner:** Barcode + OCR for additive/preservative analysis and allergen screening.
- **Live Food Vision Scanner:** Multi-item plated meal detection, macro/micro nutrient calculation, and portion estimation.
- **3D Mascot Buddy ("Bao the Panda"):** Real-time interactive 3D companion rendered via Three.js / Expo GL responding with dynamic emotions to dietary quality.
- **Visual Design:** Warm organic minimalism ("Apple Health meets Studio Ghibli").

---

## 2. Technical Stack Snapshot

- **Framework:** React Native / Expo (SDK 51+)
- **Runtime:** Hermes Engine
- **Languages:** TypeScript (Strict, 5.4+)
- **3D Rendering:** `@react-three/fiber` + `three` + `expo-gl`
- **Animation & Physics:** `react-native-reanimated` (v3) + `react-native-gesture-handler`
- **State Management:** Zustand
- **Navigation:** Expo Router v3 (Tabs + Modal Stack)
- **Camera & Barcode:** `expo-camera`
- **Sensory:** `expo-haptics`, `expo-status-bar`
- **Icons:** `lucide-react-native`

---

## 3. Directory Layout Blueprint

```
NutriBuddy/
├── PRD.md
├── AGENTS.md
├── DESIGN.md
├── ARCHITECTURE.md
├── RULES.md
├── MEMORY.md
├── DECISIONS.md
├── TESTING.md
├── package.json
├── tsconfig.json
├── app.json
├── babel.config.js
├── src/
│   ├── app/                  # Expo Router navigation (tabs + modal)
│   │   ├── (tabs)/
│   │   │   ├── _layout.tsx   # Custom bottom tab bar with Lucide icons
│   │   │   ├── index.tsx     # Scanner Viewport & Mascot Stage
│   │   │   ├── history.tsx   # Nutrition diary, filter pills, daily summary
│   │   │   └── profile.tsx   # Allergen safety guard, goals, preferences
│   │   ├── modal/
│   │   │   └── scan-results.tsx # Bottom sheet with score gauge, macros, additives
│   │   └── _layout.tsx       # Root stack
│   ├── components/
│   │   ├── mascot/
│   │   │   └── MascotWidget.tsx # Floating 3D/2D mascot stage with speech bubble
│   │   ├── scanner/
│   │   │   └── CameraViewfinder.tsx # Camera preview, reticle, toggles, shutter
│   │   └── nutrition/
│   │       └── HealthScoreGauge.tsx # Segmented animated health index gauge
│   ├── store/
│   │   ├── useScanStore.ts   # Active scan state, OCR text, results
│   │   └── useMascotStore.ts # Bao mood state, speech text, reactivity
│   ├── theme/
│   │   ├── colors.ts         # Warm organic minimalist palette
│   │   ├── typography.ts     # Platform typography scale
│   │   ├── spacing.ts        # 8pt grid, radii, elevation shadows
│   │   └── index.ts          # Unified theme export
│   └── types/
│       ├── nutrition.ts      # HealthScore, NOVA, Additive, Macros
│       ├── scan.ts           # ScanType, ProcessingStatus
│       └── mascot.ts         # MascotMood, MascotState
└── tests/
    └── unit/
        └── stores.test.ts    # Zustand store tests
```

---

## 4. Known Gotchas & Critical Constraints

1. **3D Rendering in Expo Go vs. Dev Client:**
   - Complex GLTF models with high vertex counts can occasionally cause Hermes heap exhaustion in standard Expo Go. Always keep 3D mascot assets optimized under 14k triangles with compressed textures.
   - Use an Expo Development Build (`npx expo run:ios` / `npx expo run:android`) for full native performance and frame processor stability.
2. **Camera Sensor Performance:**
   - Running real-time barcode scanning simultaneously with continuous 60fps 3D rendering can induce thermal throttling on older devices.
   - **Mitigation:** Pause the 3D mascot render loop while the active camera stream is in high-intensity barcode searching mode.
3. **OCR String Noise:**
   - Ingredient text photographed at an angle frequently contains typos (e.g., `s0dium` instead of `sodium`). The regex tokenizer must employ fuzzy normalization.
4. **Allergen Sensitivity:**
   - Zero tolerance for allergen false negatives. In case of ambiguous OCR parsing, the system must err on the side of caution and highlight a potential allergen warning.

---

## 5. Active Session & Milestone Progress

- [x] Step 1: Workspace directory structure initialized.
- [x] Step 2: Foundation documentation generation:
  - [x] `PRD.md` (Product Requirements Document)
  - [x] `AGENTS.md` (Autonomous Agents Architecture & Orchestration)
  - [x] `DESIGN.md` (Design Tokens, Component Specs, 3D Mascot Design)
  - [x] `ARCHITECTURE.md` (System Architecture & Data Flows)
  - [x] `RULES.md` (Engineering Guidelines & Code Standards)
  - [x] `MEMORY.md` (Project Context & Operational Memory)
  - [x] `DECISIONS.md` (Architecture Decision Records)
  - [x] `TESTING.md` (Testing Strategy & Validation Specifications)
- [x] Step 3: Phase 1 Scaffolding & Foundation Setup
  - [x] Configured `package.json`, `tsconfig.json`, `app.json`, `babel.config.js`.
  - [x] Built Theme tokens (`colors.ts`, `typography.ts`, `spacing.ts`, `index.ts`).
  - [x] Built State Stores (`useScanStore.ts`, `useMascotStore.ts`).
  - [x] Built Expo Router Navigation (`_layout.tsx`, `(tabs)/_layout.tsx`, `index.tsx`, `history.tsx`, `profile.tsx`, `modal/scan-results.tsx`).
- [x] Step 4: Phase 2 Camera Viewfinder & Mascot Stage
  - [x] Built `CameraViewfinder.tsx` with edge-to-edge camera, reticle, scanline animation, segmented toggle ("Packaged Label" vs. "Live Food"), flash toggle, and haptic shutter.
  - [x] Built `MascotWidget.tsx` with floating bottom-left overlay, 3D canvas support, reactive 2D Reanimated avatar fallback, and dynamic glassmorphism speech bubble.
  - [x] Built `HealthScoreGauge.tsx` with animated spring meter and grade badge tiers.
  - [x] Added unit tests in `tests/unit/stores.test.ts`.
- [x] Step 5: Phase 3 AI Vision Engine & Multi-Agent Pipelines
  - [x] Built `aiClient.ts` with Google Gemini 1.5 Flash and OpenAI GPT-4o multimodal vision support and offline fallback.
  - [x] Built `ocrParser.ts` with 50+ additive & E-number database, hidden sugar detector, and allergen keyword matcher.
  - [x] Built `nutritionScorer.ts` with 100% deterministic 0-100 scoring math, NOVA 1-4 classification, and grade mapping.
  - [x] Built `packagedScanAgent.ts` with Zod validation, allergen cross-checks, and ScannedProduct construction.
  - [x] Built `liveFoodAgent.ts` with Zod validation, component segmentation, portion gram estimation, and actionable eating tips.
  - [x] Built `mascotAgent.ts` coordinating emotional reactivity, speech bubble dialogue, and haptics.
  - [x] Updated `CameraViewfinder.tsx` with agent execution, processing HUD, and modal transition.
  - [x] Updated `modal/scan-results.tsx` to render actionable tips, confidence tags, and additives.
  - [x] Created unit tests in `tests/unit/aiAgents.test.ts`.
- [x] Step 6: Phase 4 Persistent Storage, Allergen Engine, 3D Canvas, & Production Polish
  - [x] Built `useScanHistoryStore.ts` with persistent entry logging, search query filtering, and daily calorie/protein computation.
  - [x] Built `useProfileStore.ts` with dynamic allergen guard (10 allergens) and dietary modes (7 modes).
  - [x] Built `Mascot3DCanvas.tsx` using Three.js / R3F with studio lighting, procedural 3D model, and mood animations.
  - [x] Integrated `Mascot3DCanvas.tsx` into `MascotWidget.tsx` with toggle to 2D avatar fallback.
  - [x] Connected `modal/scan-results.tsx` "Log to Diary" action to save directly into `useScanHistoryStore`.
  - [x] Updated `(tabs)/history.tsx` with search bar, filter pills ("All", "Packaged", "Live Food", "Warnings"), delete action, and detail modal reopening.
  - [x] Updated `(tabs)/profile.tsx` with interactive toggles bound to `useProfileStore`.
  - [x] Created unit tests `tests/unit/storage.test.ts`.
  - [x] Created end-to-end integration tests `tests/integration/scanFlow.test.ts`.
- [x] Step 7: Phase 5 Environment Config, Mascot Wardrobe Customization Engine, & EAS Build Setup
  - [x] Configured `.env` and `.env.example` with API key templates and provider flags.
  - [x] Built `src/config/env.ts` with typesafe parsing and offline capability detection.
  - [x] Built Mascot Wardrobe Customization Engine:
    - 4 distinct coats (`classic_panda`, `golden_panda`, `snow_leopard`, `zen_capybara`) with tailored PBR hex values.
    - 5 accessories (`none`, `chef_hat`, `sprout_leaf`, `sweatband`, `monocle`).
    - Extended `useMascotStore.ts` with wardrobe state persistence.
    - Updated `Mascot3DCanvas.tsx` with procedural 3D accessories and dynamic PBR coat shaders.
    - Updated `MascotWidget.tsx` with wardrobe quick launcher and skin/accessory reactivity.
    - Created `src/app/modal/mascot-customizer.tsx` with live 3D/2D preview and tabbed wardrobe selector.
    - Registered modal route in `src/app/_layout.tsx`.
  - [x] Production EAS & Asset Scaffolding:
    - Created `eas.json` with development, preview, and production profiles.
    - Procedurally generated valid PNG assets in `src/assets/images/` (`icon.png`, `splash.png`, `adaptive-icon.png`).
  - [x] Created unit tests in `tests/unit/mascotCustomizer.test.ts`.

