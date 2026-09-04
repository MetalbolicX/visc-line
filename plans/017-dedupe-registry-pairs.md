# Plan 017: Deduplicate render/onZoomRedraw pairs in the feature registry

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat f884f20..HEAD -- src/chart/featureRegistry.mts`
> If featureRegistry.mts changed since this plan was written (plan 016 WILL have changed
> the points `onZoomRedraw` — that is expected and fine), compare the "Current state"
> excerpts against the live code before proceeding; on any mismatch beyond 016's points
> fix, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: plans/016-points-follow-zoom.md
- **Category**: tech-debt
- **Methodology**: **REFACTOR-UNDER-GREEN** — no new behavior, no strict TDD. The safety
  net is the existing characterization suite (plans 001/002 legacy) plus 016's new
  points-zoom test. Every extraction keeps `pnpm check` green; add characterization
  tests only where a path is uncovered (Step 4).
- **Planned at**: commit `f884f20`, 2026-09-03

## Why this matters

Three features in `featureRegistry.mts` carry near-verbatim duplicated
`render`/`onZoomRedraw` bodies that differ only in which scales they use. This
duplication already produced one real defect (plan 016's frozen points: the points
copy-paste kept the stale scales). Deduplicating removes the bug class: after this plan,
a feature's zoom path cannot silently diverge from its initial path because both
consume the same helper with scales as parameters.

## Current state

All in `src/chart/featureRegistry.mts` (532 lines at planning time):

- **Axes def** — `onZoomRedraw` at 168–188, `render` at 192–226. Both contain this
  verbatim-identical ~12-line block (the only duplicated logic worth extracting):

```ts
const { timeTickFormat, xTickCount, xTickFormat, yTickCount, yTickFormat } =
  ctx.state.axesOptions;
const effectiveXTickFormat:
  | ((domainValue: import("d3").AxisDomain, index: number) => string)
  | undefined =
  ctx.xType === "time" && timeTickFormat !== undefined
    ? typeof timeTickFormat === "string"
      ? (timeFormat(timeTickFormat) as (domainValue: import("d3").AxisDomain, index: number) => string)
      : (timeTickFormat as (domainValue: import("d3").AxisDomain, index: number) => string)
    : xTickFormat;
```

  After it, both call `renderXAxis`/`renderYAxis` — differing only in scale source
  (`newX`/`newY` vs `ctx.xScale`/`ctx.yScale`) and `render` additionally calling
  `renderXAxisLabel`/`renderYAxisLabel`.

- **Grid def** (238–281) — `onZoomRedraw` and `render` differ ONLY in the scales passed
  to `renderXGrid`/`renderYGrid`:

```ts
onZoomRedraw: (ctx, _dims, newX, newY) => {
  if (!ctx.flags.hasGrid) return;
  const { showX = true, showY = true } = ctx.state.gridOptions as WithGridOptions;
  if (showX) { ctx.content.call(renderXGrid, newX, newY); }
  else { ctx.content.selectAll("line.grid-x").remove(); }
  if (showY) { ctx.content.call(renderYGrid, newX, newY); }
  else { ctx.content.selectAll("line.grid-y").remove(); }
},
render: (ctx, _dims) => {
  if (!ctx.flags.hasGrid) return;
  const { showX = true, showY = true } = ctx.state.gridOptions as WithGridOptions;
  if (showX) { ctx.content.call(renderXGrid, ctx.xScale, ctx.yScale); }
  else { ctx.content.selectAll("line.grid-x").remove(); }
  if (showY) { ctx.content.call(renderYGrid, ctx.xScale, ctx.yScale); }
  else { ctx.content.selectAll("line.grid-y").remove(); }
},
```

- **Points entry** (503–531) — after plan 016, `onZoomRedraw` passes `newX`/`newY` and
  `render` passes `ctx.xScale`/`ctx.yScale`; bodies otherwise identical calls to
  `renderPoints(content, series, xScale, yScale, accessor)`.

- Repo conventions that apply: functional rendering, `camelCase` functions, no comments
  unless asked. Renderer imports already at top of file (`renderXAxis` etc., lines 131–140).
  `timeFormat` is already imported from `d3`.

## Commands you will need

| Purpose   | Command                        | Expected on success |
|-----------|--------------------------------|---------------------|
| Tests     | `pnpm test`                    | all pass, before AND after each step |
| Typecheck | `pnpm type-check`              | exit 0              |
| Full gate | `pnpm check`                   | exit 0              |

## Scope

**In scope** (the only files you should modify):
- `src/chart/featureRegistry.mts`
- `src/chart/__tests__/featureRegistry.helpers.test.mts` (create, Step 4 only)

**Out of scope** (do NOT touch):
- `src/components/*.mts` renderers — their signatures stay as-is.
- `src/chart/chartRender.mts`, `src/interactivity/*` — the zoom dispatch itself is plan 018's subject.
- Public API files.
- Behavior: zero intentional behavior change in this plan.

## Git workflow

- Branch: `advisor/017-dedupe-registry-pairs`
- Commit per step: `refactor: extract tick-format resolution for axes`, etc.
- Do NOT push. Update `plans/README.md` row when done.

## Steps

### Step 1: Extract the axes tick-format resolution

Add a file-local helper above `axesDef` in `src/chart/featureRegistry.mts`:

```ts
type TickFormat = (domainValue: import("d3").AxisDomain, index: number) => string;

const resolveEffectiveXTickFormat = (
  xType: ScaleType,
  axesOptions: WithAxesOptions,
): TickFormat | undefined =>
  xType === "time" && axesOptions.timeTickFormat !== undefined
    ? typeof axesOptions.timeTickFormat === "string"
      ? (timeFormat(axesOptions.timeTickFormat) as TickFormat)
      : (axesOptions.timeTickFormat as TickFormat)
    : axesOptions.xTickFormat;
```

Replace the duplicated block in BOTH `axesDef.onZoomRedraw` and `axesDef.render` with:

```ts
const effectiveXTickFormat = resolveEffectiveXTickFormat(ctx.xType, ctx.state.axesOptions);
```

**Verify**: `pnpm type-check` → exit 0; `pnpm test -- timeTickFormat axis` → all pass.

### Step 2: Extract the grid scale-dispatch body

Add a file-local helper above `gridDef`:

```ts
const renderGridScales = (
  content: import("@/types/index.mjs").BoundsSelection,
  xScale: AnyScale,
  yScale: AnyScale,
  gridOptions: WithGridOptions,
): void => {
  const { showX = true, showY = true } = gridOptions;
  if (showX) { content.call(renderXGrid, xScale, yScale); }
  else { content.selectAll("line.grid-x").remove(); }
  if (showY) { content.call(renderYGrid, xScale, yScale); }
  else { content.selectAll("line.grid-y").remove(); }
};
```

Replace both grid bodies with
`renderGridScales(ctx.content, <scales>, ctx.state.gridOptions as WithGridOptions)` —
`newX, newY` in `onZoomRedraw`, `ctx.xScale, ctx.yScale` in `render`.

**Verify**: `pnpm test -- grid` → all pass.

### Step 3: Deduplicate the points pair

Add a file-local helper (near the registry array):

```ts
const renderPointsAt = (
  ctx: FeatureRenderContext<unknown>,
  xScale: AnyScale,
  yScale: AnyScale,
): void => {
  renderPoints(ctx.content, ctx.state.currentSeries, xScale, yScale, ctx.config.xSerie.accessor);
};
```

Both the points entry's `render` and `onZoomRedraw` become:
flag guard + `renderPointsAt(ctx, ctx.xScale, ctx.yScale)` / `renderPointsAt(ctx, newX, newY)`.

**Verify**: `pnpm test -- pointsZoom points` → all pass (016's regression must stay green).

### Step 4: Characterize the tick-format resolution branches (only if uncovered)

Check whether existing tests cover `resolveEffectiveXTickFormat`'s three branches
(non-time scale, time scale + string preset, time scale + function). Search:
`rg -n "timeTickFormat" src/ --type-add 'mts:*.mts' -t mts`. If any branch is
uncovered, add a small direct unit test file `src/chart/__tests__/featureRegistry.helpers.test.mts`
modeled after `src/chart/__tests__/timeTickFormat.test.mts` (141 lines — it already
tests string/function formats through the chart; test the helper directly instead).

**Verify**: `pnpm test` → all pass; every helper branch is executed by at least one test
(`pnpm test -- coverage` optional confirmation).

### Step 5: Full gate + bookkeeping

**Verify**: `pnpm check` → exit 0. Update the 017 row in `plans/README.md` to DONE.

## Test plan

- No new behavior → primary net is the existing suite (all 30 test files) staying green
  after each step.
- New tests ONLY for `resolveEffectiveXTickFormat` branches found uncovered in Step 4.
- 016's `pointsZoom.test.mts` must remain green — it is the guard against reintroducing
  the stale-scales bug during dedup.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `pnpm check` exits 0
- [ ] `rg -n "timeFormat\(timeTickFormat" src/chart/featureRegistry.mts` returns 0 matches (block exists once, inside the helper)
- [ ] `rg -c "renderXGrid" src/chart/featureRegistry.mts` shows calls only inside `renderGridScales`
- [ ] The points entry's two bodies each fit on ~3 lines (guard + helper call)
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated to DONE

## STOP conditions

Stop and report back (do not improvise) if:

- Any previously-green test fails after an extraction (the helpers must be pure
  relocations — a failure means a real behavioral difference; report it).
- The excerpts above don't match live code beyond plan 016's points fix.
- An extraction appears to require changing a renderer signature in `src/components/`.
- You find yourself inventing new abstractions beyond the three specified helpers —
  plan 018 owns the structural decomposition; this plan is extraction-only.

## Maintenance notes

- Plan 018 (registry decomposition) will relocate these helpers alongside their defs —
  keep them file-local and unexported so relocation stays trivial.
- Reviewers: confirm zero `git diff` churn outside the three defs + helper additions.
- The `as WithGridOptions` casts on `ctx.state.gridOptions` are pre-existing; plan 018's
  spec may type them properly — do not fix here.
