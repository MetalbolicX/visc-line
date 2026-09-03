# Plan 012: DESIGN — Registry-driven feature architecture (end the 8-place lockstep edit)

> **Executor instructions**: This is a DESIGN/SPIKE plan, not a build plan.
> You produce a design document and a thin validated prototype (throwaway
> branch), NOT a merged refactor. Follow the steps; verification is
> "document written + prototype demonstrates the pattern + decision
> recorded". If anything in the "STOP conditions" section occurs, stop and
> report. When done, update the status row for this plan in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 5860f3e..HEAD -- src/chart/`
> Plans 006 and 007 edited `createChart.mts`; line numbers below have
> drifted. Re-locate by symbol. If the structural description no longer
> holds, treat it as a STOP condition.

## Status

- **Priority**: P3
- **Effort**: M (design) — the eventual refactor is L and gets its own plan
- **Risk**: MED (design risk contained; no production code changes land)
- **Depends on**: plans/002-characterization-suite.md, plans/006-builder-correctness.md, plans/009-component-consolidation.md
- **Category**: direction
- **Planned at**: commit `5860f3e`, 2026-09-01

## Why this matters

Adding one feature today (say, area fill) requires ~8 lockstep edits:
`chartState.mts` (flag + state + getFeatureFlags), `chartTypes.mts`
(WithXOptions), `optionComparators.mts` (comparator), `createChart.mts`
(`withX` method — one of six near-identical 17-line bodies),
`chartLifecycle.mts` (clearOptionalNodes), `chartRender.mts` (initial
dispatch), `chartRender.mts` again (zoom dispatch), and the export
barrels. Miss one and the feature silently fails to toggle. The zoom
dispatch is itself a copy of the initial dispatch (lines ~278-333 re-issue
axis/grid/line/points renders). This plan designs a registry-driven
architecture where a feature is declared ONCE, and validates the design
with a throwaway prototype before any production refactor is planned.

## Current state (structure, not exact lines — plans 006/007 shifted them)

- `src/chart/chartState.mts` — `FeatureFlags` + `ChartState` + `getFeatureFlags` (~lines 23-71).
- `src/chart/chartTypes.mts` — six `With*Options` interfaces (~39-49).
- `src/chart/optionComparators.mts` — six comparators (~10-174).
- `src/chart/createChart.mts` — six `with*` methods, same shape each (~248-355): `ensureActive() → equality short-circuit → set flag → store options → render() → return chart`.
- `src/chart/chartLifecycle.mts:26-65` — `clearOptionalNodes` knows every feature's DOM selector.
- `src/chart/chartRender.mts:177-232` — initial render dispatch per feature; `:278-333` — the zoom-path DUPLICATE of that dispatch (title/legend/labels/tooltip/custom deliberately excluded there — that exclusion is load-bearing behavior to preserve).
- Safety nets in place by the time this runs: characterization suite (plan 002), builder fixes (plan 006), component consolidation (plan 009).
- Exemplars for registry-shaped designs in the wild: d3's own scale/curve factories (`CURVE_PRESETS` in `src/utils/curveMap.mts` is already a mini-registry — the repo has the pattern internally).

## Commands you will need

| Purpose   | Command | Expected on success |
|-----------|---------|---------------------|
| Tests (prototype branch) | `pnpm test` | all green under prototype |
| Typecheck | `pnpm type-check` | exit 0 |
| Check | `pnpm check` | exit 0 |

## Scope

**In scope**:
- `docs/design/feature-registry.md` (create — the deliverable)
- A throwaway git branch with the prototype (NOT merged; name it `spike/012-feature-registry`)

**Out of scope**:
- Merging any refactor into mainline — that is a follow-up plan written FROM this design.
- Public API changes: `with*` method names and option types stay identical.
- The interactivity modules.

## Git workflow

- Branch: `spike/012-feature-registry` (keep the design doc commit separate from prototype commits).
- Commit: `docs: add feature-registry design (plan 012 spike)`.
- Do NOT push unless instructed. The prototype branch is disposable.

## Steps

### Step 1: Map the feature matrix

In the design doc, tabulate the six existing features (axes, grid, points,
title, legend, tooltip, zoomPan, custom, visibleSeries — note which are
TRUE features vs state mutations) against the 8 touchpoints. For each
feature record: flag name, options type, comparator behavior, render
call(s), DOM selectors for cleanup, zoom-path participation (yes/no —
preserving the current exclusions exactly).

### Step 2: Design the registry shape

Propose a `FeatureDefinition` interface along the lines of:

```ts
interface FeatureDefinition<K extends FeatureKey> {
  key: K;
  flagKey: keyof FeatureFlags;
  optionsKey: keyof ChartState;          // where options are stored
  isEqual: (a: Options[K], b: Options[K]) => boolean;
  render: (ctx: RenderContext) => void;  // initial path
  onZoomRedraw?: (ctx: ZoomContext) => void; // omit = excluded from zoom path
  clearSelectors: string[];              // for clearOptionalNodes
}
```

Design must answer (in the doc): how `with*` methods become 3-line
wrappers iterating the registry; how the render sequence ORDER (AGENTS.md
render flow) is encoded (ordered registry array vs explicit sequence
list); how per-feature custom behavior (points' non-options toggle,
custom's cleanup contract, visibleSeries' zoom reset) stays first-class;
what happens to `getFeatureFlags`.

### Step 3: Prototype one feature end-to-end

On the spike branch, implement the registry + migrate ONE feature (grid —
simplest: options, comparator, render both paths, clear selectors). Run
the full characterization suite against it.

**Verify**: `pnpm check` → exit 0 with grid driven by the registry; all characterization tests green (they assert DOM outcomes, so passing them proves behavior preservation).

### Step 4: Write the migration plan skeleton + decision

In the design doc: (a) estimated effort to migrate the remaining features
(per-feature steps), (b) risks (zoom-path exclusions, comparator
subtleties, public typing), (c) recommendation — proceed/refine/reject
with reasoning. This becomes the input for a future numbered build plan.

**Verify**: `test -f docs/design/feature-registry.md && grep -c "Recommendation" docs/design/feature-registry.md` → ≥ 1.

## Test plan

The characterization suite (plan 002) is the behavior contract; the
prototype must keep it green. No new tests required for a spike — but note
in the doc which characterization cases were load-bearing during the
prototype.

## Done criteria

- [ ] `docs/design/feature-registry.md` exists with the matrix, registry interface, zoom-path rules, migration skeleton, and a Recommendation section
- [ ] Spike branch exists with grid-on-registry prototype; `pnpm check` green there
- [ ] Mainline untouched (`git diff main` shows only the doc if the doc lands)
- [ ] `plans/README.md` status row updated (status DONE means design delivered, not refactor executed)

## STOP conditions

- The grid prototype cannot keep the characterization suite green — the design loses its behavior-preservation proof; report the failing cases.
- The registry typing for discriminated per-feature options degenerates into `any`/casts to satisfy the compiler — the design needs rework; report the exact typing wall.

## Maintenance notes

- The eventual build plan should migrate features one per commit, characterization suite green after each — never a big-bang swap.
- `AGENTS.md`'s render-flow section will need a rewrite when this lands: the sequence becomes registry-order, and that doc is the executor's bible.
