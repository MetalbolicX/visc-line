# Plan 022: Add data-anchored reference lines and annotations features

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**:
> `git diff --stat 42b5d56..HEAD -- src/chart src/components docs/api-reference.md AGENTS.md`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: LOW
- **Depends on**: none (all prior plans DONE)
- **Category**: feature (additive library capability)
- **Planned at**: commit `42b5d56`, 2026-09-04
- **Methodology**: component-first TDD — write component + characterization
  test first (tree stays green), then wire the feature through the registry.

## Why this matters

The library's stated goal is letting users build line charts that focus
attention ("storytelling with data"). Today there is no way to draw a target
line, a threshold, or a callout on a data point — grep confirms zero
annotation/reference-line/band functionality in `src/`. Round 1's audit
explicitly DEFERRED "D3 annotations" until the feature registry made them
one-entry additions (see `plans/README.md` "Findings considered and
rejected"). The registry migration (plans 012/014/018) has landed, so that
condition is now met. This plan adds two registry-driven features:

1. **`withReferenceLines`** — horizontal/vertical dashed lines at data
   values, optional label (e.g. "Target", "Average").
2. **`withAnnotations`** — text callouts anchored to data coordinates with
   optional leader/connector line.

Both are **data-anchored**: positions are computed from domain values via
the scales, so they move and rescale during zoom/pan (they participate in
the zoom path like axes/grid/points). This decision was settled with the
library owner — do not change it to pixel-anchored.

## Current state

Facts the executor needs. All excerpts verified verbatim at `42b5d56`.

### Architecture: the feature registry

Every optional feature is declared once and the registry drives render,
zoom redraw, cleanup, and (indirectly) the fluent `with*` API. Adding a
feature = one def file + registry entry + hand-written wiring in 4 type
files. `AGENTS.md` documents the contract; registry order at HEAD:

```
axes → grid → title → legend → tooltip → zoomPan → custom → points
```

Target order after this plan (reference lines render in the context layer
right after grid; annotations render above the line, under point markers):

```
axes → grid → referenceLines → title → legend → tooltip → zoomPan → custom → annotations → points
```

### Files and their roles

- `src/chart/chartTypes.mts` (89 lines) — public option interfaces +
  `ChartInstance` (the fluent API surface). Every `with*` method is
  hand-declared here.
- `src/chart/chartState.mts` (72 lines) — `ChartState<T>` (mutable runtime
  state: `has*` booleans + `*Options` fields) and `FeatureFlags` (read-only
  mirror of the booleans).
- `src/chart/featureContext.mts` (110 lines) — `FeatureDefinition<K>`
  contract, `FeatureKey` union, `FeatureOptionsMap`, `FeatureRenderContext`.
- `src/chart/featureComparators.mts` (106 lines) — one shallow-equality
  comparator per feature.
- `src/chart/featureDefs/*.mts` — one def file per feature (8 at HEAD).
- `src/chart/featureRegistry.mts` (49 lines) — imports the defs, exports
  ordered `FEATURE_REGISTRY` array.
- `src/chart/createChart.mts` — owns `state`, builds flags per render,
  hand-writes each `with*` method.
- `src/chart/zoomDispatch.mts` — on zoom, iterates registry calling
  `feature.onZoomRedraw` when the flag is on.
- `src/components/*.mts` — pure D3 renderers; `src/components/index.mts`
  re-exports them.
- `src/components/__tests__/grid.test.mts` — the characterization-test
  pattern to mirror.

### The def contract (`src/chart/featureContext.mts:28-59`)

```ts
export interface FeatureDefinition<K extends FeatureKey> {
  readonly clearEvents?: readonly string[];      // d3 event namespaces to unbind
  readonly clearSelectors: readonly string[];    // CSS selectors removed on disable
  readonly flagKey: keyof FeatureFlags;          // boolean gate
  readonly isEqual: (a: unknown, b: unknown) => boolean;
  readonly key: K;
  readonly onZoomRedraw?: (ctx, dims, newX, newY) => void;  // zoom path; omit = excluded
  readonly optionsKey: keyof ChartState<unknown>;
  readonly render: (ctx, dims) => void;          // initial path
}
```

`FeatureKey` union at `:62-65` and `FeatureOptionsMap` at `:68-77` currently
enumerate the 8 existing features. **Drift note**: `plans/README.md` line 63
claims `FeatureOptionsMap` was deleted during plan 018, but the live file at
`42b5d56` HAS it (the registry re-exports it). Trust the live file; if your
drift check shows it truly gone, skip only the `FeatureOptionsMap` edit and
proceed.

### The def pattern to mimic — `src/chart/featureDefs/grid.mts` (full)

```ts
import type { WithGridOptions } from "@/chart/chartTypes.mjs";
import type { FeatureDefinition } from "@/chart/featureContext.mjs";
import type { AnyScale } from "@/types/index.mjs";

import { areGridOptionsEqual } from "@/chart/featureComparators.mjs";
import { renderXGrid, renderYGrid } from "@/components/grid.mjs";

const renderGridScales = (content, xScale, yScale, gridOptions) => {
  const { showX = true, showY = true } = gridOptions;
  if (showX) { content.call(renderXGrid, xScale, yScale); }
  else { content.selectAll("line.grid-x").remove(); }
  if (showY) { content.call(renderYGrid, xScale, yScale); }
  else { content.selectAll("line.grid-y").remove(); }
};

export const gridDef: FeatureDefinition<"grid"> = {
  clearSelectors: ["line.grid-x", "line.grid-y"],
  flagKey: "hasGrid",
  isEqual: areGridOptionsEqual,
  key: "grid",
  onZoomRedraw: (ctx, _dims, newX, newY) => {
    if (!ctx.flags.hasGrid) return;
    renderGridScales(ctx.content, newX, newY, ctx.state.gridOptions as WithGridOptions);
  },
  optionsKey: "gridOptions",
  render: (ctx, _dims) => {
    if (!ctx.flags.hasGrid) return;
    renderGridScales(ctx.content, ctx.xScale, ctx.yScale, ctx.state.gridOptions as WithGridOptions);
  },
};
```

Note the file-local `renderGridScales` helper deduping render/onZoomRedraw
(plan 017 convention — keep it for both new defs). Our defs additionally
USE `dims` (innerWidth/innerHeight), so import `Dimensions` from
`@/types/layoutTypes.mjs` and drop the `_` prefix.

### The component pattern — `src/components/grid.mts:33-48`

Idempotent select-before-append via `.join()`; ALL visual attributes are
CSS custom properties with inline fallbacks:

```ts
boundSelection
  .selectAll<SVGLineElement, unknown>(`line.${className}`)
  .data(tickableScale.ticks())
  .join("line")
  .attr("class", className)
  .attr("stroke", "var(--vl-grid-stroke, #e6e6e6)")
  .attr("stroke-width", "var(--vl-grid-stroke-width, 1)")
  ...
```

**Important**: do NOT copy grid's coordinate math (it uses scale `.domain()`
values as pixel coordinates). For correct pixel extents use
`dims.innerWidth` / `dims.innerHeight` (fields of `Dimensions`, passed to
both `render` and `onZoomRedraw`), and compute pixel positions by calling
the scales. To call a scale with a number/Date and get a pixel number, use
`asScaleNumber` from `@/utils/scaleCast.mjs` — first check how
`src/components/points.mts` invokes the x/y scales on data values and
mirror its exact pattern (it is the established convention for
scale-as-function calls).

### The `with*` pattern — `src/chart/createChart.mts:271-278`

```ts
withGrid: (options = {}): ChartInstance<T> => {
  ensureActive();
  if (state.hasGrid) return chart;
  state.hasGrid = true;
  state.gridOptions = options;
  render();
  return chart;
},
```

State init literal (`createChart.mts:134-157`) is alphabetically sorted
(`sort-keys` lint is enforced; if unsure run `pnpm lint:fix` before
committing). Flags are derived per render at `:166-168`:

```ts
flags: Object.fromEntries(
  FEATURE_REGISTRY.map((f) => [f.flagKey, Boolean(state[f.flagKey])]),
) as unknown as import("@/chart/chartState.mjs").FeatureFlags,
```

This mapping picks up new flags automatically — no edit needed there.

### Zoom dispatch — `src/chart/zoomDispatch.mts:32-45`

```ts
for (const feature of FEATURE_REGISTRY) {
  if (ctx.flags[feature.flagKey] && feature.onZoomRedraw) {
    feature.onZoomRedraw({ ...ctx, ... }, dims, newX, newY);
  }
}
redrawLine(ctx, newX, newY);
```

No edit needed — defining `onZoomRedraw` on the new defs is sufficient.

### Registry array — `src/chart/featureRegistry.mts:40-49`

Ordered array of `axesDef, gridDef, titleDef, legendDef, tooltipDef,
zoomPanDef, customDef, pointsDef`, typed
`FeatureDefinition<"axes" | "custom" | ...>[]` (inline union — extend it).
New imports follow the existing namespace style shown in the file.

### Test pattern — `src/components/__tests__/grid.test.mts`

Vitest + jsdom. Build a real DOM `g.bounds` inside a `div` appended to
`document.body`, wrap with `select()` from d3, `afterEach` clears
`document.body.innerHTML`. Triad per renderer: **renders expected elements /
idempotent on re-render / CSS-var styling**. There are no def-level test
files for grid; but a zoom-seam test exists for points from plan 016 —
locate it with `rg -l "onZoomRedraw" src --glob "*test*"` and mirror its
approach in Step 5.

### Public API usage shape (from `createChart.mts:48-57` JSDoc)

```ts
const chart = createChart(el, { data, xSerie: {...}, ySeries: [...] });
chart.withAxes().withTooltip();
```

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|--------------------------|---------------------|
| Install   | `pnpm install`           | exit 0              |
| Typecheck | `pnpm type-check`        | exit 0, no errors   |
| Tests     | `pnpm test --run`        | all pass            |
| Lint      | `pnpm lint` (autofix: `pnpm lint:fix`) | exit 0 |
| Full gate | `pnpm check`             | exit 0 (type-check → test → build → lint) |

## Scope

**In scope** (the only files you should modify/create):

- `src/chart/chartTypes.mts`
- `src/chart/chartState.mts`
- `src/chart/featureContext.mts`
- `src/chart/featureComparators.mts`
- `src/chart/featureRegistry.mts`
- `src/chart/createChart.mts`
- `src/chart/featureDefs/referenceLines.mts` (create)
- `src/chart/featureDefs/annotations.mts` (create)
- `src/components/referenceLines.mts` (create)
- `src/components/annotations.mts` (create)
- `src/components/index.mts`
- `src/components/__tests__/referenceLines.test.mts` (create)
- `src/components/__tests__/annotations.test.mts` (create)
- one zoom-seam test file (extend the existing points-zoom test file found
  in Step 5, or create the equivalent)
- `src/internal.mts` — ONLY the bounded conditional in Step 4
- `docs/api-reference.md`
- `AGENTS.md` — registry-order line only
- `plans/README.md` — status row

**Out of scope** (do NOT touch):

- Theme schema / `applyThemeCssVars` — new CSS vars ship with inline
  fallbacks only; promoting them to `Theme` tokens is a follow-up.
- `src/index.mts` public exports — internal components stay internal
  (grid's renderers are not publicly exported either).
- `examples/main.mts`, playwright e2e, `docs/_sidebar.md`.
- Any change to existing features' behavior or the zoom dispatch loop.

## Git workflow

- Branch: `feature/022-reference-lines-annotations`
- Commit per step, conventional style matching `git log` (e.g.
  `feat(chart): add withReferenceLines feature`, `feat(chart): add
  withAnnotations feature`, `test(chart): zoom seam for reference lines and
  annotations`, `docs: document reference lines and annotations`).
- Do NOT push or open a PR unless the operator instructed it.

## API to implement (settle these shapes exactly)

In `src/chart/chartTypes.mts`:

```ts
export interface ReferenceLine {
  /** "y" renders a horizontal line at a y-domain value; "x" renders vertical. */
  readonly axis: "x" | "y";
  readonly value: number | Date;
  readonly label?: string;
}

export interface WithReferenceLinesOptions {
  readonly lines: readonly ReferenceLine[];
}

export interface ChartAnnotation {
  /** Data coordinate to anchor to. Date when xType is "time". */
  readonly x: number | Date;
  readonly y: number;
  readonly text: string;
  /** Pixel offsets from the anchor. Defaults: dx = 8, dy = -8. */
  readonly dx?: number;
  readonly dy?: number;
  /** Draw a leader line from anchor to text. Default: false. */
  readonly showConnector?: boolean;
}

export interface WithAnnotationsOptions {
  readonly annotations: readonly ChartAnnotation[];
}
```

On `ChartInstance<T>` (alphabetical order — `sort-keys`):
`withAnnotations` goes BEFORE `withAxes` ("withAnnotations" < "withAxes";
"n" < "x"), `withReferenceLines` between `withPoints` and `withTitle`:

```ts
readonly withAnnotations: (options: WithAnnotationsOptions) => ChartInstance<T>;
readonly withReferenceLines: (options: WithReferenceLinesOptions) => ChartInstance<T>;
```

Both take REQUIRED options (like `withLegend`/`withTitle`, no defaults).

DOM contract (consumed by `clearSelectors`):

- Reference lines: one `<g class="reference-line">` per entry in
  `ctx.content`, containing a `<line class="reference-line-stroke">` and,
  when `label` is set, a `<text class="reference-line-label">`.
- Annotations: one `<g class="annotation">` per entry in `ctx.content`,
  containing an optional `<line class="annotation-connector">` (when
  `showConnector`) and a `<text class="annotation-text">`.

CSS-var styling (inline fallbacks; hex values match the library's muted
slate palette — check `src/themes/` first for a plan-019 fallback-constants
module; if one exists for stroke/text colors, reuse its constants instead
of inline literals):

- reference line: `--vl-reference-line-stroke` (#94a3b8),
  `--vl-reference-line-stroke-width` (1),
  `--vl-reference-line-dash-array` (6 6),
  `--vl-reference-line-stroke-linecap` (round),
  `--vl-reference-line-label-fill` (#64748b),
  `--vl-reference-line-label-font-size` (12px).
- annotation: `--vl-annotation-text-fill` (#334155),
  `--vl-annotation-text-font-size` (12px),
  `--vl-annotation-connector-stroke` (#94a3b8),
  `--vl-annotation-connector-stroke-width` (1),
  `--vl-annotation-connector-dash-array` (2 3).

Geometry (px, inside `content` which spans the inner plot area):

- `axis: "y"` (horizontal): `x1 = 0`, `x2 = innerWidth`,
  `y1 = y2 = yScale(value)`. Label: `x = innerWidth`,
  `y = yScale(value) - 4`, `text-anchor: end`.
- `axis: "x"` (vertical): `y1 = 0`, `y2 = innerHeight`,
  `x1 = x2 = xScale(value)`. Label: `x = xScale(value) + 5`, `y = 12`,
  `text-anchor: start`.
- annotation: anchor `ax = xScale(x)`, `ay = yScale(y)`;
  connector `x1 = ax, y1 = ay, x2 = ax + dx, y2 = ay + dy`;
  text at `x = ax + dx`, `y = ay + dy`, `dy = "0.32em"`,
  `text-anchor` = `dx >= 0 ? "start" : "end"`.

## Steps

### Step 1: Create `src/components/referenceLines.mts` + characterization test

New component, exported as:

```ts
export interface RenderReferenceLinesOptions {
  readonly innerHeight: number;
  readonly innerWidth: number;
  readonly lines: readonly ReferenceLine[];
  readonly xScale: AnyScale;
  readonly yScale: AnyScale;
}
export const renderReferenceLines = (
  boundSelection: BoundsSelection,
  options: RenderReferenceLinesOptions,
): void => { ... }
```

Import `ReferenceLine` from `@/chart/chartTypes.mjs` (type-only; this does
NOT create a cycle — chartTypes imports nothing from components). Use the
grid join pattern (`selectAll("g.reference-line").data(lines).join("g")`)
and apply the DOM contract + geometry + CSS vars above. Skip entries whose
scaled position is not a finite number (guard with `Number.isFinite`).
`shape-rendering: crispEdges` on the stroke line, matching grid.

Add `export { renderReferenceLines } from "@/components/referenceLines.mjs"`
(+ its options type) to `src/components/index.mts`, alphabetically first
("annotations" does not exist yet; it lands in Step 3 — so for now
referenceLines goes after the axisLabel block and before boundsGroup? No —
alphabetical by module path: `annotations` < `axisLabel` < ... <
`referenceLines` < `SVG`. Place `referenceLines` between `points` and
`SVG`).

Write `src/components/__tests__/referenceLines.test.mts` mirroring
grid.test.mts structure (jsdom DOM builder, afterEach cleanup):

- renders one `g.reference-line` per entry (3 lines → 3 groups)
- horizontal line: `x1 === 0`, `x2 === innerWidth`, `y1 === y2 ===
  yScale(50)` for `{ axis: "y", value: 50 }` with
  `scaleLinear().domain([0,100]).range([200,0])`
- vertical line: `y1 === 0`, `y2 === innerHeight`, `x1 === x2 ===
  xScale(value)`
- label renders as `text.reference-line-label` with correct content and
  `text-anchor`; no `<text>` when `label` is omitted
- idempotent: re-render keeps group count equal
- CSS vars: stroke is `var(--vl-reference-line-stroke, #94a3b8)` etc.
- non-finite scale output → entry skipped (e.g. a value outside a
  `scaleClamp`-less linear scale still returns finite — to test the guard,
  pass a mock scale returning NaN for one entry; assert that group absent)

**Verify**: `pnpm test --run referenceLines` → all new tests pass;
`pnpm type-check` → exit 0.

### Step 2: Wire `withReferenceLines` through the registry

Six bounded edits (tree goes red mid-step, green at the end — that is fine
within one step):

1. `src/chart/chartState.mts` — add to `ChartState`:
   `hasReferenceLines: boolean;` (between `hasPoints` and `hasTitle`) and
   `referenceLinesOptions: WithReferenceLinesOptions;` (between
   `legendOptions` and `titleOptions`); add `hasReferenceLines: boolean;`
   to `FeatureFlags` (same alphabetical slot). Extend the import from
   `@/chart/chartTypes.mjs`.
2. `src/chart/featureContext.mts` — add `"referenceLines"` to `FeatureKey`;
   add `referenceLines: WithReferenceLinesOptions;` to
   `FeatureOptionsMap` (if that type still exists per the drift note);
   extend the `With*Options` type import.
3. `src/chart/featureComparators.mts` — add
   `areReferenceLinesOptionsEqual`: false when either side is falsy or
   `lines` lengths differ; else per-item `axis`, `value` (`===`), and
   `label` (`===`, undefined-safe) equality. Follow the file's JSDoc + cast
   style.
4. `src/chart/featureDefs/referenceLines.mts` (create) — mirror gridDef
   exactly: `key: "referenceLines"`, `flagKey: "hasReferenceLines"`,
   `optionsKey: "referenceLinesOptions"`, `isEqual:
   areReferenceLinesEqual`, `clearSelectors: ["g.reference-line"]`, and a
   file-local `renderReferenceLinesScaled(content, xScale, yScale, dims,
   options)` helper called by BOTH `render` and `onZoomRedraw`
   (guard: `if (!ctx.flags.hasReferenceLines) return;`). `onZoomRedraw`
   passes `newX`/`newY`. `ctx.state.referenceLinesOptions` may be typed —
   no cast needed if the state field is properly typed; cast to
   `WithReferenceLinesOptions` only if lint/type demands.
5. `src/chart/featureRegistry.mts` — import the def; insert
   `referenceLinesDef` immediately AFTER `gridDef`; extend the inline
   union type with `"referenceLines"`.
6. `src/chart/createChart.mts` — add `hasReferenceLines: false,` and
   `referenceLinesOptions: { lines: [] },` to the state literal
   (alphabetical slots as in step 2.1); add the `withReferenceLines`
   method after `withPoints` following the withGrid pattern exactly
   (`ensureActive()`, `if (state.hasReferenceLines) return chart;`, set
   flag + options, `render()`, `return chart;`).

**Verify**: `pnpm type-check` → exit 0. `pnpm test --run` → all pass
(registry iteration and flag mapping pick the feature up generically;
nothing existing should change).

### Step 3: Create `src/components/annotations.mts` + characterization test

Same shape as Step 1:

```ts
export interface RenderAnnotationsOptions {
  readonly annotations: readonly ChartAnnotation[];
  readonly xScale: AnyScale;
  readonly yScale: AnyScale;
}
export const renderAnnotations = (
  boundSelection: BoundsSelection,
  options: RenderAnnotationsOptions,
): void => { ... }
```

Join on `g.annotation`, apply defaults `dx = 8`, `dy = -8`,
`showConnector = false`, geometry and CSS vars per the API section. Skip
entries with non-finite anchor. Export from
`src/components/index.mts` at the top (alphabetically first, above the
axisLabel block).

Test file `src/components/__tests__/annotations.test.mts`:

- renders one `g.annotation` per entry
- text at `ax + dx`, `ay + dy` with defaults applied; `dy` attr `0.32em`
- `text-anchor` is `start` for `dx >= 0`, `end` for negative `dx`
- connector present only when `showConnector: true`; connector endpoints
  are anchor and anchor+offset
- idempotent re-render
- CSS vars on text and connector

**Verify**: `pnpm test --run annotations` → pass; `pnpm type-check` → 0.

### Step 4: Wire `withAnnotations` through the registry

Same six edits as Step 2 for the annotations feature:

- state: `annotationsOptions: null | WithAnnotationsOptions;` (between
  `allSeriesExtents` and `axesOptions`), `hasAnnotations: boolean;`
  (BEFORE `hasAxes` — "hasAnnotations" < "hasAxes"), same flag in
  `FeatureFlags`; init `annotationsOptions: null,` /
  `hasAnnotations: false,`.
- context: `"annotations"` in `FeatureKey`, `annotations: null |
  WithAnnotationsOptions;` in `FeatureOptionsMap` (if present).
- comparator `areAnnotationsOptionsEqual` (null handling like
  `areTitleOptionsEqual`; then length + per-item `x`, `y`, `text`, `dx`,
  `dy`, `showConnector` with `?? default` normalization like
  `areAxesOptionsEqual` does for counts).
- def `src/chart/featureDefs/annotations.mts`: `clearSelectors:
  ["g.annotation"]`, file-local helper shared by `render`/`onZoomRedraw`.
- registry: insert `annotationsDef` AFTER `customDef`, BEFORE `pointsDef`;
  extend the union type.
- createChart: `withAnnotations` method BEFORE `withAxes` (alphabetical),
  required-options signature like `withTitle`.

Then the bounded `src/internal.mts` conditional: check whether it
re-exports `@/components/index.mjs` wholesale (namespace or star) — if yes,
no edit; if it enumerates named component exports, add the two new
renderers. Nothing else in `internal.mts`.

**Verify**: `pnpm type-check && pnpm test --run` → green.

### Step 5: Zoom-seam test (both features)

Locate the existing points zoom-seam test (from plan 016):
`rg -l "onZoomRedraw" src --glob "*test*"`. Mirror its structure to add
cases asserting that after calling the def's `onZoomRedraw` with new
scales, `g.reference-line` / `g.annotation` positions match the NEW scales
(e.g. a horizontal line's `y1` equals `newY(value)`). Cover: one reference
line (horizontal or vertical) and one annotation with connector.

If no such file exists (drift), write the equivalent against the def
objects directly: import `referenceLinesDef`/`annotationsDef`, build a
minimal mock `FeatureRenderContext` (jsdom DOM + linear scales + flags +
state with the options), call `render` then `onZoomRedraw`.

**Verify**: `pnpm test --run` → green, new cases included.

### Step 6: Docs + AGENTS.md + plans/README.md

- `docs/api-reference.md` — add `withReferenceLines` and `withAnnotations`
  sections following the file's existing per-feature format (read it first;
  match its heading level, signature block, and options-table style).
- `AGENTS.md` — update the single registry-order line
  ("axes → grid → title → ... → points") to the new order with
  referenceLines after grid and annotations before points. Do not reword
  anything else.
- `plans/README.md` — set this plan's row to DONE.

**Verify**: `pnpm check` → exit 0 end-to-end
(type-check → test → build → lint).

## Test plan

New tests (all listed above): ~10 reference-line cases, ~8 annotation
cases, ~2 zoom-seam cases. Structural pattern:
`src/components/__tests__/grid.test.mts`. Regression safety: the full
existing suite (428+ tests at HEAD) must stay green — these features are
purely additive; any existing-test failure means you broke shared wiring,
revert and re-check the registry insertion points.

## Done criteria

ALL must hold:

- [ ] `pnpm check` exits 0
- [ ] `pnpm test --run` green including new files
  `src/components/__tests__/referenceLines.test.mts` and
  `src/components/__tests__/annotations.test.mts`
- [ ] `rg -n "withReferenceLines|withAnnotations" src/` shows: interface
  declarations in chartTypes.mts, methods in createChart.mts, defs,
  registry entries — and nothing in `src/index.mts`
- [ ] `git status` shows only in-scope files modified
- [ ] `plans/README.md` row for 022 set to DONE

## STOP conditions

Stop and report back (do not improvise) if:

- Drift check shows in-scope files changed since `42b5d56` and the
  excerpts no longer match (especially: `FeatureOptionsMap` absent, def
  files relocated, or `with*` methods now generated rather than
  hand-written).
- `src/components/points.mts` does not reveal a scale-call pattern you can
  mirror, or `asScaleNumber` does not exist in
  `src/utils/scaleCast.mjs`.
- Wiring a feature requires editing files outside the in-scope list (e.g.
  the flags mapping in createChart's `render()` turns out NOT to be
  registry-driven).
- A step's verification fails twice after a reasonable fix attempt
  (including `pnpm lint:fix` for sort-key ordering).
- The zoom-seam test from plan 016 cannot be found AND building a mock
  `FeatureRenderContext` requires touching non-test source files.

## Maintenance notes

- Theme follow-up: promote `--vl-reference-line-*` and `--vl-annotation-*`
  to the `Theme` schema + `applyThemeCssVars` (plan 019 pattern) if users
  ask for themed variants.
- Vertical reference-line labels near the right edge and annotations near
  the plot boundary will clip (content group clip-path) by design; a future
  "keepInside" collision option would change geometry only — the API shape
  accommodates it.
- The deferred "highlighted sections / bands" and "emphasis mode" ideas
  (round-1 D-finding family) would follow this exact recipe: component +
  def + 6 wiring edits.
- Reviewer focus in the PR: registry insertion positions (render order),
  idempotency of both joins, and that zoom tests assert positions against
  the NEW scales, not the original ones.
