# Plan 016: Make points follow zoom/pan

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat f884f20..HEAD -- src/chart/featureRegistry.mts`
> If featureRegistry.mts changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug
- **Methodology**: **STRICT TDD** — write the failing test first, confirm RED for the
  right reason, apply the minimal fix, confirm GREEN. Do not touch source before the
  test exists and fails.
- **Planned at**: commit `f884f20`, 2026-09-03

## Why this matters

With `points` and `zoomPan` both enabled, data-point circles freeze at their pre-zoom
positions while the line, axes, and grid move. The zoom dispatcher passes the new
scales (`newX`, `newY`) to every `onZoomRedraw` handler, but the points handler ignores
them and re-renders with the stale original scales from `ctx`. This is a user-visible
rendering defect in a shipped combination of two public features.

## Current state

- `src/chart/featureRegistry.mts` — central feature registry; contains the broken
  anonymous points entry (lines 503–531) and the zoom dispatch loop (lines 432–455).
- The zoom dispatcher **does** pass new scales
  (`src/chart/featureRegistry.mts:432-455`, inside `zoomPanDef.render`):

```ts
onZoom:
  ctx.state.zoomPanOptions.onZoom ??
  ((newX: AnyScale, newY: AnyScale): void => {
    // Registry-driven zoom dispatch
    for (const feature of FEATURE_REGISTRY) {
      if (ctx.flags[feature.flagKey] && feature.onZoomRedraw) {
        feature.onZoomRedraw(
          { ...ctx, allSeriesExtents: ctx.allSeriesExtents } as FeatureRenderContext<unknown>,
          dims,
          newX,
          newY,
        );
      }
    }
    // Line re-render is NOT in the registry — re-render line directly
    renderLine<unknown>(ctx.content, ctx.state.currentSeries, newX, newY, ...);
  }),
```

- The broken points entry (`src/chart/featureRegistry.mts:503-531`) — `onZoomRedraw`
  (508–517) is byte-identical to `render` (521–530) and ignores its `newX`/`newY`:

```ts
{                                                          // 503 — anonymous points entry
  clearSelectors: ["g.point-series"],
  flagKey: "hasPoints",
  isEqual: () => true,
  key: "points",
  onZoomRedraw: (ctx) => {
    if (!ctx.flags.hasPoints) return;
    renderPoints(
      ctx.content,
      ctx.state.currentSeries,
      ctx.xScale,   // ← stale: should be the newX param
      ctx.yScale,   // ← stale: should be the newY param
      ctx.config.xSerie.accessor,
    );
  },
  optionsKey: "hasPoints",
  render: (ctx) => { /* identical body, ctx.xScale/ctx.yScale correct here */ },
},
```

- Contrast — axes uses the new scales correctly
  (`src/chart/featureRegistry.mts:180,184`): `ctx.bounds.call(renderXAxis, newX, ...)`;
  grid likewise (`:254,259`).
- `renderPoints` signature (from `src/components/points.mts`, imported at
  `featureRegistry.mts:136`): `(content, series, xScale, yScale, accessor)`.
- Test harness pattern to copy: `src/interactivity/__tests__/zoomPan.test.mts:11-18`
  (`createMockSVG` helper: jsdom + `select(svgEl)`), and `src/components/__tests__/points.test.mts`
  for how points DOM (`g.point-series`, `circle` positions) is asserted.

## Commands you will need

| Purpose   | Command                        | Expected on success |
|-----------|--------------------------------|---------------------|
| Install   | `pnpm install`                 | exit 0              |
| Typecheck | `pnpm type-check`              | exit 0, no errors   |
| Tests     | `pnpm test -- pointsZoom`      | all pass (after fix)|
| Full gate | `pnpm check`                   | exit 0 (type-check → test → build → lint) |

## Scope

**In scope** (the only files you should modify):
- `src/chart/featureRegistry.mts` (the points entry only)
- `src/chart/__tests__/pointsZoom.test.mts` (create)

**Out of scope** (do NOT touch):
- `src/components/points.mts` — renderer is correct; the defect is in the registry entry.
- `src/interactivity/zoomPan.mts` — dispatch already passes new scales.
- The axes/grid/legend/tooltip/custom defs — a later plan (017) deduplicates render/onZoomRedraw pairs; do not start that here.
- Public API (`src/index.mts`, `src/internal.mts`).

## Git workflow

- Branch: `advisor/016-points-follow-zoom`
- Commit style: conventional commits (`test: ...`, `fix: ...`), matching `git log`
  (e.g. `test: add dedicated timeTickFormat test file`, `fix: ...`).
- Do NOT push or open a PR unless the operator instructed it.
- When done: update your row in `plans/README.md` (convention from prior plans:
  `chore: mark plan 016 done`).

## Steps

### Step 1: RED — write the failing test

Create `src/chart/__tests__/pointsZoom.test.mts`. Model the mock-SVG harness after
`src/interactivity/__tests__/zoomPan.test.mts:11-18` and the points assertions after
`src/components/__tests__/points.test.mts`.

The test targets the exact broken seam: the registry's points entry, invoked with new
scales the way the zoom dispatcher invokes it:

```ts
import { afterEach, describe, expect, it } from "vitest";
import { scaleLinear, select } from "d3";
import { FEATURE_REGISTRY } from "@/chart/featureRegistry.mjs";
import type { BoundsSelection } from "@/types/index.mjs";
import type { FeatureDefinition, FeatureRenderContext } from "@/chart/featureRegistry.mjs";

// Build a minimal content selection carrying point circles positioned by a scale.
// renderPoints draws g.point-series > circle with cx/cy from the scales; replicate
// the positioning contract with plain d3 joins (see points.test.mts for the real shape).
const createContent = (): BoundsSelection => {
  const svgEl = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  document.body.appendChild(svgEl);
  const svg = select(svgEl);
  const bounds = svg.append("g").attr("class", "bounds");
  return bounds.append("g").attr("class", "content") as unknown as BoundsSelection;
};

describe("points onZoomRedraw", () => {
  afterEach(() => { document.body.innerHTML = ""; });

  it("re-renders points at positions derived from the NEW zoomed scales", () => {
    const pointsDef = FEATURE_REGISTRY.find((f) => f.key === "points") as FeatureDefinition<"points">;
    expect(pointsDef.onZoomRedraw).toBeTypeOf("function");

    const xScale = scaleLinear().domain([0, 100]).range([0, 200]);
    const yScale = scaleLinear().domain([0, 100]).range([100, 0]);
    // A 2x zoom halves the visible domain:
    const newX = scaleLinear().domain([0, 50]).range([0, 200]);
    const newY = scaleLinear().domain([0, 50]).range([100, 0]);

    const content = createContent();
    // One datum at x=25, y=25 → cx=50, cy=75 on the ORIGINAL scales.
    // Render via the entry's render() so the test exercises the real renderer path.
    const ctx = { /* minimal FeatureRenderContext stub: flags.hasPoints=true,
                     state.currentSeries=[datum x:25,y:25], config.xSerie.accessor,
                     content, xScale, yScale — copy the stub shape from
                     src/chart/__tests__/chartRender.test.mts */ } as unknown as FeatureRenderContext<unknown>;
    pointsDef.render(ctx, { height: 100, innerHeight: 100, innerWidth: 200, margins: { bottom: 0, left: 0, right: 0, top: 0 }, width: 200 });

    const circleBefore = content.select("circle");
    const cxBefore = Number(circleBefore.attr("cx"));

    pointsDef.onZoomRedraw?.(ctx, { height: 100, innerHeight: 100, innerWidth: 200, margins: { bottom: 0, left: 0, right: 0, top: 0 }, width: 200 }, newX, newY);

    const cxAfter = Number(content.select("circle").attr("cx"));
    // On newX, x=25 maps to cx=100 (not 50). The bug keeps cx=50.
    expect(cxAfter).toBe(100);
  });
});
```

Notes:
- Fill the `ctx` stub by copying the pattern from `src/chart/__tests__/chartRender.test.mts`
  (it builds `FeatureRenderContext` stubs already). Keep the stub minimal but real enough
  that `renderPoints` actually draws circles.
- If building a workable `ctx` stub through `chartRender.test.mts` is easier, do that
  instead — the assertion contract above is what matters: **after `onZoomRedraw` with
  zoomed scales, circle positions MUST reflect the zoomed scales, not `ctx.xScale`**.
- Optional second test (skip if jsdom fights you, note it in the report): integration
  through `createChart` with `.withPoints()` + `.withZoomPan()`, fire
  `svgEl.dispatchEvent(new WheelEvent("wheel", { deltaY: -120, clientX: 100, clientY: 50 }))`,
  assert circles moved.

**Verify**: `pnpm test -- pointsZoom` → the new test FAILS with `cxAfter` = 50 (expected 100).
The failure must be the position assertion, not an import/harness error.

### Step 2: GREEN — minimal fix in the points entry

In `src/chart/featureRegistry.mts`, change ONLY the points entry's `onZoomRedraw`
(lines ~508–517) to accept and use the new scales:

```ts
onZoomRedraw: (ctx, _dims, newX, newY) => {
  if (!ctx.flags.hasPoints) return;
  renderPoints(
    ctx.content,
    ctx.state.currentSeries,
    newX,
    newY,
    ctx.config.xSerie.accessor,
  );
},
```

Do not reformat anything else in the file.

**Verify**: `pnpm test -- pointsZoom` → all pass.

### Step 3: Full regression gate

**Verify**: `pnpm check` → exit 0 (type-check → test → build → lint, all green).

### Step 4: Bookkeeping

Update the 016 row in `plans/README.md` to DONE. Commit as `chore: mark plan 016 done`.

**Verify**: `git status` → clean; `git log --oneline -3` shows the fix + test + chore commits.

## Test plan

- New file `src/chart/__tests__/pointsZoom.test.mts`:
  - required: unit test at the registry seam (above) — zoomed scales reposition circles;
  - optional: chart-level integration test via wheel event (skip with a note if jsdom blocks it).
- Structural pattern: `src/interactivity/__tests__/zoomPan.test.mts` (harness),
  `src/chart/__tests__/chartRender.test.mts` (ctx stub shape),
  `src/components/__tests__/points.test.mts` (DOM assertions).
- Verification: `pnpm test` → all pass including the new file; no existing test flips.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `pnpm check` exits 0
- [ ] `src/chart/__tests__/pointsZoom.test.mts` exists and its points-zoom test passes
- [ ] `git diff f884f20..HEAD -- src/chart/featureRegistry.mts` shows changes ONLY inside the points entry's `onZoomRedraw`
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated to DONE

## STOP conditions

Stop and report back (do not improvise) if:

- The points entry at `featureRegistry.mts:503-531` doesn't match the excerpt above
  (the codebase has drifted).
- The RED failure in Step 1 is an import/harness error rather than the position
  assertion after two reasonable attempts to fix the test scaffolding.
- Making the test green appears to require touching `src/components/points.mts` or any
  out-of-scope file.
- Any previously-green test breaks after the fix (points positioning contract may be
  asserted elsewhere — report which one instead of updating it silently).

## Maintenance notes

- Plan 017 will deduplicate this now-slightly-different `render`/`onZoomRedraw` pair —
  keep both bodies visible, don't pre-merge them here.
- Reviewers should scrutinize that the fix uses the handler parameters, not a mutation
  of `ctx` (the context is shared across features and must stay immutable per render).
- The integration-level zoom test (createChart + wheel) remains a nice-to-have gap;
  plan 010's Playwright smoke suite is the natural home for a browser-level version.
