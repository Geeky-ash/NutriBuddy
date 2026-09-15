# Engineering Rules & Guidelines (RULES.md) — NutriBuddy

**Version:** 1.0.0  
**Enforcement:** Mandatory across all contributors, automated tooling, and AI coding agents.  

---

## 1. Core Principles

1. **Craft Over Convenience:** Never ship hasty, half-finished UI or unformatted code. Every screen and micro-interaction must look and feel premium, intentional, and polished.
2. **Zero "AI Slop":** Avoid generic placeholders, bloated boilerplate, unstyled default text, or cliché futuristic neon aesthetics. The app must adhere strictly to the warm organic minimalist design language.
3. **No Unhandled Failures:** Mobile devices operate in hostile environments (intermittent network, low battery, bad camera focus). Every user action must have an explicit loading state, error state, and offline fallback.
4. **Never Crash on Bad Data:** Ingredients from OCR and external databases are notoriously messy. Code must safely handle missing fields, malformed numbers, and unexpected characters.

---

## 2. TypeScript & Code Quality Standards

### 2.1. Strict Type Safety
- `noImplicitAny: true` is strictly enforced. The use of `any` is prohibited. Use `unknown` with runtime type narrowing (e.g., Zod or type guards) when dealing with external payloads.
- All service functions, API clients, and custom hooks must declare explicit return types.
- Always use discriminating unions for complex states (e.g., `Idle | Scanning | Success | Error`):
  ```typescript
  // CORRECT:
  export type ScanState =
    | { status: 'idle' }
    | { status: 'scanning' }
    | { status: 'success'; data: ScannedProduct }
    | { status: 'error'; message: string; retryable: boolean };

  // PROHIBITED:
  export type ScanState = {
    loading: boolean;
    data?: any;
    error?: string;
  };
  ```

### 2.2. Naming & File Conventions
- **Components:** PascalCase (e.g., `HealthScoreGauge.tsx`, `MascotBubble.tsx`).
- **Hooks:** camelCase with `use` prefix (e.g., `useCameraScanner.ts`, `useMascotEmotion.ts`).
- **Stores & Services:** camelCase with clear suffixes (e.g., `scanStore.ts`, `nutritionService.ts`).
- **Constants & Themes:** PascalCase for object namespaces, SCREAMING_SNAKE_CASE for fixed primitives.
- **Directory Placement:** Keep components colocated by feature domain rather than piling everything into a flat global components folder.

---

## 3. React Native & Mobile Performance Rules

### 3.1. Re-render Optimization
- Never create inline functions or objects inside JSX props for list items or 3D canvas listeners.
- Use `React.memo` judiciously on heavy components (e.g., `MascotCanvas`, `NutritionalItemRow`).
- For Zustand stores, always use granular atomic selectors to prevent entire screens from re-rendering on unrelated state changes:
  ```typescript
  // CORRECT:
  const currentMood = useMascotStore((state) => state.currentMood);

  // PROHIBITED (causes re-render on any store mutation):
  const { currentMood } = useMascotStore();
  ```

### 3.2. Worklets & 60 FPS UI Thread Execution
- All micro-interactions, layout transitions, and gesture dragging must run on the UI thread via `react-native-reanimated` worklets.
- Never use JavaScript `setInterval` or `setTimeout` to drive continuous visual animations.
- Heavy computational tasks (OCR parsing, regex tokenization, score algorithms) must run asynchronously off the primary render pass.

### 3.3. 3D Engine & WebGL Memory Management
- **Leak Prevention:** Every Three.js mesh, geometry, material, and texture MUST be explicitly disposed of in the `useEffect` cleanup return when unmounting:
  ```typescript
  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
      texture.dispose();
    };
  }, []);
  ```
- Limit the 3D scene to a single render loop. Pause the render loop when the screen loses focus using React Navigation's `useIsFocused()`.

### 3.4. Safe Area & Multi-Screen Support
- Always wrap screen canvases in `SafeAreaProvider` and utilize `useSafeAreaInsets()` to dynamically compute top/bottom padding for dynamic notches and home indicators across iOS and Android.

---

## 4. Error Handling & Defensive Programming

1. **Network Requests:** All external API calls must be wrapped in timeout guards (maximum 5,000ms for metadata, 10,000ms for vision models) and supply local offline fallback responses.
2. **Camera Permissions:** Never assume camera access is granted. Provide a friendly, beautifully illustrated "Permission Request" empty state with a direct button linking to system settings if denied.
3. **Database Transactions:** Perform bulk SQLite writes inside single transactions to prevent UI stuttering and database locking.

---

## 5. Clean Code & AI Coding Guardrails

1. **Verified Dependencies Only:** Do not install unverified or incompatible third-party libraries. Stick to official Expo SDK modules and battle-tested React Native packages.
2. **No Truncation in Documentation:** Never output placeholder text like `"// ... rest of the code"` or truncated specifications in foundation docs.
3. **Continuous Documentation Updates:** Whenever an architectural decision or state model is modified, immediately update `ARCHITECTURE.md` and `DECISIONS.md`.
4. **Clean Commits:** Write clear, conventional commit messages: `feat(scanner): ...`, `fix(mascot): ...`, `refactor(nutrition): ...`.
