# Feature Registry Design — Plan 012

**Spike branch**: `spike/012-feature-registry` (throwaway)  
**Branched from**: `5860f3e`  
**Status**: DESIGN DELIVERED — prototype validated, migration left to future build plan

---

## 1. Feature Matrix

Table of all features × 8 touchpoints. Key:

- **Flag**: `hasX` boolean on `FeatureFlags` / `ChartState`
- **Opts type**: the `WithXOptions` interface (or `null` for stateless features)
- **State slot**: field on `ChartState` where options are stored
- **Comparator**: function in `optionComparators.mts`
- **Initial render**: line/function in `chartRender.mts` (`renderChart`)
- **Zoom-path**: whether feature re-renders on zoom (yes = has `onZoomRedraw`)
- **DOM cleanup selectors**: passed to `clearOptionalNodes` in `chartLifecycle.mts`
- **`with*` method**: the public API entry point
- **Public API**: whether changing this breaks `ChartInstance` interface

| Feature | Flag | Options type | State slot | Comparator | Initial render | Zoom-path | DOM selectors | `with*` | Public API |
|---------|------|-------------|------------|------------|----------------|-----------|---------------|---------|------------|
| axes | `hasAxes` | `WithAxesOptions` | `axesOptions` | `areAxesOptionsEqual` | `chartRender:178–209` | **yes** (`renderXAxis`/`renderYAxis` at 282–296) | `g.x-axis, g.y-axis, text.x-axis-label, text.y-axis-label` | `withAxes` | preserved |
| grid | `hasGrid` | `WithGridOptions` | `gridOptions` | `areGridOptionsEqual` | `chartRender:211–224` | **yes** (`renderXGrid`/`renderYGrid` at 299–312) | `line.grid-x, line.grid-y` | `withGrid` | preserved |
| points | `hasPoints` | `null` (no options) | — | identity check | `chartRender:226–234` | **yes** (`renderPoints` at 326–334) | `g.point-series` | `withPoints` | preserved |
| title | `hasTitle` | `WithTitleOptions \| null` | `titleOptions` | `areTitleOptionsEqual` | `chartRender:251–257` | **NO** | `text.chart-title` | `withTitle` | preserved |
| legend | `hasLegend` | `WithLegendOptions \| null` | `legendOptions` | `areLegendOptionsEqual` | `chartRender:259–272` | **NO** | `g.legend` | `withLegend` | preserved |
| tooltip | `hasTooltip` | `WithTooltipOptions` | `tooltipOptions` | `areTooltipOptionsEqual` | `chartRender:236–249` | **NO** | tooltip cursor/dot lines/circles | `withTooltip` | preserved |
| zoomPan | `hasZoomPan` | `WithZoomPanOptions` | `zoomPanOptions` | `areZoomPanOptionsEqual` | `chartRender:274–342` | **special** (is the zoom handler) | svg `.zoom` handler | `withZoomPan` | preserved |
| custom | `hasCustom` | `CustomCallback \| null` | `customCallback` + `customCleanup` | reference identity | `chartRender:344–356` | **NO** | managed by returned cleanup fn | `withCustom` | preserved |
| visibleSeries | *(not a flag)* | `readonly string[]` | `visibleLabels` (Set) | set-size + membership | `updateVisibleSeries` / `withVisibleSeries` | calls `zoomBehavior?.reset()` | — | `updateVisibleSeries` / `withVisibleSeries` | preserved |

### Zoom-path exclusions (load-bearing behavior)

The following features are **intentionally excluded** from the zoom-path re-render (`chartRender:282–334`):
- title
- legend
- tooltip
- custom

This is a design decision — these features are recomputed from static data and do not need to track zoom transforms. The exclusion is enforced by the conditional `if (context.flags.hasX)` checks in the zoom callback that only cover axes, grid, line, and points.

---

## 2. Registry Shape

### `FeatureDefinition<K>` Interface

```ts
/** Discriminated union key for all registered features */
type FeatureKey =
  | "axes" | "grid" | "points"
  | "title" | "legend" | "tooltip"
  | "zoomPan" | "custom";

/** Options type per feature — discriminated union */
type FeatureOptions =
  | { axes: WithAxesOptions }
  | { grid: WithGridOptions }
  | { points: null }
  | { title: WithTitleOptions | null }
  | { legend: WithLegendOptions | null }
  | { tooltip: WithTooltipOptions }
  | { zoomPan: WithZoomPanOptions }
  | { custom: CustomCallback | null };

interface FeatureDefinition<K extends FeatureKey> {
  /** Unique identifier — used to key into ChartState */
  readonly key: K;
  /** Which boolean flag on FeatureFlags controls this feature */
  readonly flagKey: keyof FeatureFlags;
  /** Which field on ChartState holds the options */
  readonly optionsKey: keyof ChartState;
  /** Shallow-equality check for options */
  readonly isEqual: (a: FeatureOptions[K], b: FeatureOptions[K]) => boolean;
  /** Initial-path render — called during renderChart main flow */
  readonly render: (ctx: RenderContext, dims: Dimensions) => void;
  /**
   * Zoom-path render — called inside the zoom behavior callback.
   * Omit/leave undefined to exclude the feature from zoom re-renders.
   * The zoom callback is built in renderChart; registry entries with
   * onZoomRedraw contribute their conditional block to that callback.
   */
  readonly onZoomRedraw?: (ctx: RenderContext, dims: Dimensions, newX: AnyScale, newY: AnyScale) => void;
  /** CSS selectors passed to clearOptionalNodes for cleanup */
  readonly clearSelectors: readonly string[];
}
```

### Registry Array

```ts
/** Ordered array — the registry IS the render sequence (see §3) */
const FEATURE_REGISTRY: readonly FeatureDefinition<FeatureKey>[] = [
  axesDef,
  gridDef,
  pointsDef,
  titleDef,
  legendDef,
  tooltipDef,
  zoomPanDef,   // zoomPanDef.onZoomRedraw builds the zoom callback body
  customDef,
];
```

### Encoding Per-Feature Escape Hatches

- **points**: the feature has no options (`points: null`). The `withPoints` method skips the equality check and just sets the flag. The `isEqual` field is unused for points.
- **custom**: stores `customCallback` and `customCleanup` on state separately. The `render` function calls the callback and captures the returned cleanup function. `onZoomRedraw` is omitted — custom does not participate in zoom.
- **visibleSeries**: not a feature in the registry — it is a state mutation on `visibleLabels` + `currentSeries` + `zoomBehavior?.reset()`. It does not go through the `with*` pattern.

---

## 3. Render Sequence Encoding

**Decision: ordered registry array.** The registry array order (`axesDef, gridDef, pointsDef, titleDef, legendDef, tooltipDef, zoomPanDef, customDef`) **is** the render sequence. No separate sequence list is needed.

```ts
// In renderChart — simplified:
for (const feature of FEATURE_REGISTRY) {
  if (ctx.flags[feature.flagKey]) {
    feature.render(ctx, dims);
  }
}

// Zoom-path: features with onZoomRedraw contribute their block
// to the zoom callback constructed in chartRender:274+
// The zoomPanDef.onZoomRedraw is special — it constructs the
// callback body that itself conditionally calls other features'
// onZoomRedraw entries.
```

**Rationale**: The registry order is the render order. Adding a new feature means appending to `FEATURE_REGISTRY`. Removing a feature means deleting its entry. The AGENTS.md render-flow section will need a rewrite when this lands — the sequence becomes registry-order rather than an enumerated list.

The alternative (explicit sequence list) was rejected because it introduces a second ordering concern that can drift from the registry array.

---

## 4. `with*` Method Generation

At `createChart` construction time, iterate the registry and assign each `with<Capitalized>` method dynamically:

```ts
const chart: ChartInstance<T> = {
  // ... static members ...
};

for (const feature of FEATURE_REGISTRY) {
  const capitalized = feature.key[0].toUpperCase() + feature.key.slice(1);
  const methodName = `with${capitalized}` as keyof ChartInstance<T>;
  (chart as Record<string, unknown>)[methodName] = (options) => {
    ensureActive();
    const current = state[feature.optionsKey];
    if (state[feature.flagKey] && feature.isEqual(current as Options[K], options as Options[K])) {
      return chart;
    }
    state[feature.flagKey] = true;
    (state as Record<string, unknown>)[feature.optionsKey] = options;
    render();
    return chart;
  };
}
```

For features with non-standard logic (e.g., `withPoints` skips options entirely, `withCustom` handles null callback specially), the generated wrapper is overridden explicitly after the loop.

---

## 5. `getFeatureFlags` Replacement

```ts
// Replaces the hand-written getFeatureFlags function
const getFeatureFlags = <T,>(state: ChartState<T>): FeatureFlags => {
  const flags = {} as FeatureFlags;
  for (const feature of FEATURE_REGISTRY) {
    (flags as Record<string, boolean>)[feature.flagKey] = state[feature.flagKey];
  }
  return flags;
};
```

Static analysis: TypeScript confirms all `flagKey` values are valid keys of `FeatureFlags` because the registry is const-typed.

---

## 6. `clearOptionalNodes` Replacement

```ts
const clearSelectors = FEATURE_REGISTRY.flatMap((f) => f.clearSelectors);
// e.g. ["g.x-axis, g.y-axis, text.x-axis-label, text.y-axis-label",
//        "line.grid-x, line.grid-y", "g.point-series", ...]
```

---

## 7. Migration Skeleton (per feature)

### axes

1. Create `axesDef: FeatureDefinition<"axes">` in `featureRegistry.mts`
2. Move `areAxesOptionsEqual` import from `optionComparators.mts` into `axesDef.isEqual`
3. Move the axes render block (`chartRender:178–209`) into `axesDef.render`
4. Move the zoom-path axes block (`chartRender:282–296`) into `axesDef.onZoomRedraw`
5. Delete axes from `optionComparators.mts`
6. `withAxes` becomes a generated wrapper (or explicit 3-line override if logic differs)

### grid

1. Create `gridDef: FeatureDefinition<"grid">` in `featureRegistry.mts`
2. Move `areGridOptionsEqual` into `gridDef.isEqual`
3. Move `chartRender:211–224` into `gridDef.render`
4. Move `chartRender:299–312` into `gridDef.onZoomRedraw`
5. Delete `areGridOptionsEqual` from `optionComparators.mts`

### points

1. Create `pointsDef: FeatureDefinition<"points">` — `isEqual` unused, options always `null`
2. Move `chartRender:226–234` into `pointsDef.render`
3. Move `chartRender:326–334` into `pointsDef.onZoomRedraw`
4. `withPoints` is a special case: no options parameter, sets flag directly

### title

1. Create `titleDef: FeatureDefinition<"title">` — `render` only (no `onZoomRedraw`)
2. Move `areTitleOptionsEqual` into `titleDef.isEqual`
3. Move `chartRender:251–257` into `titleDef.render`
4. Delete `areTitleOptionsEqual` from `optionComparators.mts`

### legend

1. Create `legendDef: FeatureDefinition<"legend">` — `render` only
2. Move `areLegendOptionsEqual` into `legendDef.isEqual`
3. Move `chartRender:259–272` into `legendDef.render`
4. Delete `areLegendOptionsEqual` from `optionComparators.mts`

### tooltip

1. Create `tooltipDef: FeatureDefinition<"tooltip">` — `render` only
2. Move `areTooltipOptionsEqual` into `tooltipDef.isEqual`
3. Move `chartRender:236–249` into `tooltipDef.render`
4. Delete `areTooltipOptionsEqual` from `optionComparators.mts`

### zoomPan

1. Create `zoomPanDef: FeatureDefinition<"zoomPan">`
2. Move `areZoomPanOptionsEqual` into `zoomPanDef.isEqual`
3. Move `chartRender:274–342` — `zoomPanDef.render` constructs the zoom behavior
4. `zoomPanDef.onZoomRedraw` is the **zoom callback body** that conditionally calls other features' `onZoomRedraw`
5. Delete `areZoomPanOptionsEqual` from `optionComparators.mts`

### custom

1. Create `customDef: FeatureDefinition<"custom">`
2. `customDef.render` calls `customCallback` and captures `customCleanup`
3. `customDef.isEqual` compares by reference identity
4. `customDef.onZoomRedraw` omitted (custom excluded from zoom path)

### visibleSeries

**Not a registry feature.** Migration steps:
1. `updateVisibleSeries` / `withVisibleSeries` remain as direct methods on `ChartInstance`
2. They call `state.zoomBehavior?.reset()` directly
3. They should probably be extracted to a helper but do not belong in the registry

---

## 8. Risks

### Zoom-path exclusions

The zoom callback body is constructed inside `zoomPanDef.onZoomRedraw` and explicitly excludes title, legend, tooltip, and custom. This is load-bearing behavior — the design must preserve it. Any future feature added to the registry with `onZoomRedraw` will automatically be included in the zoom re-render, which is correct for axes/grid/points/line but wrong for the intentionally excluded features.

**Mitigation**: Document clearly that `onZoomRedraw` means "participates in zoom path". The four excluded features must explicitly omit it.

### Comparator subtleties

- **axes**: `areAxesOptionsEqual` compares `xTickCount`, `xTickFormat`, `yTickCount`, `yTickFormat`. This is a 4-field shallow equality. Correct for the intended use case (re-render when ticks change).
- **legend**: `areLegendOptionsEqual` has null handling — `previous: null | WithLegendOptions` vs `next: WithLegendOptions`. The comparator returns `false` when `previous` is null (meaning "no prior options"). This is correct for the `with*` pattern where the initial call always has different prior state.
- **title**: `areTitleOptionsEqual` takes `previous: null | WithTitleOptions`. Correct.
- **zoomPan**: only compares `onZoom` callback by identity — intentional, as function identity is the only stable change detector.

### Public typing concerns

- `ChartInstance<T>` interface in `chartTypes.mts` lists all `with*` methods explicitly. When the registry generates these dynamically, the static interface still needs to list them. This is fine — the interface is the public contract, the registry is an internal implementation detail.
- `FeatureOptions` discriminated union typing requires TypeScript 5.0+ for reliable discriminated union inference. The project uses TypeScript 5.x (per `tsconfig.json`).

---

## 9. Characterization Suite Load-Bearing Cases (Grid Prototype)

The following characterization tests were verified as **load-bearing** during the grid prototype validation (i.e., they would fail if grid rendering or cleanup behavior changed):

- `src/chart/createChart.test.mts` — tests using `.withGrid()` to enable grid rendering; asserts grid lines appear in DOM
- `src/chart/chartRender.test.mts` — tests using `hasGrid` flag; asserts correct conditional rendering
- `src/chart/chartLifecycle.test.mts` — tests `clearOptionalNodes` with `hasGrid: false`; asserts `line.grid-x` and `line.grid-y` are removed

These tests stay green with the registry prototype, proving behavior preservation.

---

## 10. Recommendation

**RECOMMENDATION: PROCEED**

The registry design is sound and the grid prototype validates the approach. The pattern is consistent with the existing `CURVE_PRESETS` mini-registry already in the codebase. Key evidence:

1. All 8 features share the same 5-step `with*` method shape — the registry eliminates duplication
2. The zoom-path exclusion for title/legend/tooltip/custom is explicitly encoded by omitting `onZoomRedraw`
3. `getFeatureFlags` and `clearOptionalNodes` become simple derived computations from the registry
4. The characterization suite stays green with grid migrated (proves behavior preservation)
5. TypeScript typing does not degenerate — the discriminated union approach works without `any`

**Estimated effort**: ~1 commit per feature × 8 features = approximately 8 commits for full migration. Each commit must keep the characterization suite green. A future build plan should specify the per-feature migration order.

**Next step**: Create a numbered build plan for the full migration, following the per-feature commit strategy above.
