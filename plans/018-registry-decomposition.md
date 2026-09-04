# Plan 018: Decompose featureRegistry.mts via SDD

> **Executor instructions**: This plan is executed as a **Spec-Driven Development
> (SDD)** change: write the delta spec FIRST (requirements inlined in Step 1), then
> implement task-by-task with the full suite green after every task. If SDD tooling
> (skills `sdd-init`, `sdd-propose`, `sdd-spec`, `sdd-tasks`, `sdd-apply`, `sdd-verify`)
> is available in your environment, use it with this plan as the proposal input; if
> not, follow the steps manually — the spec content is inlined below either way.
> Run every verification command before moving on. Honor every STOP condition.
> When done, update the status row for this plan in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat f884f20..HEAD -- src/chart/featureRegistry.mts`
> Plans 016 and 017 are expected to have touched the points entry and extracted three
> file-local helpers (`resolveEffectiveXTickFormat`, `renderGridScales`,
> `renderPointsAt`). Anything else changed → compare excerpts, STOP on mismatch.

## Status

- **Priority**: P2
- **Effort**: L
- **Risk**: MED
- **Depends on**: plans/016-points-follow-zoom.md, plans/017-dedupe-registry-pairs.md
- **Category**: tech-debt (architecture)
- **Methodology**: **SDD** — architectural change with contract invariants that must hold
  across an incremental migration. Spec first, small verifiable tasks, suite green
  between tasks. (Repo precedent: plans 012 DESIGN → 014 BUILD for the registry itself.)
- **Planned at**: commit `f884f20`, 2026-09-03

## Why this matters

`src/chart/featureRegistry.mts` is a 532-line god file mixing six concerns: context
types, option comparators, per-feature render logic, layout math, and — worst — the
**global zoom dispatch loop lives inside one feature's render** (`zoomPanDef.render`),
where it iterates `FEATURE_REGISTRY` and hardcodes `renderLine`. A feature orchestrating
the registry inverts the layering the registry was built to establish. Every feature
change funnels through this one file, and the dual `renderLine` call sites
(`chartRender.mts:159` and `featureRegistry.mts:447`) are a standing trap.

## Current state

- `src/chart/featureRegistry.mts` (532 lines) contains, in order: module doc; local
  `Dimensions` interface (25–31, duplicate of `src/types/layoutTypes.mts:2-8`);
  `FeatureDefinition`/`FeatureKey`/`FeatureOptionsMap`/`FeatureRenderContext` types
  (~36–128); renderer imports (131–140); seven named defs (`axesDef` 150, `gridDef` 238,
  `titleDef` 291, `legendDef` 319, `tooltipDef` 367, `zoomPanDef` 409, `customDef` 472);
  `FEATURE_REGISTRY` array (495–502); anonymous points entry (503–531).
- The zoom dispatch inside `zoomPanDef.render` (`:432-455`):

```ts
onZoom:
  ctx.state.zoomPanOptions.onZoom ??
  ((newX: AnyScale, newY: AnyScale): void => {
    for (const feature of FEATURE_REGISTRY) {
      if (ctx.flags[feature.flagKey] && feature.onZoomRedraw) {
        feature.onZoomRedraw({ ...ctx, allSeriesExtents: ctx.allSeriesExtents } as FeatureRenderContext<unknown>, dims, newX, newY);
      }
    }
    renderLine<unknown>(ctx.content, ctx.state.currentSeries, newX, newY,
      ctx.config.xSerie.accessor,
      { curve: ctx.resolvedCurve, reducedMotion: ctx.reducedMotion });
  }),
```

- Second `renderLine` call site: `src/chart/chartRender.mts:159-166`, immediately before
  the registry render loop (168–176).
- `FEATURE_REGISTRY` consumers: `src/chart/chartLifecycle.mts:4`,
  `src/chart/chartRender.mts:15`, `src/chart/createChart.mts:9` (+ tests).
- Legend layout math inside `legendDef.render` (`:353`):
  `x: ctx.margins.left + dims.innerWidth - LEGEND_WIDTH` (constants imported from
  `chart/chartConstants.mts`).
- Six hand-rolled comparators live inline in the defs (e.g. legend's, `:322-339`).
- `src/chart/index.mts` (12 lines) does NOT re-export featureRegistry — the public and
  internal API surfaces are unaffected by relocation, only by export changes.

## Commands you will need

| Purpose   | Command          | Expected on success |
|-----------|------------------|---------------------|
| Install   | `pnpm install`   | exit 0              |
| Typecheck | `pnpm type-check`| exit 0              |
| Tests     | `pnpm test`      | all pass, after EVERY task |
| Lint      | `pnpm lint`      | exit 0              |
| Full gate | `pnpm check`     | exit 0              |

## Suggested executor toolkit

- SDD skills if available: `sdd-init` (context), `sdd-spec` (delta spec from Step 1),
  `sdd-tasks` (break down Steps 3–7), `sdd-apply`, `sdd-verify`.
- Read `docs/design/` registry design docs (written under plan 012) before Step 1 —
  the spec must stay consistent with the vocabulary they establish
  (`FeatureDefinition`, flag/options keys, render order).

## Scope

**In scope**:
- `src/chart/featureRegistry.mts` (shrink; may end up deleted or import-only)
- New files under `src/chart/` (e.g. `featureComparators.mts`, `featureContext.mts`,
  per-feature def files, `zoomDispatch.mts` — final names per your spec)
- `src/chart/chartRender.mts` (zoom dispatch ownership + renderLine call site)
- `src/chart/createChart.mts`, `src/chart/chartLifecycle.mts` (import path updates only)
- `src/types/layoutTypes.mts` (becomes the single `Dimensions` source)
- Test files: import-path updates only; no assertion changes

**Out of scope** (do NOT touch):
- `src/components/*` renderer function signatures
- `src/interactivity/zoomPan.mts` and `tooltip.mts` internals
- Public API: `src/index.mts` exports, package.json export map, `src/internal.mts`
  barrel contents (it re-exports `chart/index.mts`, which doesn't re-export the
  registry today — keep it that way)
- Behavior: render order, zoom participation set, cleanup semantics — all frozen by
  the spec below

## Git workflow

- Branch: `advisor/018-registry-decomposition`
- Commit per task: `refactor: ...` (match plan 014's migration commit style, e.g.
  `refactor: migrate zoomPan to feature registry`)
- Do NOT push. Update `plans/README.md` row when done.

## Steps

### Step 1: Write the delta spec

Create the spec (via SDD tooling at `openspec/changes/…`, or manually at
`docs/design/registry-decomposition-spec.md` — follow whichever convention the repo
has; if `openspec/` doesn't exist, use the docs path). The spec MUST capture these
invariants as requirements with scenarios:

1. **Render order is registry order**: `FEATURE_REGISTRY` array order defines the
   feature render sequence and MUST remain axes → grid → title → legend → tooltip →
   zoomPan → custom → points (AGENTS.md render flow, step 5).
2. **Zoom participation set is frozen**: exactly axes, grid, points (via
   `onZoomRedraw`) plus the line redraw participate in zoom; title, legend, tooltip,
   custom are excluded (AGENTS.md "Zoom path").
3. **Zoom dispatch moves out of `zoomPanDef.render`**: it becomes chart-level
   orchestration (recommended: `src/chart/zoomDispatch.mts` exporting
   `createZoomRedrawCallback(ctx, dims, callbacks)` consumed by `zoomPanDef` via
   injection). A feature definition must not iterate the registry.
4. **Line redraw has ONE call site**: preferred shape — a shared
   `redrawLine(ctx, content, xScale, yScale)` helper used by both `chartRender` and
   the zoom dispatch. (Alternative considered: a `lineDef` registry entry — REQUIRES a
   `flagKey: keyof FeatureFlags`, i.e. a contract change to FeatureFlags; reject
   unless the spec review says otherwise. Default: helper, no contract change.)
5. **FeatureDefinition contract is unchanged**: same fields, same types, same
   `FeatureRenderContext` shape (relocated to `src/chart/featureContext.mts`, types
   re-exported for internal consumers).
6. **Each def lives beside its concern**: comparators in `featureComparators.mts`;
   per-feature defs in separate files (e.g. `axesDef.mts` in `src/chart/`); the
   registry file reduces to imports + the ordered array + types barrel.
7. **Single `Dimensions`**: delete the local interface in featureRegistry; import from
   `@/types/layoutTypes.mjs`.
8. **Idempotency preserved**: every def still selects-before-appending (AGENTS.md
   "Idempotent Rendering"); `clearOptionalNodes` selector/event lists unchanged.
9. **No public API change**: `src/index.mts` and `src/internal.mts` export the same
   symbols after the change.

Scenario template per requirement: given a chart with features X enabled, when
render/zoom/cleanup runs, then observable DOM/events are identical pre/post
(characterization suite already encodes most of this — name the covering test files).

**Verify**: spec file exists and a second reader (or `sdd-verify` dry run) confirms
each requirement is testable; `pnpm check` still green (no code changed yet).

### Step 2: Freeze the safety net

Run and record the baseline: `pnpm check` → exit 0. Note test count (`pnpm test 2>&1 | tail -5`).
All subsequent tasks must keep this green — this repo's characterization suite
(plans 001/002) is the behavior contract.

**Verify**: baseline recorded in your task notes.

### Step 3: Extract comparators

Move the six `isEqual` implementations to `src/chart/featureComparators.mts` as named
exports (`areAxesOptionsEqual`, `areGridOptionsEqual`, … — match existing naming where
tests already reference it; check `rg -n "areAxesOptionsEqual|areGridOptionsEqual" src/`).
Defs import them. Delete the local `Dimensions` interface (requirement 7).

**Verify**: `pnpm check` → exit 0.

### Step 4: Extract context/def types

Move `FeatureDefinition`, `FeatureKey`, `FeatureRenderContext`, `Dimensions` re-export
to `src/chart/featureContext.mts`. featureRegistry (and later def files) import from
there. Keep type-only re-exports from `featureRegistry.mts` temporarily so test imports
don't break mid-migration.

**Verify**: `pnpm check` → exit 0.

### Step 5: Move the zoom dispatch out of zoomPanDef (requirement 3 + 4)

- Create `redrawLine` shared helper (requirement 4). Replace BOTH call sites:
  `chartRender.mts:159-166` and the dispatch loop.
- Create `src/chart/zoomDispatch.mts` with the registry-iteration callback; `zoomPanDef`
  receives it (via `RenderCallbacks` extension or direct import — spec decides;
  direct import of a `createZoomRedrawCallback(ctx, dims)` factory is simplest).
- `zoomPanDef.render` shrinks to: unbind `.zoom`, build options, `addZoomPan`,
  `onZoomBehaviorChange`.

**Verify**: `pnpm check` → exit 0; `pnpm test -- zoomPan pointsZoom chartRender` → pass.

### Step 6: Relocate per-feature defs

One commit per def, order: grid (simplest, precedent from plan 014) → axes → title →
legend → tooltip → custom → points (name it `pointsDef` at last — fixing the anonymous
entry). Each new file imports its renderers, comparator, and types; featureRegistry
imports the def. Keep `export const axesDef…` names so `FEATURE_REGISTRY` reads as a
pure ordered import list.

**Verify** after EACH relocation: `pnpm check` → exit 0.

### Step 7: Final shape + cleanup

- `featureRegistry.mts` is now: doc comment, imports, `FEATURE_REGISTRY` array,
  (optional) type barrel re-export for tests. Target ≤ 80 lines.
- Remove the temporary type re-exports if tests were migrated to import from
  `featureContext.mjs` (update test import paths — assertion bodies untouched).
- Reconcile with requirement list; every requirement maps to a landed task.

**Verify**: `pnpm check` → exit 0; `wc -l src/chart/featureRegistry.mts` ≤ 80;
`rg -n "renderLine" src/chart/ | grep -v redrawLine` → exactly one call-site file
(the helper).

### Step 8: Bookkeeping

Update the 018 row in `plans/README.md` to DONE.

## Test plan

- No new assertions required — the characterization suite + 016's pointsZoom test ARE
  the spec's verification. If `sdd-verify` is available, run it against the Step 1 spec.
- Test files may receive import-path updates only; any assertion change is a STOP.
- Coverage sanity: `pnpm test -- coverage` before/after — no meaningful drop.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] Spec file exists (openspec change or `docs/design/registry-decomposition-spec.md`) with all 9 requirements
- [ ] `pnpm check` exits 0
- [ ] `wc -l src/chart/featureRegistry.mts` ≤ 80
- [ ] `rg -n "for \(const feature of FEATURE_REGISTRY\)" src/` → matches only in the new dispatch module (and chartRender render loop, unchanged)
- [ ] `rg -n "interface Dimensions" src/` → exactly one match (`src/types/layoutTypes.mts`)
- [ ] `rg -n "renderLine<" src/chart/` → only inside the shared line-redraw helper
- [ ] `pointsDef` is a named export in its own file; no anonymous entries in the registry
- [ ] `git diff --stat` shows no component renderer or public API file modified
- [ ] `plans/README.md` status row updated to DONE

## STOP conditions

Stop and report back (do not improvise) if:

- Any task leaves `pnpm check` red after two fix attempts.
- Keeping the suite green appears to require changing a renderer signature, a public
  export, or an existing test's assertions.
- The spec review (Step 1) rejects the zoom-dispatch extraction shape and no
  injectable alternative is visible without touching `interactivity/zoomPan.mts`
  internals.
- You discover `FEATURE_REGISTRY` order is load-bearing somewhere not documented
  (e.g. a test asserting registry length/order) — surface it before proceeding.
- Effort balloons: if relocation exceeds ~10 commits, stop and reconcile against the
  spec — scope may need splitting into two plans (018a dispatch, 018b relocation).

## Maintenance notes

- Plan 020 (dead-export cleanup) executes after this one — its scope shrinks if defs
  stop being exported from featureRegistry; re-check its grep list there.
- Plan 021 updates AGENTS.md render-flow docs to the final architecture — run it next.
- Reviewers: the riskiest task is Step 5 (zoom dispatch); scrutinize that
  `onZoomBehaviorChange` still fires and `.zoom` unbind semantics are preserved
  (`zoomPanDef` clearEvents `[".zoom"]` unchanged).
- Deferred deliberately: typing `ctx.state.gridOptions` casts, `FeatureOptionsMap`
  deletion (plan 020), any change to the `with*` builder generation.
