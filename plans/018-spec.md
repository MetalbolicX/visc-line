# Plan 018 — Delta Spec: Registry Decomposition

## Goal

Decompose `src/chart/featureRegistry.mts` (519 lines) into per-feature def files so each feature definition lives beside its concern (comparators, renderers, types). The registry file shrinks to a pure import-and-compose module ≤80 lines. Zoom dispatch is extracted from `zoomPanDef.render` into a dedicated module.

## Verification baseline

- `pnpm type-check` → exit 0
- `featureRegistry.mts` = 519 lines (post-017 state)
- `Dimensions` interface duplicated: `src/types/layoutTypes.mts:2` AND `src/chart/featureRegistry.mts:25-31`

---

## 9 Invariants (Spec → Verification)

### Invariant 1: Render order is registry order

**Statement**: `FEATURE_REGISTRY` array order defines the feature render sequence and MUST remain axes → grid → title → legend → tooltip → zoomPan → custom → points.

**Current evidence**: `featureRegistry.mts:494-519` — the `FEATURE_REGISTRY` array lists defs in exactly that order.

**Contract**: Order is unchanged. The array is the single source of truth.

---

### Invariant 2: Zoom participation set is frozen

**Statement**: Exactly axes, grid, points (via `onZoomRedraw`) plus the line redraw participate in zoom; title, legend, tooltip, custom are excluded.

**Current evidence**:
- `axesDef.onZoomRedraw` — `featureRegistry.mts:203-215`
- `gridDef.onZoomRedraw` — `featureRegistry.mts:269-272`
- Points entry `onZoomRedraw` — `featureRegistry.mts:507-510`
- `titleDef`, `legendDef`, `tooltipDef`, `customDef` — no `onZoomRedraw` defined
- Line re-render: `zoomPanDef.render:446-453` (hardcoded, not in registry)

**Contract**: `onZoomRedraw` exists only on axes, grid, points defs. Line re-render happens exactly once in zoom dispatch.

---

### Invariant 3: Zoom dispatch moves out of `zoomPanDef.render`

**Statement**: The `for (const feature of FEATURE_REGISTRY)` loop inside `zoomPanDef.render` (lines 433-453) must not live in a feature definition. Extract to `src/chart/zoomDispatch.mts`.

**Current evidence**: `featureRegistry.mts:432-454` — the entire zoom callback including registry iteration is inline in `zoomPanDef.render`.

**Contract**: `zoomPanDef.render` calls a function from `zoomDispatch.mts`. It does not iterate `FEATURE_REGISTRY` directly.

---

### Invariant 4: Line redraw has ONE call site

**Statement**: `renderLine` is called in two places today: `chartRender.mts:159-166` and `featureRegistry.mts:446-453`. Preferred shape: shared `redrawLine(ctx, content, xScale, yScale)` helper.

**Current evidence**:
- `chartRender.mts:159-166` — direct `renderLine` call
- `featureRegistry.mts:446-453` — inside zoom callback (will be moved to `zoomDispatch.mts`)

**Contract**: Both call sites replaced by `redrawLine(ctx, xScale, yScale)` helper. No direct `renderLine<...>` calls in the zoom dispatch.

---

### Invariant 5: FeatureDefinition contract is unchanged

**Statement**: `FeatureDefinition<K>`, `FeatureKey`, `FeatureRenderContext<T>`, `RenderCallbacks` shapes are identical before/after. Types are relocated to `src/chart/featureContext.mts`.

**Current evidence**:
- `FeatureDefinition<K>` — `featureRegistry.mts:41-72`
- `FeatureKey` — `featureRegistry.mts:77-80`
- `FeatureRenderContext<T>` — `featureRegistry.mts:97-119`
- `RenderCallbacks` — `featureRegistry.mts:122-127` (also in `chartRender.mts:33-47`)

**Contract**: Types re-exported from `featureContext.mts`. `featureRegistry.mts` re-exports them so test imports don't break mid-migration.

---

### Invariant 6: Each def lives beside its concern

**Statement**: Per-feature defs in `src/chart/featureDefs/{axes,grid,title,legend,tooltip,zoomPan,custom,points}.mts`. Comparators in `src/chart/featureComparators.mts`.

**Current evidence**: All 8 defs are inline in `featureRegistry.mts:185-518`. Comparators are inline in each def's `isEqual` field.

**Contract**: Each def is in its own file under `src/chart/featureDefs/`. `featureRegistry.mts` imports and composes them.

---

### Invariant 7: Single `Dimensions` interface

**Statement**: Delete the local `Dimensions` interface in `featureRegistry.mts`. Import from `@/types/layoutTypes.mjs`.

**Current evidence**: Duplicate exists:
- `src/types/layoutTypes.mts:2-8`
- `src/chart/featureRegistry.mts:25-31`

**Contract**: `featureRegistry.mts` imports `Dimensions` from `@/types/layoutTypes.mjs`. No local `interface Dimensions`.

---

### Invariant 8: Idempotency preserved

**Statement**: Every def still selects-before-appending. `clearOptionalNodes` selector/event lists unchanged.

**Current evidence**: Each def's `render` uses D3 selection patterns (`.call()`, `.selectAll().remove()`). `clearSelectors`/`clearEvents` on each def are unchanged.

**Contract**: Def renderers and cleanup selectors are moved verbatim. No behavioral change.

---

### Invariant 9: No public API change

**Statement**: `src/index.mts` and `src/internal.mts` export the same symbols after the change.

**Current evidence**: `src/chart/index.mts` does NOT re-export featureRegistry. `src/index.mts` exports chart builders. No public API touches `featureRegistry.mts` directly.

**Contract**: No exports added or removed from public barrels. `featureRegistry.mts` remains `@internal`.

---

## File Decomposition Map

### Current → Target

| Current file | Target file(s) | Lines (current) |
|---|---|---|
| `src/chart/featureRegistry.mts` | (1) `src/chart/featureContext.mts` (types) | 519 → ≤80 |
| | (2) `src/chart/featureComparators.mts` (comparators) | new |
| | (3) `src/chart/zoomDispatch.mts` (dispatch loop + redrawLine) | new |
| | (4) `src/chart/redrawLine.mts` (shared helper) OR inlined in zoomDispatch | new |
| | (5) `src/chart/featureDefs/axes.mts` | new |
| | (6) `src/chart/featureDefs/grid.mts` | new |
| | (7) `src/chart/featureDefs/title.mts` | new |
| | (8) `src/chart/featureDefs/legend.mts` | new |
| | (9) `src/chart/featureDefs/tooltip.mts` | new |
| | (10) `src/chart/featureDefs/zoomPan.mts` | new |
| | (11) `src/chart/featureDefs/custom.mts` | new |
| | (12) `src/chart/featureDefs/points.mts` | new |

### File-local helpers to extract

- `resolveEffectiveXTickFormat` — used by `axesDef.render` and `axesDef.onZoomRedraw` → stays in `featureDefs/axes.mts` as file-local
- `renderGridScales` — used by `gridDef.render` and `gridDef.onZoomRedraw` → stays in `featureDefs/grid.mts` as file-local
- `renderPointsAt` — used by points entry → stays in `featureDefs/points.mts` as file-local

### Shared helper signature

```ts
// src/chart/redrawLine.mts
export const redrawLine = <T>(
  ctx: FeatureRenderContext<T>,
  xScale: AnyScale,
  yScale: AnyScale,
): void => { ... }
```

### Zoom dispatch signature

```ts
// src/chart/zoomDispatch.mts
export const createZoomRedrawCallback = (
  ctx: FeatureRenderContext<unknown>,
  dims: Dimensions,
): ((newX: AnyScale, newY: AnyScale) => void) => { ... }
```

### Comparator signatures

```ts
// src/chart/featureComparators.mts
export const areAxesOptionsEqual = (a: unknown, b: unknown): boolean => ...
export const areGridOptionsEqual = (a: unknown, b: unknown): boolean => ...
export const areTitleOptionsEqual = (a: unknown, b: unknown): boolean => ...
export const areLegendOptionsEqual = (a: unknown, b: unknown): boolean => ...
export const areTooltipOptionsEqual = (a: unknown, b: unknown): boolean => ...
export const areZoomPanOptionsEqual = (a: unknown, b: unknown): boolean => ...
```

---

## Open Questions / STOP Triggers

1. **Export policy for per-feature defs**: Per plan, `axesDef`, `gridDef`, etc. are NOT exported from their modules — consumers must go through `FEATURE_REGISTRY`. This is safe because no external consumer imports individual defs (grep verified: `featureRegistry.mts` and `featureDefs/` are the only matches for def references).

2. **`RenderCallbacks` duplication**: `RenderCallbacks` exists in both `chartRender.mts:33-47` and `featureRegistry.mts:122-127`. After extracting types to `featureContext.mts`, the one in `chartRender.mts` can be removed and imported from `featureContext.mts`.

3. **Plan 020 dead-export cleanup**: Depends on this plan. After decomposition, the now-unused exports from `featureRegistry.mts` (if any) will be cleaned up by plan 020.

---

## Out of Scope

- `FEATURE_REGISTRY` order unchanged
- `FeatureKey` union unchanged
- `FeatureDefinition<K>` public shape unchanged
- `FeatureOptionsMap` unchanged
- Component renderer signatures unchanged
- Public API (`src/index.mts`, `src/internal.mts`) unchanged
- Plan 020 (dead-export cleanup)
- Plan 021 (AGENTS.md render-flow docs update)

---

## Test Coverage

Existing tests cover the invariants:
- `src/chart/__tests__/chartRender.test.mts` — render order, line call
- `src/chart/__tests__/pointsZoom.test.mts` — zoom participation (axes, grid, points)
- `src/chart/__tests__/chartState.test.mts` — registry composition
- Characterization suite (plans 001/002) — DOM idempotency

No new assertions needed. Import paths in tests will be updated.
