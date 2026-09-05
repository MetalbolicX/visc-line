# Plan 025: Honest missing-data rendering — gap policy via line.defined()

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**:
> `git diff --stat ca94562..HEAD -- src/services/dataWrangling.mts src/components/line.mts src/components/points.mts src/chart/chartTypes.mts src/chart/createChart.mts src/chart/chartRender.mts src/chart/redrawLine.mts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: none (independent of 024, but land 024 first — both are
  P1 correctness fixes and 024 is smaller)
- **Category**: bug
- **Planned at**: commit `ca94562`, 2026-09-04
- **Methodology**: strict TDD — characterization test pinning today's bridging
  behavior, then the failing test for the new default, then the fix.

## Why this matters

For time series, the truth of the data includes its gaps. Today
`processNumericData` **removes** rows whose x or y is invalid
(`src/services/dataWrangling.mts:38-40`), so `d3.line()` receives a shorter,
contiguous array and draws a straight segment connecting the two surviving
neighbors — the chart silently claims a value existed where none was
measured. For a library whose stated purpose is honest explanatory charts
("storytelling with data"), bridging gaps by default is a correctness lie.
D3's built-in mechanism for this is `line.defined()`: keep the row, skip the
segment. This plan adds a `gapPolicy` option — `"break"` (new default, uses
`.defined()`) and `"bridge"` (current behavior, opt-in) — so consumers
choose explicitly, and the default is the honest one.

## Current state

Facts verified verbatim at `ca94562`.

### Where invalid data is dropped — `src/services/dataWrangling.mts:13-40`

```ts
const isValidNumber = (v: unknown): boolean =>
  v !== null &&
  v !== undefined &&
  (v instanceof Date
    ? !Number.isNaN(v.getTime())
    : !Number.isNaN(Number(v)) && Number.isFinite(Number(v)));

export const processNumericData = <T,>(
  rawData: readonly T[],
  xAccessor: (d: T) => unknown,
  yAccessor: (d: T) => unknown,
): readonly T[] =>
  rawData.filter(
    (d) => isValidNumber(xAccessor(d)) && isValidNumber(yAccessor(d)),
  );
```

`processAllSeries` (`:54-62`) maps every series through this filter, so by
the time data reaches renderers, invalid rows are gone and no renderer can
distinguish "gap in measurements" from "continuous data".

### Where the bridge is drawn — `src/components/line.mts:70-76`

```ts
  const buildPath = (serie: ProcessedSeries<T>): null | string =>
    line<T>()
      .curve(curveFactory)
      .x((d) => asScaleNumber(xScale)(xAccessor(d)))
      .y((d) => asScaleNumber(yScale)(serie.accessor(d)))(
      serie.data,
    );
```

No `.defined()` call. `serie.data` is already filtered, so the line connects
across any missing interval. The same filtered data feeds
`renderPoints` (`src/components/points.mts`) and the tooltip bisector
(`src/interactivity/tooltip.mts`) — both are fine with filtered data and
must KEEP receiving filtered data (a point at a missing y is meaningless;
the tooltip bisector needs clean arrays).

### Where extents come from

`getMultiSeriesExtents` (`dataWrangling.mts:110-132`) runs `d3.extent` over
each series' `data`. It must continue to receive gap-free arrays (NaN in the
extent input would corrupt domains).

### Public options surface — `src/chart/chartTypes.mts:41-47`

```ts
export interface ChartOptions {
  readonly curve?: CurveFactory | CurvePreset;
  readonly margins?: Margins;
  readonly theme?: Partial<Theme>;
  readonly xType?: ScaleType;
  readonly yLabel?: string;
}
```

`ChartOptions` is destructured in `createChart` (`src/chart/createChart.mts:62-68`)
and its fields are threaded into the render context. `yLabel` is the
precedent to follow for plumbing a new scalar option (see
`FeatureRenderContext.yLabel` at `src/chart/featureContext.mts:100` and its
use in the axes def).

### Render flow constraint (from AGENTS.md — honored by this plan)

`renderLine` is called by the shared `redrawLine` helper
(`src/chart/redrawLine.mts`) from BOTH the render loop
(`src/chart/chartRender.mts:159-163`) and the zoom dispatcher
(`src/chart/zoomDispatch.mts`). Any change to how the line generator is
built must flow through that one helper so both paths behave identically.

## Design decision (settled — do not reopen)

- New `ChartOptions` field: `readonly gapPolicy?: "break" | "bridge";`
- **Default: `"break"`** — the honest rendering. This is a deliberate
  behavior change for existing consumers; the API reference gains a
  migration note ("previously invalid points were dropped and the line
  bridged the gap; pass `gapPolicy: 'bridge'` to restore that").
- Implementation shape: when `gapPolicy === "break"`, `processAllSeries`
  keeps rows whose **x** is valid regardless of y, and the line generator
  gets `.defined((d) => isValidNumber(serie.accessor(d)))`. Points, tooltip,
  and extents continue to use y-filtered arrays.
- Per-series override is OUT of scope (YAGNI until requested).

## Commands you will need

| Purpose   | Command                                            | Expected on success         |
|-----------|----------------------------------------------------|-----------------------------|
| Typecheck | `pnpm type-check`                                  | exit 0, no errors           |
| Tests     | `pnpm exec vitest run`                             | all pass (429 at `ca94562`) |
| One file  | `pnpm exec vitest run <path>`                      | all pass                    |
| Lint      | `pnpm lint`                                        | exit 0                      |
| Build     | `pnpm build`                                       | exit 0                      |

Do NOT use bare `pnpm test` (watch mode hangs on non-TTY). Full suite ~190s —
pass a shell timeout of at least 300000 ms.

## Scope

**In scope** (the only files you should modify):

- `src/services/dataWrangling.mts` — add an x-only processing variant
- `src/services/__tests__/dataWrangling.test.mts` — tests for it
- `src/components/line.mts` — `.defined()` plumbing via `RenderLineOptions`
- `src/components/__tests__/line.test.mts` (or the existing line test file —
  discover its exact name with `ls src/components/__tests__/`) — gap tests
- `src/chart/chartTypes.mts` — `gapPolicy` on `ChartOptions`
- `src/chart/createChart.mts` — destructure + thread the option
- `src/chart/redrawLine.mts` — pass the resolved policy/definedness through
- `src/chart/featureContext.mts` — add the resolved flag to
  `FeatureRenderContext` if the def/zoom path needs it (follow `yLabel`'s
  precedent; if `redrawLine` receives it directly, skip this file)
- `docs/api-reference.md` — document `gapPolicy` + migration note
- `src/chart/__tests__/` — one integration test through `createChart`

**Out of scope**:

- `src/components/points.mts` behavior changes (it must keep receiving
  y-filtered data — no `.defined()` equivalent needed if its input stays
  filtered).
- `src/interactivity/tooltip.mts` — tooltip data stays y-filtered.
- Per-series gap policies, interpolation modes (`"interpolate"`), or any
  curve changes.
- The Date-domain bug (plan 024).

## Git workflow

- Branch: `advisor/025-gap-policy`
- Commits: conventional, e.g. `test(line): pin gap-bridging characterization`,
  `feat(chart): add gapPolicy option with .defined() breaks`.
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Pin current behavior (characterization, green)

In the existing line test file, add a test: series data
`[{x:1,y:1},{x:2,y:NaN},{x:3,y:3}]` processed through `processAllSeries` and
rendered via `renderLine` produces a single `<path>` whose `d` attribute
contains exactly ONE `M` (moveTo) command — i.e. one continuous segment.
This test PASSES today and documents the old default.

**Verify**: `pnpm exec vitest run src/components/__tests__` → all pass.

### Step 2: Add the failing gap-policy tests (red)

1. Unit (`line.test.mts`): `renderLine` with the new `definedY` option (see
   Step 3 signature) and data containing a NaN-y row produces a path whose
   `d` contains TWO `M` commands (the segment breaks).
2. Service (`dataWrangling.test.mts`): new x-only processing function keeps
   rows with valid x and invalid y (length 3 for the fixture above), while
   rows with invalid x are still dropped.
3. Integration (`src/chart/__tests__/`): `createChart` with default options
   and gapped data renders a path with two `M` commands; the same chart with
   `gapPolicy: "bridge"` renders one `M`.

**Verify**: `pnpm exec vitest run` → the new tests FAIL, old ones pass.

### Step 3: Implement

1. `dataWrangling.mts`: add `processNumericDataXOnly` (same shape as
   `processNumericData`, filtering on x validity only) and export a
   `processAllSeries`-variant or an options parameter — executor's choice,
   but keep the existing exported names/signatures intact (they are
   re-exported via `src/internal.mts`).
2. `line.mts`: extend `RenderLineOptions` with
   `readonly definedY?: (d: T) => boolean` — wait: `RenderLineOptions` is not
   generic today. The cleanest minimal change: add
   `readonly defined?: (d: unknown) => boolean` and apply
   `.defined(defined)` only when provided. Mirror D3 semantics: omitted =
   everything defined (current behavior).
3. `chartTypes.mts`: add `readonly gapPolicy?: "break" | "bridge"` to
   `ChartOptions` with JSDoc stating the default (`"break"`) and the
   migration note.
4. `createChart.mts`: destructure `gapPolicy = "break"`, compute the
   per-series y-validity predicate, and pass it into the render path. When
   `"break"`, the series fed to `renderLine` must be the x-only-filtered
   arrays; extents/points/tooltip keep using the y-filtered arrays (they are
   derived from `allSeries`/`currentSeries` — the state arrays stay
   y-filtered; derive the x-only arrays ONLY for the line render call inside
   `redrawLine` or `chartRender`, whichever is the single choke point).
5. `redrawLine.mts`: thread the `defined` predicate so the zoom path gets
   identical gap behavior.

**Verify**: `pnpm exec vitest run` → all pass. `pnpm type-check` → exit 0.

### Step 4: Docs

`docs/api-reference.md`: add `gapPolicy` to the `createChart` options
documentation (section "### `createChart`", line ~9), including the migration
note and a one-line rationale (missing measurements should be visible as
gaps, not invented).

**Verify**: `pnpm lint && pnpm build` → exit 0.

## Test plan

- Characterization: single-`M` path for bridged gaps (kept green under
  `gapPolicy: "bridge"`).
- Regression: two-`M` path for default `"break"` at unit and integration level.
- Edge cases: all-y-invalid series under `"break"` (path `d` is null/empty —
  assert no crash); gap at series start and at series end (`.defined()` clips
  ends, no phantom segments); single valid point between gaps (no visible
  segment, no crash).
- Model after `src/components/__tests__/grid.test.mts` for component
  characterization style.
- Verification: `pnpm exec vitest run` → all pass, ~5 new tests.

## Done criteria

- [ ] `pnpm type-check` exits 0
- [ ] `pnpm exec vitest run` exits 0; new gap-policy tests exist and pass
- [ ] Default `createChart` with gapped data renders a broken path (2+ `M`)
- [ ] `gapPolicy: "bridge"` reproduces the old continuous path (1 `M`)
- [ ] Points and tooltip behavior unchanged (existing tests pass unmodified)
- [ ] `docs/api-reference.md` documents the option and migration note
- [ ] `pnpm lint` and `pnpm build` exit 0
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The excerpts in "Current state" don't match the live code (drift).
- Keeping points/tooltip on y-filtered data while the line uses x-only data
  turns out to require re-plumbing `ChartState.currentSeries` itself (that
  would be a design change — report instead of doing it).
- The zoom path cannot receive the `defined` predicate without changing the
  `FeatureDefinition` contract in `featureContext.mts`.
- Any existing test can only be kept green by weakening its assertions.

## Maintenance notes

- If a future "interpolate" policy is requested, the seam is the same
  `defined` predicate plus a curve choice — this plan's plumbing is the
  extension point.
- A reviewer should scrutinize: (1) that points/tooltip/extents still see
  y-filtered arrays (no NaN leaking into domains or bisectors), (2) that the
  zoom redraw path uses the identical predicate, (3) the default flip is
  loudly documented.
- Explicitly deferred: per-series gap policy; interpolation modes; marking
  gaps with a visual indicator (e.g. dashed connector) — all YAGNI until a
  consumer asks.
