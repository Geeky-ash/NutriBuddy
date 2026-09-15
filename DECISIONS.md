# Architecture Decision Records (DECISIONS.md) — NutriBuddy

**Status:** Active  
**Format:** ADR (Architecture Decision Record)  

---

## ADR-001: Mobile Framework Selection — React Native with Expo (Managed / Prebuild)

- **Status:** Accepted  
- **Date:** 2026-09-15  
- **Context:** NutriBuddy requires multi-platform deployment (iOS and Android) with high-speed camera frame analysis, WebGL 3D rendering, fluid 60 FPS animations, and rapid product iteration.
- **Decision:** Use **React Native with Expo SDK 51+** (leveraging Expo Prebuild / Config Plugins when native modifications are required).
- **Alternatives Considered:**
  - *Flutter:* Strong rendering engine, but lacks mature WebGL 3D mascot ecosystem comparable to `@react-three/fiber` / Three.js, and TypeScript/React talent alignment is lower.
  - *Pure Native (Swift + Kotlin):* Exceptional performance, but doubles engineering overhead and creates fragmented business logic for nutritional algorithms.
- **Consequences:**
  - *Positive:* Single TypeScript codebase for all business logic, instant OTA updates for nutritional databases via EAS Update, robust camera and sensor libraries.
  - *Tradeoff:* Native custom modules require Expo config plugins and local development builds rather than basic Expo Go.

---

## ADR-002: 3D Mascot Rendering Engine — React Three Fiber (`@react-three/fiber`) + Expo GL

- **Status:** Accepted  
- **Date:** 2026-09-15  
- **Context:** The interactive 3D companion mascot ("Bao the Panda") must react dynamically to scanned food, respond to touch gestures (rotation, head tracking), and maintain 60 FPS without high battery drain.
- **Decision:** Implement 3D rendering via **React Three Fiber (R3F) and Three.js running on an Expo GL canvas**.
- **Alternatives Considered:**
  - *Rive / Lottie 2D Animations:* Lightweight and smooth, but lacks true 3D spatial depth, dynamic 360-degree rotation, lighting reactivity, and organic physical interaction.
  - *Unity Embedded Framework:* Provides rich 3D tools, but increases app bundle size by 50MB+, introduces complex bridge serialization overhead, and causes high memory spikes.
- **Consequences:**
  - *Positive:* Declarative React component lifecycle, direct integration with device gestures, small bundle footprint (< 3MB additional overhead), full PBR material and skeletal animation support.
  - *Tradeoff:* Requires strict memory disposal discipline for geometries and textures upon unmount to prevent WebGL context leaks.

---

## ADR-003: Food Vision & AI Inference Strategy — Hybrid Local Preprocessing + Cloud VLM

- **Status:** Accepted  
- **Date:** 2026-09-15  
- **Context:** Plated food recognition requires high visual understanding (segmenting mixed dishes like curries, salads, and casseroles), while maintaining fast response times (< 2 seconds).
- **Decision:** Adopt a **hybrid pipeline**:
  1. Local image preprocessing, cropping, and client-side bounding estimation.
  2. Cloud inference via modern multi-modal Vision-Language Models (e.g., Gemini 2.5 Flash / Claude 3.5 Sonnet) with strict JSON schema enforcement.
  3. Barcode and packaging OCR run 100% locally on-device.
- **Alternatives Considered:**
  - *100% On-Device Edge ML (MobileNet/YOLOv8):* Fast and works offline, but struggles with the infinite variety of global cuisines, resulting in inaccurate macro estimates.
  - *Pure Cloud Everything:* Too slow and fails completely when scanning packaged foods in grocery stores with poor cellular reception.
- **Consequences:**
  - *Positive:* Outstanding meal accuracy for live plates; instant, offline-capable scanning for packaged barcode goods.
  - *Tradeoff:* Plated food recognition requires active internet connection.

---

## ADR-004: Health Scoring Engine — 100% Deterministic Mathematical Synthesis

- **Status:** Accepted  
- **Date:** 2026-09-15  
- **Context:** Health scores must be completely trustworthy, reproducible, and explainable to users. If two users scan the same item, they must receive the identical score.
- **Decision:** Build the **NutriBuddy Health Index as a pure, deterministic mathematical algorithm** coded in TypeScript, synthesizing:
  1. Adapted Nutri-Score (FSA nutrient profiling for sodium, saturated fat, sugar vs. protein, fiber, whole food content).
  2. NOVA Classification (Penalizing ultra-processed foods, emulsifiers, artificial flavors).
  3. Toxic Additive Penalty (Deductions based on scientific consensus from EFSA and CSPI).
- **Alternatives Considered:**
  - *LLM-Generated Health Scores:* Highly subjective, non-deterministic (different scores on subsequent scans), hallucination-prone, and slow.
- **Consequences:**
  - *Positive:* 100% auditability, instantaneous calculation (< 5ms), zero hallucination risk, operates completely offline.
  - *Tradeoff:* Requires comprehensive, maintained local databases of additives and baseline nutritional benchmarks.

---

## ADR-005: State Management — Zustand + TanStack Query

- **Status:** Accepted  
- **Date:** 2026-09-15  
- **Context:** NutriBuddy manages local UI state (mascot emotion, camera controls, gesture states) and asynchronous server/database state (food lookups, scan history, user profile).
- **Decision:** Combine **Zustand** for client-side synchronous state and **TanStack Query (React Query v5)** for server state and caching.
- **Alternatives Considered:**
  - *Redux Toolkit:* Overly verbose with boilerplate actions and reducers for mobile client applications.
  - *React Context API:* Poor rendering performance for high-frequency updates (e.g., mascot animation tickers, camera frame states).
- **Consequences:**
  - *Positive:* Minimal boilerplate, granular re-rendering via selector hooks, built-in caching, automatic request deduplication, and persistence middleware support.
  - *Tradeoff:* Team must respect the boundary between server state (React Query) and client state (Zustand).

---

## ADR-006: Local Storage & Offline-First Strategy — SQLite (`expo-sqlite`)

- **Status:** Accepted  
- **Date:** 2026-09-15  
- **Context:** Users frequently scan foods in grocery stores, basements, or transit hubs with zero cellular connectivity.
- **Decision:** Bundle a lightweight, pre-indexed SQLite database (`nutribuddy.db`) containing **2,500+ food additives with risk tiers** and pre-cached common food items, alongside user scan histories.
- **Alternatives Considered:**
  - *AsyncStorage:* Key-value only; cannot efficiently perform indexed SQL queries or fuzzy text matching on additive names.
  - *WatermelonDB / Realm:* Powerful, but introduces heavy native binary dependencies and complex schema decorators.
- **Consequences:**
  - *Positive:* Millisecond-fast local SQL lookups, zero network dependency for packaged ingredient analysis, robust schema migrations.
  - *Tradeoff:* Initial app bundle includes ~4MB static SQLite seed file.

---

## ADR-007: Mascot Persona & Tone — Empathetic Cheerleader

- **Status:** Accepted  
- **Date:** 2026-09-15  
- **Context:** Many nutrition apps inadvertently foster orthorexia, guilt, or anxiety through alarming red screens, punitive scoreboards, and aggressive diet culture tropes.
- **Decision:** Position the mascot ("Bao") as an **empathic, curious cheerleader**. Even when detecting ultra-processed or high-sugar foods, the mascot expresses gentle concern or offers curious substitutions, never shame. Only acute allergen hazards trigger urgent warnings.
- **Consequences:**
  - *Positive:* High user retention, positive mental health alignment, approachable for all family demographics.
  - *Tradeoff:* May feel slightly softer to users seeking strict, uncompromising bodybuilding macro tracking.
