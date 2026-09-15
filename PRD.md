# Product Requirements Document (PRD) — NutriBuddy

**Version:** 1.0.0  
**Status:** Approved for Foundation Engineering  
**Target Platforms:** iOS & Android (React Native / Expo)  
**Primary Language:** TypeScript  

---

## 1. Executive Summary & Vision

NutriBuddy is an intelligent, delightful mobile companion designed to simplify and humanize healthy eating. Unlike existing calorie counters and nutrition trackers that feel like sterile clinical databases or punitive spreadsheets, NutriBuddy transforms dietary mindfulness into an intuitive, visually stunning, and emotionally rewarding experience.

By combining on-device computer vision, high-precision OCR, barcode scanning, deep nutritional analysis, and a real-time responsive 3D mascot companion, NutriBuddy gives consumers immediate clarity about what is going into their bodies—without tedious manual logging or nutritional jargon.

### Core Value Proposition
1. **Instant Clarity on Packaged Goods:** Decode confusing ingredient labels, identify ultra-processed foods (UPFs), flag harmful additives/preservatives (e.g., Titanium Dioxide, BHA, High Fructose Corn Syrup), and cross-reference personal allergens in milliseconds.
2. **Effortless Live Food Recognition:** Point the camera at a freshly prepared plate to identify dishes, estimate volume/portion sizes, and calculate macronutrients (protein, carbs, fats) and key micronutrients without weighing scales.
3. **Emotional Connection via 3D Mascot:** A charming, physically rendered 3D companion (Bao the Panda / Pip the Capybara) reacts in real time to food choices with dynamic animations, facial expressions, and vocal soundbites—acting as a non-judgmental cheerleader for wholesome habits.
4. **Pure, High-Craft Aesthetics:** Minimalist, white-dominant aesthetic, warm typography, smooth 60fps micro-interactions, and tactile haptic feedback designed to evoke calm, clarity, and delight.

---

## 2. Target Audience & User Personas

### Persona A: "Mindful Maya" (28, Digital Product Designer)
- **Pain Point:** Wants to eat clean and avoid ultra-processed foods and hidden artificial sweeteners, but gets overwhelmed reading fine-print ingredient labels in grocery aisles.
- **Needs:** Rapid scanning, clear "Clean vs. Ultra-Processed" verdict, and an aesthetic app that feels enjoyable to open daily.
- **Mascot Dynamic:** Appreciates playful micro-interactions and witty, uplifting health insights.

### Persona B: "Allergy-Conscious Alex" (35, Father of Two)
- **Pain Point:** Child has a severe peanut and tree nut allergy, and Alex is intolerant to dairy and artificial food dyes (Red 40, Yellow 5).
- **Needs:** Zero-tolerance allergen alert system with prominent visual warnings when scanning packaged foods.
- **Mascot Dynamic:** Relies on the mascot's immediate "Alarmed" reaction as a fast visual confirmation.

### Persona C: "Active David" (24, Amateur Athlete & Meal Prepper)
- **Pain Point:** Cooks whole foods and meals at home; hates manual calorie-logging apps with dropdown search menus.
- **Needs:** Point-and-shoot camera estimation for prepared plates, accurate macro splits, and quick portion adjustments.
- **Mascot Dynamic:** Loves seeing the mascot celebrate post-workout high-protein meals.

---

## 3. Core Feature Specifications

### 3.1. Packaged Food Scanner
The Packaged Food Scanner operates in dual-mode (Barcode Engine + Optical Character Recognition / Ingredient Parser).

#### Functional Requirements:
1. **Barcode Identification:**
   - Real-time EAN-13, EAN-8, UPC-A, and UPC-E detection via camera stream at 30fps.
   - Primary database lookup via local offline cache, falling back to OpenFoodFacts and USDA FoodData Central APIs.
2. **Ingredient OCR & Text Parser:**
   - When barcodes are missing or foreign, user captures or aims at the ingredient text block.
   - On-device text extraction isolating `Ingredients: ...` text.
   - Natural language ingredient tokenizer segmenting individual items, percentages, and bracketed sub-ingredients (e.g., `Enriched Flour [Wheat Flour, Niacin, Reduced Iron]`).
3. **Additive & Toxicity Profiler:**
   - Cross-checks all detected ingredients against a database of 2,500+ food additives, E-numbers, and chemical agents.
   - Classifies each additive into risk tiers:
     - `Safe` (e.g., Ascorbic Acid / E300)
     - `Caution / Moderate` (e.g., Sodium Benzoate / E211, Carrageenan / E407)
     - `Avoid / High Risk` (e.g., Potassium Bromate / E924, Titanium Dioxide / E171, BHA / E320, Red 40 / E129).
   - Identifies hidden names for sugar (e.g., Maltodextrin, Dextrose, High Fructose Corn Syrup, Agave Nectar, Evaporated Cane Juice).
4. **Allergen Detection System:**
   - User profile stores active allergens (Peanuts, Tree Nuts, Milk/Dairy, Eggs, Wheat/Gluten, Soy, Fish, Shellfish, Sesame, Sulfites, Celery, Mustard).
   - Strict matching and fuzzy matching (95% Levenshtein threshold) with immediate red badge alerts.
5. **NutriBuddy Health Score (0–100):**
   - Synthesizes NOVA classification (1: Unprocessed, 2: Processed culinary ingredients, 3: Processed foods, 4: Ultra-processed food products).
   - Nutri-Score calculation (FSA/Ofcom nutrient profiling system adapted for whole food bonus).
   - Deductions for high sodium, saturated fat, simple sugars, and high-risk additives.

### 3.2. Live Food Vision Scanner
The Live Food Vision Scanner provides real-time and snapshot-based identification of plated and prepared meals.

#### Functional Requirements:
1. **Multi-Item Detection & Segmentation:**
   - Analyzes camera frame to detect multiple distinct food items on a single plate (e.g., Grilled Salmon + Steamed Broccoli + Brown Rice).
   - Draws clean, non-intrusive bounding boxes or soft contour highlights around detected items with label chips.
2. **Portion & Volume Estimation Heuristic:**
   - Leverages relative reference sizing (e.g., standard dinner plate diameter of 26cm, or user fist/thumb reference).
   - Categorizes portions into: Small (0.5 serving), Standard (1.0 serving), Generous (1.5 servings), Double (2.0 servings), with an intuitive slider for user override.
3. **Nutritional Breakdown:**
   - Calculates estimated Calories, Protein (g), Carbohydrates (g), Fats (g), and Fiber (g).
   - Highlights positive micronutrient density (e.g., "High in Vitamin C & Potassium", "Rich in Omega-3").
4. **Meal Healthiness Assessment:**
   - Categorizes meal into balance index: Glycemic Impact, Protein adequacy, Satiety score.
   - Provides 1-sentence actionable culinary tip (e.g., "Adding a splash of olive oil or avocado will boost absorption of the fat-soluble vitamins in your greens!").

### 3.3. 3D Interactive Mascot Companion
The mascot is an emotionally expressive 3D character rendered smoothly directly in the mobile UI.

#### Character Specification:
- **Default Character:** "Bao" the Red Panda (warm russet fur, expressive fluffy ears, soft tail) or "Pip" the Capybara (zen, calming, round silhouette).
- **Rendering Engine:** Expo GL / Three.js / React Three Fiber with lightweight PBR (Physically Based Rendering) shaders, warm studio directional lighting, and soft ambient occlusion.
- **Performance Budget:** Target 60 FPS on mid-tier mobile devices (iPhone 11+, Snapdragon 778G+); polygon count <= 15,000 tris; single 1024x1024 diffuse/roughness texture atlas.

#### Emotional State Machine:
| State | Trigger | Animation Behavior | Audio Cue |
|---|---|---|---|
| **Ecstatic** | Whole foods, nutrient-dense meal (Score 90-100) | Bounces joyfully, clapping paws, sparkling eye highlights | Playful chirp / soft cheerful harp |
| **Happy** | Balanced healthy meal/snack (Score 75-89) | Nods approvingly, friendly wave, gentle tail sway | Gentle affirmative chime |
| **Neutral / Curious** | Moderate food or scanning in progress (Score 50-74) | Tilts head, sniffs food curious, blinks calmly | Soft paper rustle / subtle hum |
| **Concerned** | High sugar, high sodium, or UPF (Score 30-49) | Scratches head thoughtfully, paws on tummy, subtle frown | Thoughtful soft "hmm" |
| **Alarmed / Protective** | Allergen detected or severe toxic additives (Score <30) | Waves paws in gentle warning, holds up shield badge | Urgent but warm wooden tap |
| **Sleepy / Idle** | App inactive for >30s on screen | Curls up, slow breathing cycle, subtle floating "Zzz" | Quiet ambient purr |

#### Interactive Touch Micro-interactions:
- Tapping the mascot triggers playful responses (giggles, gentle jump, tail wag).
- Dragging/swiping allows 360-degree rotation of the mascot.
- Mascot holds speech bubbles with dynamic tips rendered in crisp vector typography.

### 3.4. Clean, Refined UI/UX
- **Design Philosophy:** Warm, organic minimalism ("Apple Health meets Studio Ghibli").
- **Visual Foundation:** Off-white backgrounds (`#FAFAF8`), deep charcoal ink typography (`#1A1A1A`), sage herbal greens (`#2D7A58`), warm terracotta accents (`#E06D53`), and buttery soft cards (`#FFFFFF`).
- **Typography:** Modern humanist sans-serif (Inter / Plus Jakarta Sans) paired with refined numerical tabular fonts for nutrition metrics.
- **Haptics:** Haptic feedback on barcode locks, score changes, and mascot interactions.

---

## 4. Non-Functional Requirements

### 4.1. Performance & Latency
- **Barcode Detection:** < 200ms from camera frame acquisition.
- **OCR Text Analysis:** < 800ms on-device processing.
- **Cloud Vision / LLM Nutritional Inference:** < 2.0s over standard 4G/5G connection.
- **3D Mascot Frame Rate:** Solid 60 FPS during normal navigation; dynamic LOD (Level of Detail) throttling to 30 FPS during simultaneous camera background capture if thermal throttling is detected.
- **Cold App Launch:** < 1.8 seconds to interactive camera view.

### 4.2. Privacy & Data Ethics
- All camera stream frames are processed ephemerally in RAM; no raw meal photos are stored on remote servers without explicit user opt-in.
- Full offline capability for barcode lookup (top 20,000 common products pre-cached locally in SQLite) and additive E-number lookups.
- Zero ad tracking or behavioral data brokering.

### 4.3. Accessibility (a11y)
- Dynamic Type support across iOS and Android.
- High-contrast mode compatibility.
- Full VoiceOver and TalkBack support: every visual rating and mascot reaction includes semantic accessibility labels (e.g., *"Bao looks ecstatic: Health score 92 out of 100, excellent source of lean protein"*).

---

## 5. Success Metrics (KPIs)

1. **Daily Habit Engagement:** > 2.8 average scans per daily active user (DAU).
2. **Scan Latency:** Median time-to-verdict under 1.2 seconds across all scanner modes.
3. **Nutritional Accuracy:** > 93% accuracy on packaged additive extraction; > 88% accuracy on plate item identification.
4. **User Retention:** 30-day retention rate >= 38% (industry average for health apps: ~20%).
5. **App Store Rating:** Average >= 4.8 / 5.0 stars with explicit praise for mascot charm and UI clarity.

---

## 6. Release Roadmap & Milestones

- **Phase 1: Foundation & Architecture Setup** (Docs, directory structure, core theme tokens, SQLite setup, base navigation).
- **Phase 2: Packaged Food Scanner Engine** (Camera view, barcode detector, OCR pipeline, additive database, Nutri-Score calculation).
- **Phase 3: 3D Mascot Interactive Engine** (3D mesh loader, animation blending state machine, audio triggers, interactive physics gestures).
- **Phase 4: Live Food Vision Scanner** (AI vision model integration, multi-item bounding box overlay, portion estimation heuristic, macro calculator).
- **Phase 5: User Experience & Dashboard** (Daily nutrition timeline, allergen profile manager, meal logs, smooth transitions, haptics).
- **Phase 6: Polish, Performance & Production Readiness** (E2E testing, battery profiling, thermal optimization, accessibility audit, app store bundle configs).
