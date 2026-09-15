# Testing Strategy & Quality Assurance (TESTING.md) — NutriBuddy

**Version:** 1.0.0  
**Test Runners:** Jest, React Native Testing Library (RNTL), Maestro (E2E)  
**Target Coverage:** Minimum 85% on domain logic and scoring algorithms  

---

## 1. Testing Philosophy & Verification Pyramid

NutriBuddy's reliability directly impacts user dietary health, safety (allergens), and mobile delight (60 FPS 3D rendering). Testing is structured into three rigorous tiers:

```
        / \
       /   \        E2E Tests (Maestro)
      / E2E \       - Critical user journeys: Scan -> Score -> Mascot Reaction -> Log
     /-------\
    /         \     Integration Tests (Jest + RNTL)
   / Integrat. \    - Store mutations, SQLite transactions, API client retries
  /-------------\
 /               \  Unit Tests (Jest + TypeScript)
/   Unit Tests    \ - Deterministic scoring math, regex tokenizers, allergen matching
-------------------
```

---

## 2. Unit Testing Specifications

### 2.1. Health Scoring Engine (`tests/unit/scoring.test.ts`)
The scoring engine is completely deterministic and must be validated against known nutritional ground truths:
- **Test Case 1: Whole Food Archetype (e.g., Organic Spinach / Wild Salmon):**
  - Expected: Health Score >= 92, Grade 'A', NOVA Group 1, Additive Deductions = 0.
- **Test Case 2: Ultra-Processed Archetype (e.g., Diet Soda / Sugary Cereal):**
  - Expected: Health Score <= 35, Grade 'D' or 'F', NOVA Group 4, Multiple flagged additives (e.g., Aspartame, BHT).
- **Test Case 3: Boundary & Missing Data:**
  - Verify graceful handling when sodium or fiber is undefined or zero.
  - Verify that total calories cannot be negative.
  - Verify score clamping strictly between 0 and 100.

### 2.2. Ingredient Tokenizer & Allergen Matcher (`tests/unit/ingredients.test.ts`)
- **Nested Parentheses Parsing:**
  - Input: `"Enriched Flour (Wheat Flour, Niacin, Iron), Water, Palm Oil, Salt."`
  - Expected: Segments into individual items, identifies `"Wheat Flour"` as Wheat allergen.
- **Fuzzy Allergen Matching:**
  - Input: `"Contains traces of arachis hypogaea"` or slightly corrupted OCR `"peannut oil"`.
  - Expected: Flagged under `Peanut` allergy with high alert.
- **E-Number Sanitization:**
  - Input: `"Colour (E 129), Preservative (211)"`
  - Expected: Correctly maps to `Red 40 (E129)` and `Sodium Benzoate (E211)`.

### 2.3. Mascot Emotion State Machine (`tests/unit/mascotState.test.ts`)
- **Score 95:** Mood transitions to `'ecstatic'`, sets animation `'bounce_cheer'`.
- **Score 75:** Mood transitions to `'happy'`, sets animation `'nod_approve'`.
- **Score 55:** Mood transitions to `'neutral'`, sets animation `'head_tilt'`.
- **Score 35:** Mood transitions to `'concerned'`, sets animation `'scratch_head'`.
- **Allergen Trigger:** Regardless of high nutritional score (e.g., score 90 organic peanut bar), if user has peanut allergy, mood must immediately override to `'alarmed'` with warning sound cue.
- **Idle Timeout:** Inactivity > 30 seconds transitions mood to `'sleepy'`.

---

## 3. Integration Testing Specifications

### 3.1. Local Database & Cache (`tests/integration/sqlite.test.ts`)
- Test initializing SQLite schema on clean boot.
- Test querying additives table for 2,500+ items with fuzzy query latency < 15ms.
- Test LRU eviction when cache exceeds configured storage threshold.
- Test transaction rollbacks on corrupted batch inserts.

### 3.2. Zustand Store Integration (`tests/integration/stores.test.ts`)
- Test `useScanStore` flow: dispatching scan event -> updating current product -> recording entry in history -> updating daily macro totals.
- Verify persistence hydration from storage without race conditions.

---

## 4. End-to-End (E2E) Testing with Maestro

E2E flows are written in YAML using **Maestro** for fast, reliable, flakiness-free mobile test execution on real iOS Simulators and Android Emulators.

### Sample Maestro Flow: `tests/e2e/scan_packaged_food.yaml`
```yaml
appId: com.nutribuddy.app
---
- launchApp:
    clearState: true

# 1. Onboarding & Allergen Configuration
- assertVisible: "Welcome to NutriBuddy"
- tapOn: "Get Started"
- tapOn: "Peanuts" # Select peanut allergy
- tapOn: "Continue"

# 2. Scanner Navigation
- assertVisible: "Point at barcode or ingredients"
- tapOn: "Simulate Scan (Greek Yogurt)" # Mock trigger in test build

# 3. Validation of Results
- assertVisible: "Grade A"
- assertVisible: "Health Score"
- assertVisible: "Bao is celebrating!"

# 4. Save to Daily Log
- tapOn: "Log Meal"
- assertVisible: "Saved to your daily nutrition"
```

---

## 5. Performance & WebGL Profiling Benchmarks

| Metric | Target Threshold | Critical Alert Level | Measurement Method |
|---|---|---|---|
| **Mascot Render FPS** | 60 FPS | < 45 FPS | React Native Perf Monitor / Flipper FPS |
| **Active Memory (RAM)** | < 160 MB | > 280 MB | Xcode Instruments / Android Studio Profiler |
| **Barcode Detection Time** | < 200 ms | > 600 ms | Benchmark timestamp delta |
| **Score Algorithm Exec** | < 5 ms | > 20 ms | Node.js `process.hrtime` / `performance.now()` |
| **App Cold Startup** | < 1.8 s | > 3.0 s | Android ADB startup metric / iOS Instruments |

### WebGL Memory Leak Prevention Test:
A test script mounts and unmounts the 3D Mascot Canvas 50 times in succession. The test asserts that active WebGL buffers, textures, and memory allocations return to baseline zero without memory retention.

---

## 6. Mock Data Fixtures

Standard mock payloads are preserved in `tests/fixtures/`:
1. `mockGreekYogurt.json`: Clean whole food (Grade A, Score 94, NOVA 1, 0 additives).
2. `mockSugaryDrink.json`: Ultra-processed food (Grade F, Score 18, NOVA 4, High Fructose Corn Syrup, Caramel Color E150d).
3. `mockAllergenSnack.json`: Mixed nut energy bar containing peanuts and tree nuts.
4. `mockPlatedMealVision.json`: Grilled salmon, quinoa, roasted asparagus, lemon wedge with calculated macro splits and bounding boxes.

---

## 7. Quality Assurance Checklist Prior to Release

- [ ] All unit tests pass with >= 85% coverage.
- [ ] No TypeScript errors or warnings (`npx tsc --noEmit`).
- [ ] Linting and formatting rules clean (`npm run lint`).
- [ ] Maestro E2E test suite green on both iOS Simulator and Android Emulator.
- [ ] Accessibility: VoiceOver / TalkBack reads all nutrition score cards and mascot announcements properly.
- [ ] Low Power Mode tested: Framerate throttles safely without UI freeze.
- [ ] Offline Mode verified: Airplane mode scanning functions seamlessly with local database.
