# visc-line TDD Test Coverage Session Learnings

**Session Date:** 2026-04-25
**Topic:** Adding tests for 7 previously uncovered modules via TDD vertical slices
**Files Created:** 7 new test files

---

## Non-Obvious Discoveries

### 1. D3 Selection Datum Type Mismatch with SVGSelection
**File:** `src/interactivity/__tests__/zoomPan.test.mts`

`select(svgEl as SVGSVGElement)` returns `Selection<SVGSVGElement, unknown, null, undefined>`. `addZoomPan` expects `SVGSelection` which is `Selection<SVGSVGElement, null, Element | null, unknown>`. The datum generic (`unknown` vs `null`) is incompatible. Fix: cast via `as unknown as SVGSelection`.

```ts
// Fails: Type 'Selection<SVGSVGElement, unknown, ...>' not assignable to 'SVGSelection'
return select(svgEl as SVGSVGElement);
// Works:
return select(svgEl as SVGSVGElement) as unknown as SVGSelection;
```

### 2. jsdom `querySelectorAll` Does Not Match `tag#id` Compound Selectors
**File:** `src/components/__tests__/contentGroup.test.mts`

jsdom's `querySelectorAll` with `"clipPath#chart-content-clip"` returns 0 nodes even when the element exists. `querySelector` works fine. D3's `.selectAll()` internally uses `querySelectorAll`, so `svg.selectAll("clipPath#chart-content-clip").size()` is always 0 in jsdom. Use `.select()` for single-element checks or `.selectAll().size()` with a simpler selector.

### 3. Vitest Fake Timers Must Be Explicitly Restored in `afterEach`
**File:** `src/accessibility/__tests__/responsiveness.test.mts`

`vi.useFakeTimers()` in `beforeEach` without a matching `vi.useRealTimers()` in `afterEach` causes subsequent tests to run with fake timers still active, producing hard-to-diagnose time-related test failures. Always pair them.

### 4. `ResizeObserver` Spy Works Directly on Prototype, No `global` Prefix Needed
**File:** `src/accessibility/__tests__/responsiveness.test.mts`

`vi.spyOn(ResizeObserver.prototype, "disconnect")` works in jsdom without `global.ResizeObserver` or `globalThis.ResizeObserver`. The jsdom environment exposes `ResizeObserver` as a global constructor with the standard prototype chain.

### 5. jsdom `clientWidth`/`clientHeight` Are Undefined on Default DOM Elements
**File:** `src/components/__tests__/SVG.test.mts`

`document.createElement("div")` produces elements where `clientWidth` and `clientHeight` are `undefined` (not 0) in jsdom. `renderSVG` reads these properties directly — tests must mock them via `Object.defineProperty`:

```ts
Object.defineProperty(el, "clientWidth", { value: 800, writable: true });
Object.defineProperty(el, "clientHeight", { value: 400, writable: true });
```

### 6. ESLint 10 Flat Config `languageOptions.functional` Is a Configuration Error
**File:** `eslint.config.mjs:47-50`

The `languageOptions` object in the flat config accepts only certain keys (`parser`, `parserOptions`, `ecmaVersion`, `sourceType`, `globals`). Placing the `eslint-plugin-functional` imported object (`functional`) in `languageOptions` causes ESLint to throw `TypeError: Key "languageOptions": Unexpected key "functional" found`. The plugin should be registered as a plugin, not placed in `languageOptions`. This pre-existed and causes all `pnpm lint` invocations to fail on this project.

---

## Debugging Breakthroughs

### Zoom Event Dispatch Fails with Manual `MouseEvent` — Use D3's `scaleBy` Instead
**File:** `src/interactivity/__tests__/zoomPan.test.mts`

Dispatching a manual `MouseEvent("zoom", ...)` with a mock `transform` object does not trigger D3's zoom handler because D3's zoom behavior registers its own internal event listeners using `selection.on()` which listens to D3's event system, not the native DOM event bus. Instead, use `zoomBehavior.scaleBy(selection, 2)` which programmatically triggers the zoom handler with the proper D3 event object.

### Debounce Cleanup Test: Do Not Advance Timers Before `cleanup()` for Cancel Check
**File:** `src/accessibility/__tests__/responsiveness.test.mts`

When testing that `cleanup()` cancels a pending animation frame, do NOT call `vi.advanceTimersByTime(16)` before `cleanup()`. Advancing time fires the rAF callback, setting `frameId = null`. Then `cleanup()` calls `cancelAnimationFrame(null)` which is a no-op — the spy sees 0 calls. Call `cleanup()` immediately after the resize callback fires to test cancellation of the pending (un-advanced) frame.

---

## Architectural Constraints Established

### All Component Tests Follow the Same DOM Fixture Pattern
All 7 test files use the same 3-pattern structure: `createMockSVG`/`createMockContainer` → `afterEach(() => { document.body.innerHTML = "" })` → render call → D3 selection query. This is now the canonical pattern for this codebase.

### Idempotency Is Tested by Calling Render Twice and Checking Element Count Remains 1
Every renderer test includes an idempotency test: render once, render again, `selectAll("selector").size()` should be 1 (not 2).