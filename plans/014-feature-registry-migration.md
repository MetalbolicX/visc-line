# Plan 014: Migrate features to FeatureDefinition registry (one per commit)

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 5860f3e..HEAD -- src/chart/`
> Plans 006–008 edited `createChart.mts` and `chartRender.mts`; line numbers
> below have drifted. Re-locate by symbol. If the structural description
> no longer holds, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: L (8 features × careful migration + characterization suite green after each)
- **Risk**: MED (touches the central dispatch path; characterization suite is the contract)
- **Depends on**: plans/002-characterization-suite.md, plans/006-builder-correctness.md, plans/009-component-consolidation.md, plans/012-feature-registry-design.md
- **Category**: tech-debt
- **Planned at**: commit `5860f3e`, 2026-09-01

## Why this matters

Adding one feature today requires ~8 lockstep edits across `chartState.mts`,
`chartTypes.mts`, `optionComparators.mts`, `createChart.mts`,
`chartLifecycle.mts`, and `chartRender.mts` (twice — initial dispatch +
zoom dispatch). Miss one and the feature silently fails to toggle.

Plan 012's spike produced the design document
(`docs/design/feature-registry.md` on `spike/012-feature-registry`) with
a PROCEED recommendation and a skeleton `FeatureDefinition` interface.
This plan executes that design: replace the lockstep pattern with the
registry, migrating one feature per commit so the characterization suite
stays green after every step.

## Current state

- Plan 012 spike on `spike/012-feature-registry`:
  - `src/chart/featureRegistry.mts` (164 lines) — defines `FeatureDefinition<K>`,
    `FeatureKey`, `FeatureOptionsMap`, `FeatureRenderContext`, `Dimensions`,
    and a `FEATURE_REGISTRY` array with grid-only entry. **Typing has an `any`
    escape hatch in `isEqual`** — this plan MUST resolve it via a proper generic
    constraint (the design doc documents the approach).
  - `docs/design/feature-registry.md` (317 lines) — the design doc. The
    migration skeleton (section 7) is the per-feature step list this plan
    executes.
- The consolidated axis renderer from plan 009 (`axisRenderer.mts`) is
  available on `advisor/009-component-consolidation`; this plan expects that
  branch merged or cherry-picked into the same base this plan branches from.
- Characterization suite from plan 002 is the behavior contract.
- The existing 8 touchpoints (per plan 012's matrix):
  1. `chartState.mts` — `FeatureFlags` + `ChartState` + `getFeatureFlags`
  2. `chartTypes.mts` — six `With*Options` interfaces
  3. `optionComparators.mts` — six comparators
  4. `createChart.mts` — six `with*` methods (same 5-step shape each)
  5. `chartLifecycle.mts` — `clearOptionalNodes` knows every feature's DOM selector
  6. `chartRender.mts` — initial render dispatch per feature
  7. `chartRender.mts` — zoom-path duplicate of that dispatch (with deliberate
     exclusions: title/legend/labels/tooltip/custom excluded)
  8. Export barrels (`src/index.mts`, `src/internal.mts`)

## Commands you will need

| Purpose   | Command | Expected on success |
|-----------|---------|---------------------|
| Tests     | `pnpm test` | all green (characterization suite is the contract) |
| Typecheck | `pnpm type-check` | exit 0 |
| Build     | `pnpm build` | exit 0 |
| Check     | `pnpm check` | exit 0 |

## Scope

**In scope**:
- `src/chart/featureRegistry.mts` — port from the spike branch, resolve the
  `any` typing in `isEqual`, extend the array to all 8 features
- `src/chart/chartState.mts` — replace `getFeatureFlags` with registry iteration
- `src/chart/optionComparators.mts` — DELETE the per-feature comparator exports;
  keep only what's still used (zoomPan's `areZoomPanOptionsEqual` may survive
  if referenced by plan 006's `withCustom` and other builder code; verify
  before deleting)
- `src/chart/createChart.mts` — `with*` methods become 3-line wrappers driven
  by the registry
- `src/chart/chartLifecycle.mts` — `clearOptionalNodes` becomes
  `registry.flatMap((f) => f.clearSelectors).join(", ")`
- `src/chart/chartRender.mts` — initial dispatch + zoom dispatch both iterate
  the registry in order; zoom path filters on `onZoomRedraw !== undefined`
- All existing tests must stay green (no test changes; the characterization
  suite is the safety net)
- `plans/README.md` — mark plan 014 DONE

**Out of scope**:
- Public API changes — `with*` method names and `With*Options` types stay identical
- New features — no axes/grid/points/title/legend/tooltip/zoomPan/custom/visibleSeries additions
- The interactivity modules (`tooltip.mts`, `zoomPan.mts`) — feature registry
  only owns chart-level features
- Merging the spike branch — this plan re-implements the registry in a
  clean mainline history
- Changes to `src/components/` (per-component renderers are already
  consolidated; this plan only changes how they're dispatched)

## Git workflow

- Branch: `advisor/014-registry-migration`, branched from the merge
  base of plans 009 + 011 (or whatever commit has both consolidated
  axis renderers AND the lint baseline — re-derive during execution if
  the lineage changed)
- Commit per step:
  1. `refactor: port FeatureDefinition registry from spike/012 (resolve any-typing)`
  2. `refactor: migrate axes to feature registry`
  3. `refactor: migrate grid to feature registry`
  4. `refactor: migrate points to feature registry`
  5. `refactor: migrate title to feature registry`
  6. `refactor: migrate legend to feature registry`
  7. `refactor: migrate tooltip to feature registry`
  8. `refactor: migrate zoomPan to feature registry`
  9. `refactor: migrate custom to feature registry`
  10. `refactor: migrate visibleSeries to feature registry`
  11. `refactor: delete optionComparators.mts, getFeatureFlags, per-feature clearSelectors`
  12. `chore: mark plan 014 done`
- Do NOT push unless instructed.

## Steps

### Step 1: Port the registry, resolve the `any` typing

Copy `src/chart/featureRegistry.mts` from the spike branch, then replace
the `isEqual: (a: any, b: any) => boolean` with a proper generic
constraint. The design doc's section 2 documents the approach:
use a helper type that aligns `flagKey`, `optionsKey`, and `isEqual`
through the same discriminated union member. If the helper type can't
compile without `any`, try the simpler shape: `isEqual: (a: unknown, b: unknown) => boolean`
with internal narrowing.

**Verify**: `pnpm type-check` exit 0. `pnpm test` green. No behavior change
yet — the registry is defined but not consumed.

### Step 2: Migrate grid (the simplest feature, proof-of-concept)

Wire the existing grid touchpoints to read from `FEATURE_REGISTRY`:

1. `chartState.mts` — grid's flag (`hasGrid`) is now derived from the
   registry entry; remove the explicit field if possible.
2. `optionComparators.mts` — replace `areGridOptionsEqual` with a registry
   lookup.
3. `createChart.mts` — `withGrid` becomes a 3-line wrapper.
4. `chartLifecycle.mts` — grid's selectors come from the registry.
5. `chartRender.mts` — initial dispatch + zoom dispatch read from registry.

**Verify**: `pnpm check` exit 0. Characterization suite green.

### Step 3: Migrate the remaining features, ONE PER COMMIT

For each feature in this order: axes, points, title, legend, tooltip,
zoomPan, custom, visibleSeries. For each:

1. Move the flag, options type reference, comparator behavior, render call,
   DOM selectors, and zoom-path participation to the registry entry.
2. Remove the corresponding code from `chartState.mts`,
   `optionComparators.mts`, `createChart.mts`, `chartLifecycle.mts`,
   `chartRender.mts`.
3. Verify: `pnpm check` exit 0 after each migration.

Per-feature escape hatches (preserve EXACTLY, per the design doc):
- **points**: no-options toggle (the `withPoints()` form has no options
  argument; the registry entry encodes this via an optional
  `hasOptions: false` field or similar)
- **custom**: cleanup contract (`withCustom`'s teardown is called on
  dispose; the registry entry has a `cleanup` field)
- **visibleSeries**: zoom reset (`updateVisibleSeries` triggers a zoom
  reset per plan 006; the registry entry has `onZoomRedraw` behavior)

### Step 4: Delete the lockstep code

After all 8 features are migrated:
- `optionComparators.mts` should be empty or near-empty — verify only the
  plan-006-needed comparators survive, delete the rest.
- `chartState.mts`'s `getFeatureFlags` is replaced by registry iteration.
- `chartLifecycle.mts`'s `clearOptionalNodes` is the registry flatMap.
- Export barrels updated: only the registry + public-facing types are
  re-exported from `src/chart/index.mts`.

**Verify**: `pnpm check` exit 0. `grep -rn "areAxisOptionsEqual\|areGridOptionsEqual\|..." src/`
(except in `optionComparators.mts` if it survives) returns no matches for
the deleted comparators.

### Step 5: Full check

**Verify**: `pnpm check` → exit 0. All 328 tests pass. `pnpm test:e2e`
still passes (if plan 010's harness is on the base).

## Test plan

The characterization suite (plan 002) is the behavior contract. Each
feature migration must keep it green. The e2e harness (plan 010, if on
the base) is the real-browser contract. No new tests needed — this plan
is behavior-preserving.

## Done criteria

- [ ] `pnpm check` exits 0
- [ ] All 8 features migrated to `FEATURE_REGISTRY`
- [ ] `optionComparators.mts` reduced to only what's still used
- [ ] `chartState.mts`'s `getFeatureFlags` deleted (replaced by registry)
- [ ] `chartLifecycle.mts`'s `clearOptionalNodes` is a registry flatMap
- [ ] `chartRender.mts`'s initial dispatch and zoom dispatch both iterate the registry
- [ ] Public API unchanged (all `with*` method names + types identical)
- [ ] No `any` in the registry typing (or only in the explicitly documented escape hatch)
- [ ] Zoom-path exclusions preserved exactly (title/legend/labels/tooltip/custom NOT re-rendered on zoom)
- [ ] Per-feature escape hatches preserved (points' no-options, custom's cleanup, visibleSeries' zoom reset)
- [ ] `plans/README.md` status row updated
- [ ] AGENTS.md's render-flow section updated (registry order is now the truth — the "Render Flow" section needs a rewrite; per plan 012's Maintenance notes)

## STOP conditions

- The registry typing cannot be made strict without `any` and the simpler
  shapes (`unknown` + narrowing) don't satisfy the compiler either — STOP
  and report the typing wall. The design needs rework, not a hack.
- A feature migration breaks the characterization suite in a way that
  isn't trivially a missing-import fix — STOP and report the failing
  cases. The design assumed the lockstep pattern maps cleanly to the
  registry; if it doesn't, that's a design signal.
- Migrating a feature requires a public API change (renaming a `with*`
  method, changing a `With*Options` type, changing a state field name) —
  STOP and report. This plan promises public-API preservation.
- Plan 009's consolidated axis renderer is NOT present on the base — STOP
  and report. The migration order depends on which branches have merged.
- Plan 010's e2e harness is not on the base AND its absence blocks the
  zoom-path verification (real-browser check that the registry-driven zoom
  still excludes the right features) — STOP and report. The e2e proof
  may need to wait for a follow-up plan.

## Maintenance notes

- `AGENTS.md`'s "Render Flow" section needs a rewrite once this lands:
  the sequence becomes registry-order, and that doc is the executor's bible.
  Update it in this plan's final commit.
- Future feature additions become "add one entry to FEATURE_REGISTRY,
  write a characterization test, done" — that simplicity is the entire
  point of this plan.
- If a future plan adds per-feature custom lifecycle hooks (e.g.,
  `onUpdate`, `onDispose`), extend `FeatureDefinition` rather than
  re-introducing lockstep edits.
