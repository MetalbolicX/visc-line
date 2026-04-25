# visc-line Code Review & Production Fixes Session Learnings

**Session Date:** 2026-04-25
**Topic:** visc-line library code review and production-readiness fixes
**Files Modified:** `src/services/scales.mts`, `src/interactivity/tooltip.mts`, `src/components/chart.mts`, `src/services/dataWrangling.mts`, `src/interactivity/zoomPan.mts`, `src/utils/cssVariables.mts`, `src/utils/mergeTheme.mts`, `src/themes/defaultTheme.mts`, `examples/main.mts`

---

## Non-Obvious Discoveries

### 1. Duplicate TypeScript Interface Shadowing Compiles Silently
**File:** `src/services/scales.mts:31-45`

The `ChartScales` interface was declared twice — lines 31-34 and lines 42-45. TypeScript permits this via declaration shadowing; no error is raised. The second declaration simply overrides the first. This would only surface as a bug if the two declarations diverged in content. No TypeScript error indicates this problem because it's valid TypeScript shadowing behavior.

### 2. D3 Log/Pow Scale Throws on Non-Positive Domains at Domain-Set Time, Not Construction Time
**File:** `src/services/scales.mts`

`scaleLog()` and `scalePow()` do not throw when created — they throw when `.domain([nonPositiveValues])` is called. The `.nice()` call does NOT protect against invalid domains; it only adjusts the scale's raw numerical range after the domain is already set. The fix requires pre-validation before passing the domain to the scale factory.

### 3. Zoom Reset Requires `zoomIdentity` from D3, Not `zoom().transform`
**File:** `src/interactivity/zoomPan.mts`

The original code used `zoom<SVGSVGElement, unknown>().transform` to get an identity transform for the reset function. This works but is wasteful (creates a throwaway zoom instance). The correct D3 idiom is `zoomIdentity` which is the pre-built identity transform constant. Both work, but `zoomIdentity` is the intended pattern.

### 4. `extentCache` Key Collision When Data Length Matches But Content Differs
**File:** `src/services/dataWrangling.mts:106-111`

The cache key is constructed from `label:data.length` (e.g., `"seriesA:3"`). If `update()` is called with 3 data points that have different values than the original 3, the cache returns the old extent `[oldMin, oldMax]` without recomputation. This is a silent correctness bug — the chart renders with wrong axis extents. The fix is `clearExtentCache()` before reprocessing on `update()`.

### 5. `Number()` Coerces Dates to Timestamps, Causing Silent Date Filtering Issues
**File:** `src/services/dataWrangling.mts:13-20`

The original `isValidNumber()` used `Number.isNaN(Number(v))` which converts `Date` objects to Unix timestamps via `Number(date)`. While this means dates pass the number check, it means invalid dates like `new Date("invalid")` return `NaN` correctly, but the intent of "Date validation" was not clearly handled. The fix explicitly checks `instanceof Date` with `!Number.isNaN(v.getTime())` to properly validate Date objects.

### 6. Tooltip Memory Leak via `WeakMap` False Sense of Safety
**File:** `src/interactivity/tooltip.mts:19`

`tooltipRegistry` is a `WeakMap<SVGGElement, TooltipEntry>`, which cleans up when the key (SVGGElement) is garbage collected. However, the `TipVizTooltip` custom element stored in `entry.tooltip` is appended to `document.body` — a strong reference that prevents GC of the tooltip element even after the chart's bounds group is gone. The bounds element can be GC'd, triggering WeakMap cleanup, but the tooltip element persists in the DOM indefinitely.

### 7. Empty JSDoc Block Artifacts: `export /** * * */ const` Pattern
**Files:** `src/utils/cssVariables.mts`, `src/utils/mergeTheme.mts`, `src/themes/defaultTheme.mts`, `src/interactivity/zoomPan.mts`

Throughout the codebase, `export /** * * */ const name = ...` appears. This is a malformed JSDoc block that only contains `*` and `*` on inner lines — essentially an empty comment block with extra asterisks. ESLint does not flag this as an error. The correct patterns are either a proper JSDoc block or no block at all. These artifacts likely came from an IDE auto-formatting issue or a bad find-replace.
