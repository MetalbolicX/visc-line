# Plan 006: Builder API correctness — zoom reset on update, scaleExtent comparator, withCustom identity

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 5860f3e..HEAD -- src/chart/createChart.mts src/chart/optionComparators.mts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: plans/002-characterization-suite.md
- **Category**: bug
- **Planned at**: commit `5860f3e`, 2026-09-01

## Why this matters

Three small inconsistencies in the fluent builder silently misbehave:

1. `update(newData)` swaps the dataset but keeps the old zoom/pan transform — the chart appears "scrolled" into a region with no data. The other two series-mutating paths (`updateVisibleSeries`, `withVisibleSeries`) both reset zoom; `update` is the odd one out.
2. `areZoomPanOptionsEqual` compares ONLY `onZoom` (verified: `src/chart/optionComparators.mts:174-177` is `previous.onZoom === next.onZoom`). Calling `withZoomPan({ scaleExtent: [0.5, 8] })` after `withZoomPan({ scaleExtent: [0.5, 32] })` short-circuits the re-render — new zoom limits never apply.
3. `withCustom(cb)` always tears down and re-runs the callback, even for the identical function reference, unlike every sibling `with*` method which short-circuits on option equality.

Each is small; together they erode trust in the builder's contract: "same options → no re-render, mutating data → coherent view".

## Current state

- `src/chart/createChart.mts:216-239` — `update()`: recomputes extents, mutates `state.allSeries`/`state.currentSeries`, calls `render()`. NO `state.zoomBehavior?.reset()` (verified). For contrast, `updateVisibleSeries` (~line 245) and `withVisibleSeries` (~line 316) both call `state.zoomBehavior?.reset();`.
- `src/chart/optionComparators.mts:174-177` — `export const areZoomPanOptionsEqual = (previous: WithZoomPanOptions, next: WithZoomPanOptions): boolean => previous.onZoom === next.onZoom;` (verified, exact quote).
- `src/chart/createChart.mts:258-272` — `withCustom`: no identity/equality short-circuit for the non-null callback branch (siblings at :248-257, :273-295, :320-355 all pattern-match on `areXOptionsEqual(...)`).
- `WithZoomPanOptions` includes `scaleExtent` (consumed by `src/interactivity/zoomPan.mts:42`).
- Comparator test exemplar: `src/chart/__tests__/optionComparators.test.mts` (232 lines). Builder test exemplar: `src/chart/__tests__/createChart.test.mts`.

## Commands you will need

| Purpose   | Command | Expected on success |
|-----------|---------|---------------------|
| Red run   | `pnpm test -- optionComparators createChart` | new tests FAIL before fix |
| Green run | `pnpm test` | all pass |
| Typecheck | `pnpm type-check` | exit 0 |

## Suggested executor toolkit

- Strict TDD: Step 1 red, Step 2 green, one sub-fix at a time.

## Scope

**In scope**:
- `src/chart/createChart.mts` (update() and withCustom() only)
- `src/chart/optionComparators.mts` (areZoomPanOptionsEqual only)
- `src/chart/__tests__/optionComparators.test.mts`
- `src/chart/__tests__/createChart.test.mts`

**Out of scope**:
- `zoomPan.mts` (consumes options correctly; the bug is upstream).
- Other comparators beyond a read-only sanity check (if you NOTICE another comparator skipping a scalar field, add a test + fix only if trivially same-shaped; otherwise report it).
- The general `with*` dedup (plan 012 design).

## Git workflow

- Branch: `advisor/006-builder-correctness`
- Commits, one per sub-fix: `fix: reset zoom transform on data update`, `fix: compare scaleExtent in zoom-pan options equality`, `fix: short-circuit withCustom for identical callback`.
- Do NOT push unless instructed.

## Steps

### Step 1: Write three failing tests (RED)

1. `optionComparators.test.mts`: `areZoomPanOptionsEqual({onZoom: undefined}, {onZoom: undefined})` with differing `scaleExtent` → expect `false` (currently returns `true`).
2. `createChart.test.mts`: `update(newData)` — spy/stub `state.zoomBehavior.reset` (or assert the zoom transform resets via the rendered transform when practical; a registry/state-level assertion is acceptable — match how existing zoom tests in `createChart.test.mts` observe zoom).
3. `createChart.test.mts`: `withCustom(cb)` called twice with the SAME `cb` reference — assert the custom cleanup/re-render does not run on the second call (spy on render or cleanup invocation count).

**Verify**: `pnpm test -- optionComparators createChart` → exactly the 3 new tests fail.

### Step 2: Apply the three fixes (GREEN)

1. `optionComparators.mts`: extend `areZoomPanOptionsEqual` to also compare `scaleExtent` element-wise (both endpoints; treat `undefined === undefined` as equal).
2. `createChart.mts` `update()`: add `state.zoomBehavior?.reset();` right after `state.currentSeries` is mutated, mirroring `updateVisibleSeries`.
3. `createChart.mts` `withCustom()`: at the top of the non-null branch, `if (state.customCallback === callback) return chart;` (match the actual state field names in `chartState.mts`).

**Verify**: `pnpm test` → all pass.

### Step 3: Full check

**Verify**: `pnpm check` → exit 0.

## Test plan

Three regression tests as in Step 1; keep the existing 232-line comparator suite and 585-line builder suite green. If any existing test PINS the old broken behavior (e.g. asserts update preserves zoom), update it in the same commit and note it in the PR body.

## Done criteria

- [ ] `pnpm check` exits 0
- [ ] `grep -n "scaleExtent" src/chart/optionComparators.mts` shows the comparison
- [ ] `grep -n "zoomBehavior?.reset" src/chart/createChart.mts` shows 3 call sites (update, updateVisibleSeries, withVisibleSeries)
- [ ] `withCustom` identity short-circuit present
- [ ] No files outside the in-scope list modified
- [ ] `plans/README.md` status row updated

## STOP conditions

- An existing green test explicitly pins the CURRENT behavior of any of the three (i.e. the broken behavior was intentional) — stop and report which test; do not flip semantics unilaterally.
- The zoom-observation harness in `createChart.test.mts` cannot observe the reset after 2 attempts — report what you tried.

## Maintenance notes

- `update()` resetting zoom is now CONTRACT; if a "preserve zoom across data refresh" option is ever requested, add `update(data, { preserveZoom: true })` rather than reverting.
- When plan 012 (feature registry) lands, the comparator changes fold into per-feature comparator definitions.
