# Plan 030: End-of-line direct labels with explicit collision policy

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**:
> `git diff --stat ca94562..HEAD -- src/chart src/components docs/api-reference.md AGENTS.md tests/e2e`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition. NOTE: plans 022/027/029 may have
> landed first — this plan assumes the registry contract from 022's era; the
> registry-order excerpt below includes 022's features but this plan does not
> depend on them.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED
- **Depends on**: plans/024-date-domain-fallback-fix.md (labels are anchored
  through the scales — the Date-domain bug must be fixed first or
  Date-x charts get labels in the wrong place). Soft dependency on
  plans/026-timeseries-data-contract.md (sorted series make "last point"
  well-defined; this plan computes max-x defensively anyway).
- **Category**: feature (storytelling primitive)
- **Planned at**: commit `ca94562`, 2026-09-04
- **Methodology**: component-first TDD (mirrors plan 022's proven pattern) —
  component + characterization test while the tree stays green, then registry
  wiring, then a browser e2e scenario for collision physics.

## Why this matters

*Storytelling with Data* prefers direct labeling over legends: a legend
forces the reader's eye to bounce between a key and the lines; a label at the
end of each line puts the answer where the question is. This matters MOST for
static output — a chart printed in a report has no tooltip and no hover, so
direct labels and annotations carry the entire explanatory load. Legends
remain the right tool for interactive charts with many series, or when labels
genuinely cannot be placed without overlapping. The owner's design question —
"what happens when endpoints are too close?" — is answered by an explicit
collision policy (below): the library NEVER renders overlapping labels, and
the consumer chooses the degradation strategy.

## Current state

Facts verified at `ca94562`.

### The feature registry contract (add one def + one entry)

`src/chart/featureContext.mts:28-77` — `FeatureDefinition<K>`:

```ts
export interface FeatureDefinition<K extends FeatureKey> {
  readonly clearEvents?: readonly string[];
  readonly clearSelectors: readonly string[];
  readonly flagKey: keyof FeatureFlags;
  readonly isEqual: (a: unknown, b: unknown) => boolean;
  readonly key: K;
  readonly onZoomRedraw?: (ctx, dims, newX, newY) => void;
  readonly optionsKey: keyof ChartState<unknown>;
  readonly render: (ctx, dims) => void;
}
```

`FeatureKey` union at `:62-65`; `FeatureOptionsMap` at `:68-77`. Exemplar def
files to mirror: `src/chart/featureDefs/grid.mts` (54 lines, participates in
zoom) and `src/chart/featureDefs/points.mts` (48 lines). Registry order at
`ca94562` (pre-022 merge) is
`axes → grid → title → legend → tooltip → zoomPan → custom → points`
(`src/chart/featureRegistry.mts`); after plan 027 merges 022 it becomes
`axes → grid → referenceLines → title → legend → tooltip → zoomPan → custom → annotations → points`.
**End labels render LAST** (above everything, including points) — append
`endLabels` at the end of `FEATURE_REGISTRY` whatever its exact composition
is at execution time.

### Per-feature wiring files (all hand-written, all must be touched)

From plan 022's proven checklist: `chartTypes.mts` (options interface +
`withEndLabels` on `ChartInstance`), `chartState.mts` (`hasEndLabels` flag +
`endLabelsOptions`), `featureContext.mts` (`FeatureKey`, `FeatureOptionsMap`),
`featureComparators.mts` (shallow comparator), `featureDefs/endLabels.mts`
(new), `featureRegistry.mts` (entry), `createChart.mts` (fluent method +
state init), `src/components/endLabels.mts` (new renderer),
`src/components/index.mts` (re-export). Bump the flag-count assertion in
`src/chart/__tests__/chartState.test.mts` (022 bumped it 8→10; discover the
current number with `grep -n "toBe" src/chart/__tests__/chartState.test.mts`).

### Render context available to the def

`FeatureRenderContext` (`featureContext.mts:80-102`) provides `content`
(clip-path group), `xScale`, `yScale`, `state.currentSeries`,
`config.xSerie.accessor`, `flags`, `resolvedCurve`, etc. Labels anchor at
each series' **maximum-x datum**: `xScale(xAccessor(lastDatum)) + offset`,
`yScale(serie.accessor(lastDatum))`.

### Theme tokens for labels exist

`Theme.label` (`src/types/themeTypes.mts:61-66`): `color`, `fontSize`,
`fontWeight`, `padding` — currently used by axis labels. Reuse it; add an
`endLabels` token ONLY if the def genuinely needs distinct styling (YAGNI
check at implementation time).

### Zoom participation

End labels are data-anchored → they MUST define `onZoomRedraw` (mirror
`pointsDef.onZoomRedraw` at `src/chart/featureDefs/points.mts:37-40`).

### jsdom limitation (load-bearing for the test strategy)

jsdom does NOT implement `getBBox()`. Unit tests must stub
`SVGTextElement.prototype.getBBox` (pattern: save original in `beforeEach`,
restore in `afterEach`) to return controllable rects. Real collision physics
are verified in the browser e2e scenario (Step 4), not in jsdom.

### E2E harness pattern

`tests/e2e/harness.html` + `tests/e2e/README.md` (scenarios A–F, plan 027
adds G). The driver recipe (system Chromium + `playwright-cli` CDP attach,
Alpine specifics, kill -9 caveat) is fully documented in
`tests/e2e/README.md:9-44` — follow it verbatim.

## Design decisions (settled with the owner's input — do not reopen)

- **API**: `withEndLabels(options?: WithEndLabelsOptions)` where
  ```ts
  interface WithEndLabelsOptions {
    /** Collision strategy when label boxes overlap. Default: "nudge". */
    readonly collision?: "hide" | "legend" | "nudge";
    /** Custom label text per series; default: the series label. */
    readonly format?: (label: string, lastValue: number) => string;
    /** Horizontal offset in px from the line end. Default: 8. */
    readonly offset?: number;
  }
  ```
- **Invariant**: the library NEVER emits overlapping labels. Degeneration is
  always to FEWER labels, never to a pile of unreadable text.
- **`"nudge"`** (default): after rendering, measure each label via
  `getBBox()`, sort by y, push overlapping pairs apart vertically with a
  minimum gap of one line-height, clamped to the content bounds. Pairs that
  still overlap after nudging → the lower-priority label (later in series
  order) is removed and a single `console.warn` names the dropped labels.
- **`"hide"`**: skip any label whose initial position overlaps another;
  no nudging. Quiet, deterministic.
- **`"legend"`**: if ANY collision is detected, render NO end labels and emit
  one `console.warn` advising the consumer to use `withLegend` instead. The
  library deliberately does NOT auto-add a legend — silently changing chart
  semantics is worse than a warning. (This is the owner's requested fallback
  for dense charts and printed reports where a legend is acceptable.)
- **Print/static guidance** goes in the docs: for reports, prefer
  `withEndLabels` + `withAnnotations` over legend+tooltip; if endpoints
  cluster, use `collision: "legend"` (or 029's `withFocus` to declutter
  first).
- **Interaction with plan 029**: when focus is active, only FOCUSED series
  get end labels (dimmed context series lose theirs). If 029 has not landed,
  implement without this rule and leave a `// TODO(plan 029)` marker.

## Commands you will need

| Purpose   | Command                                            | Expected on success         |
|-----------|----------------------------------------------------|-----------------------------|
| Typecheck | `pnpm type-check`                                  | exit 0                      |
| Tests     | `pnpm exec vitest run`                             | all pass                    |
| One file  | `pnpm exec vitest run <path>`                      | all pass                    |
| Lint      | `pnpm lint`                                        | exit 0                      |
| Build     | `pnpm build`                                       | exit 0                      |
| e2e       | `tests/e2e/README.md` recipe                       | new scenario passes         |

Do NOT use bare `pnpm test` (watch mode hangs on non-TTY). Full suite ~190s —
pass a shell timeout of at least 300000 ms.

## Scope

**In scope** (the only files you should modify):

- `src/components/endLabels.mts` (new) + `src/components/__tests__/endLabels.test.mts` (new)
- `src/components/index.mts` (re-export)
- `src/chart/featureDefs/endLabels.mts` (new)
- `src/chart/chartTypes.mts`, `src/chart/chartState.mts`,
  `src/chart/featureContext.mts`, `src/chart/featureComparators.mts`,
  `src/chart/featureRegistry.mts`, `src/chart/createChart.mts`
- `src/chart/__tests__/chartState.test.mts` (fixture + flag-count bump —
  unavoidable when ChartState grows, same as plan 022 did)
- `src/chart/__tests__/` — one zoom-seam test file (mirror plan 016's
  `pointsZoom.test.mts` pattern)
- `docs/api-reference.md`, `AGENTS.md` (registry-order line)
- `tests/e2e/harness.html`, `tests/e2e/README.md` (scenario H)

**Out of scope**:

- Labels at arbitrary points, leader lines, callout boxes (that's the
  annotations feature's job, plan 022).
- Force-simulation or d3-labeler-style global layout — bounded vertical
  nudging only.
- Auto-adding a legend on collision.
- Rotated/vertical labels, label backgrounds/halos.
- `src/index.mts` — feature defs are internal-only (plan 020's invariant).

## Git workflow

- Branch: `advisor/030-end-labels`
- Commits: conventional, component-first sequence
  (`feat(components): add renderEndLabels with collision policies` →
  `feat(chart): wire endLabels feature into registry`).
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Component + characterization test (tree stays green)

Create `src/components/endLabels.mts`: pure renderer
`renderEndLabels(content, series, xScale, yScale, xAccessor, options)`.
Idempotent (select-then-join by `text.end-label--<label>`, class pattern
mirrors `line.mts:93`). Computes last datum per series as the element with
maximum coerced x (`Number(xAccessor(d))` — do NOT assume sorted input).
Renders `text` at `(x + offset, y)`, `dominant-baseline="middle"`, style via
`var(--vl-label-*)` tokens. Then applies the collision policy (pure function
`resolveCollisions(labels: {node, y, height}[], policy, bounds)` is
recommended for testability — it can be unit-tested with fake rects without
jsdom's getBBox).

Characterization test: 2 well-separated series → 2 labels at expected x/y;
`format` override changes text.

**Verify**: `pnpm exec vitest run src/components/__tests__/endLabels.test.mts`
→ all pass. Full suite still green.

### Step 2: Collision policy unit tests (red → green)

Stub `getBBox` (or test `resolveCollisions` directly with fake rects):

1. Two overlapping labels, `"nudge"` → second label's y moved ≥ one
   line-height; no overlap remains.
2. Three labels that cannot all fit within bounds, `"nudge"` → the
   unresolvable one removed + one `console.warn`.
3. `"hide"` → overlapping labels absent, non-overlapping present, no warn.
4. `"legend"` with a collision → zero labels rendered + one warn mentioning
   `withLegend`.
5. `"legend"` without collision → labels render normally.

**Verify**: new tests fail before implementation, pass after.

### Step 3: Registry wiring

Mirror plan 022's file checklist (see "Current state"): options interface,
state flag+options, comparator, def with `render` + `onZoomRedraw`, registry
entry appended LAST, fluent `withEndLabels` on `createChart`, chartState test
fixture bump.

**Verify**: `pnpm type-check` → exit 0. New zoom-seam test (mirror
`pointsZoom.test.mts`): after a simulated zoom redraw, label positions are
recomputed from the new scales. `pnpm exec vitest run` → all pass.

### Step 4: e2e scenario H (real collision physics)

Extend `tests/e2e/harness.html` with a chart whose two series converge at
nearly the same final y; add `withEndLabels()` and a second chart with
`collision: "legend"`. Drive via the documented CDP recipe. Assert: chart 1
shows 2 labels with DIFFERENT `y` attributes (nudge worked) whose
`getBBox()` rects do not intersect (compute in-page via
`playwright-cli -s=cdp eval`); chart 2 shows 0 labels. Record REAL measured
values in a new Live-Verified Outputs row.

**Verify**: README scenario H table row recorded with live PASS values.

### Step 5: Docs + AGENTS.md

`docs/api-reference.md`: new `withEndLabels` section with the collision
policy table and the print/static guidance paragraph. `AGENTS.md`: update
the registry-order line to end with `... → points → endLabels`.

**Verify**: `pnpm lint && pnpm build` → exit 0.

## Test plan

- Component characterization (positions, format, idempotent re-render).
- Collision policy matrix (the 5 tests in Step 2).
- Zoom-seam test (positions recomputed on zoom).
- chartState fixture/flag-count update.
- Browser e2e scenario H with real bbox intersection math.
- Verification: `pnpm exec vitest run` → all pass; scenario H PASS recorded.

## Done criteria

- [ ] `pnpm type-check` exits 0
- [ ] `pnpm exec vitest run` exits 0; new component/collision/zoom tests exist and pass
- [ ] `FEATURE_REGISTRY` ends with `endLabels`; AGENTS.md registry-order line updated
- [ ] No overlapping labels are ever rendered (invariant covered by tests 1-4)
- [ ] `docs/api-reference.md` documents the three policies + print guidance
- [ ] e2e scenario H recorded in `tests/e2e/README.md` with live values
- [ ] `pnpm lint` and `pnpm build` exit 0
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The registry contract in "Current state" doesn't match (drift — e.g. 022
  merged with different wiring than documented).
- `getBBox` stubbing proves impossible AND `resolveCollisions` cannot be
  extracted as a pure function (report the constraint collision).
- The zoom path cannot reach the labels without changing the
  `FeatureDefinition` interface.
- Scenario H reveals that nudging inside the clip-path bounds is impossible
  for the fixture (labels clipped) — report; likely resolution is rendering
  labels into `bounds` instead of `content`, which is a design decision for
  the reviewer, not the executor.
- The Date-domain fix (plan 024) has NOT landed and the harness fixture uses
  Date x values (labels would anchor wrong) — use epoch numbers in the
  harness fixture or land 024 first.

## Maintenance notes

- If consumers ask for smarter placement (leader lines, left-side labels for
  right-clipped series), the seam is `resolveCollisions` — keep it pure.
- A reviewer should scrutinize: the never-overlap invariant, the single-warn
  behavior (no console spam on re-render), zoom recomputation, and that
  labels render ABOVE points in DOM order.
- Interaction notes for future plans: with 029 focus, only focused series
  are labeled; with 022 annotations, end labels must not cover annotation
  text (no automatic coordination — document as a known limitation).
- Explicitly deferred: label halos/backgrounds, collision with annotations,
  legend auto-fallback, per-series label opt-out.
