# Plan 009: Consolidate duplicated axis/grid/label renderers and centralize CSS-var number reading

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 5860f3e..HEAD -- src/components/ src/utils/cssVariables.mts src/themes/index.mts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: LOW (behavior-preserving refactor; existing per-component tests are the net)
- **Depends on**: plans/002-characterization-suite.md
- **Category**: tech-debt
- **Planned at**: commit `5860f3e`, 2026-09-01

## Why this matters

Three duplication clusters make every visual tweak a multi-file lockstep
edit, and CSS-var reading is done 3 different ways across 7 call sites.
The worst inconsistency is real: `parseFloat(v) || 6` silently maps a
legitimate `"0"` var value to `6` (verified: no default is `0` TODAY, but
any user theme with `--vl-point-radius: 0` breaks). Additionally every
render re-runs `getComputedStyle` although the vars are written once at
chart creation — that cost repeats per zoom tick.

## Current state

- `src/components/xAxis.mts:33-61` vs `src/components/yAxis.mts:34-60` — ~95% identical (same getComputedStyle reads, same `|| 6`/`|| 8` fallbacks, same `.data([null]).join("g")` idempotency, same tickFormat branch). Differences: `axisBottom` vs `axisLeft`, `g.x-axis` vs `g.y-axis` class, x adds `transform="translate(0,${innerHeight})"`.
- `src/components/grid.mts:29-57` vs `:78-106` — `renderXGrid`/`renderYGrid` share structure; 6 verbatim `var(--vl-grid-*, fallback)` attribute lines each; differ in which scale drives ticks vs endpoints.
- `src/components/axisLabel.mts:40-54` and `:92-107` — byte-identical 15-line spacing-derivation blocks inside one file.
- CSS-var reading patterns: `Number.isNaN(...) ? 8 : x` (axisLabel), `parseFloat(...) || 6` (xAxis/yAxis), `parseFloat(...) || 3` (points.mts:49), direct reads (legend.mts:65).
- `src/utils/cssVariables.mts` (75 lines) — existing home for CSS-var helpers; tested (`cssVariables.test.mts`, 172 lines). THIS is where the shared reader goes.
- `src/themes/index.mts` — 0 lines (empty barrel), re-exported pointlessly by `src/internal.mts:12`.
- Repo conventions (AGENTS.md): all visual attributes via `var(--vl-*)`, no hardcoded inline values; renderers idempotent (select-before-append); camelCase functions.
- Per-component tests exist for every file touched here (xAxis, yAxis, grid, axisLabel, points, legend) — they are the safety net; run them after every step.

## Commands you will need

| Purpose   | Command | Expected on success |
|-----------|---------|---------------------|
| Component tests | `pnpm test -- xAxis yAxis grid axisLabel points legend cssVariables` | all pass after each step |
| Full run  | `pnpm test` | all pass |
| Typecheck | `pnpm type-check` | exit 0 |

## Scope

**In scope**:
- `src/components/xAxis.mts`, `src/components/yAxis.mts`, `src/components/grid.mts`, `src/components/axisLabel.mts`, `src/components/points.mts`, `src/components/legend.mts`
- `src/utils/cssVariables.mts` (+ its test file)
- `src/themes/index.mts`, `src/internal.mts` (barrel fix only)
- The per-component `__tests__` files if imports change (behavior assertions stay)

**Out of scope**:
- Public API: `renderXAxis`/`renderYAxis`/`renderXGrid`/`renderYGrid` keep their exact exported names and signatures (other code and docs import them).
- The zoom-redraw pipeline in `chartRender.mts` (plan 012).
- Aggressive caching of computed style beyond what Step 1's helper enables — the render-context caching redesign is plan 012 territory; here we only stop the per-call `getComputedStyle` re-reads WITHIN a single render pass where trivially shareable.

## Git workflow

- Branch: `advisor/009-component-consolidation`
- Commit per step: `refactor: add readCssNumber helper`, `refactor: dedupe axis renderers`, `refactor: dedupe grid renderers`, `refactor: extract axis label spacing`, `chore: populate themes barrel`.
- Do NOT push unless instructed.

## Steps

### Step 1: `readCssNumber` helper (RED→GREEN micro-cycle)

Add to `src/utils/cssVariables.mts`:

```ts
export const readCssNumber = (
  node: Element,
  varName: string,
  fallback: number,
): number => {
  const raw = parseFloat(getComputedStyle(node).getPropertyValue(varName));
  return Number.isFinite(raw) ? raw : fallback;
};
```

Tests in `cssVariables.test.mts`: missing var → fallback; `"0"` → `0` (NOT fallback — this is the regression the old `||` pattern had); normal values pass through. Then replace the fallback-reading call sites in xAxis, yAxis, points, legend, axisLabel (7 sites). Verify: `pnpm test -- cssVariables xAxis yAxis points legend axisLabel` → green, and `grep -rn "parseFloat(getComputedStyle" src/components/` → no matches.

### Step 2: Dedupe axis renderers

Create a shared internal (NOT exported from the package index) factory in `src/components/` — e.g. `axisRenderer.mts` — holding one `renderAxis(orientation, ...)` parameterized by an `ORIENTATION_CONFIG` table (`x`: `axisBottom`, class `x-axis`, transform `(h) => translate(0,h)`; `y`: `axisLeft`, class `y-axis`, no transform). `renderXAxis`/`renderYAxis` become thin wrappers with unchanged signatures. Keep the `.data([null]).join("g")` idempotency pattern exactly.

**Verify**: `pnpm test -- xAxis yAxis` → green; `pnpm test` full → green.

### Step 3: Dedupe grid renderers

Same pattern in `grid.mts`: one internal `renderGrid({ tickScale, extentScale, className })`; `renderXGrid`/`renderYGrid` remain as exported thin wrappers. The 6 shared attribute lines collapse to one block.

**Verify**: `pnpm test -- grid` → green.

### Step 4: Extract axis-label spacing

In `axisLabel.mts`, collapse the two identical 15-line blocks (lines ~40-54 and ~92-107) into one local `resolveAxisLabelSpacing(svgNode)` used by both label functions.

**Verify**: `pnpm test -- axisLabel` → green.

### Step 5: Fix the themes barrel

Populate `src/themes/index.mts` with `export { defaultTheme } from "./defaultTheme.mjs";` plus the theme types, OR delete the file and its re-export line in `internal.mts` — pick ONE (populating is preferred: it gives `visc-line/internal` a coherent themes entry point).

**Verify**: `pnpm type-check` → exit 0; `wc -l src/themes/index.mts` → nonzero (if populated).

### Step 6: Full check

**Verify**: `pnpm check` → exit 0.

## Test plan

- New: `readCssNumber` unit tests including the `"0"` regression.
- Existing: all per-component suites must stay green without modifying their assertions (import paths only if needed). If an assertion must change, the refactor changed behavior — STOP and re-examine.

## Done criteria

- [ ] `pnpm check` exits 0
- [ ] `grep -rn "parseFloat(getComputedStyle" src/components/` → no matches
- [ ] `xAxis.mts` + `yAxis.mts` combined shrink (~120 lines → ~70 with shared factory)
- [ ] `axisLabel.mts` has one spacing-derivation block
- [ ] `src/themes/index.mts` is either populated or deleted (not 0 lines)
- [ ] No public export names/signatures changed (`node -e "..."` against `src/index.mts` export list or `pnpm build && grep` on dist d.ts)
- [ ] `plans/README.md` status row updated

## STOP conditions

- Any per-component test requires assertion changes to stay green — the refactor is not behavior-preserving; stop and report the diff.
- The orientation table cannot express a difference you find in the live code (i.e. the two axes differ in MORE ways than the three listed) — stop and report the extra differences.
- TypeScript type gymnastics for the shared factory exceed ~40 lines — that's the wrong design; report for reconsideration.

## Maintenance notes

- Future second-Y-axis / right-oriented axis support should be a new entry in `ORIENTATION_CONFIG`, not a new file — that's the payoff of this plan.
- When plan 012 (registry) lands, consider whether `readCssNumber` results get computed once per render pass in the context rather than per component call.
