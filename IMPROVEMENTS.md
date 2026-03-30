# Remaining Improvement Opportunities

| #   | File                            | Issue                                                                                                                          | Severity |
| --- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | -------- |
| 1   | `src/utils/scales.mts`          | `??` fallback on exhaustive `Record<ScaleType, …>` is unreachable dead code                                                    | Low      |
| 2   | `src/utils/scales.mts`          | `as unknown as AnyScale` double-cast after `.nice()` — should be narrowed or cast directly                                     | Medium   |
| 3   | `src/interactivity/zoomPan.mts` | `as never` cast in `rescaleX`/`rescaleY` calls — type safety hole, can silently break with non-continuous scales               | **High** |
| 6   | `src/main.mts`                  | `render()` rebuilds the entire DOM on every resize — static elements (title, axis labels, legend) should be initialised once   | Medium   |
| 7   | `src/main.mts`                  | `processedSeries` is re-computed inside `render()` on every resize even though the source data never changes — move it outside | Medium   |
| 8   | `src/main.mts`                  | Magic numbers `- 90` and `12` in legend position arithmetic have no name or explanation                                        | Low      |

## Details

### #1 — Dead `??` fallback (`scales.mts` lines 52, 61)

```ts
// xType is ScaleType | undefined; SCALE_FACTORIES is Record<ScaleType, …>
(SCALE_FACTORIES[xType] ?? SCALE_FACTORIES.linear)(...)
```

`Record<ScaleType, F>` guarantees every key is present, so `SCALE_FACTORIES[xType]`
can never be `undefined` and the `??` branch is unreachable. Replace with an explicit
conditional:

```ts
const factory = xType ? SCALE_FACTORIES[xType] : SCALE_FACTORIES.linear;
const xScale = factory(xExp).domain(...).range(...).nice() as AnyScale;
```

---

### #2 — `as unknown as AnyScale` double-cast (`scales.mts` lines 58, 67)

```ts
.nice() as unknown as AnyScale
```

`AnyScale` is a union of D3 continuous-scale types. All of them are structurally
assignment-compatible with each other at the `Selection`/accessor level, so the
`unknown` intermediary is not needed. Replace with a direct cast:

```ts
.nice() as AnyScale
```

If TypeScript rejects the direct cast, the real fix is to widen `AnyScale` with a
shared minimal interface (`.domain()`, `.range()`, `.nice()`) rather than escaping
through `unknown`.

---

### #3 — `as never` cast (`zoomPan.mts` lines 46–47)

```ts
t.rescaleX(xScale as never) as unknown as AnyScale,
t.rescaleY(yScale as never) as unknown as AnyScale,
```

`as never` is the most dangerous TypeScript cast — it suppresses all type checking
by asserting the value is the unreachable bottom type. `ZoomTransform.rescaleX`
expects `ScaleContinuousNumeric<number, number>`. Since `AnyScale` includes
`d3.ScaleTime` (which is continuous-numeric), the correct fix is to narrow the
scale type before calling rescale, or constrain the `AddZoomPanOptions` generics so
only continuous scales are accepted:

```ts
import type { ScaleContinuousNumeric } from "d3";

// Option A: narrow at call site
t.rescaleX(xScale as ScaleContinuousNumeric<number, number>) as AnyScale,

// Option B: constrain the interface
interface AddZoomPanOptions {
  xScale: ScaleContinuousNumeric<number, number>;
  yScale: ScaleContinuousNumeric<number, number>;
  ...
}
```

---

### #6 — Full DOM rebuild on every resize (`main.mts`)

The `render()` function (line 57) re-creates every SVG element on each
`ResizeObserver` tick, including elements whose content never changes (title,
axis labels, legend).

Split into two phases:

```ts
// Run once
const { svg, bounds } = initChart(container);
renderTitle(svg, ...);
renderXAxisLabel(svg, ...);
renderYAxisLabel(svg, ...);
renderLegend(svg, ...);
addTooltip(...);

// Run on every resize
const update = () => {
  const dims = getDimensions(container, MARGINS);
  const { xScale, yScale } = createScales(...);
  renderXAxis(bounds, xScale, dims.innerHeight);
  renderYAxis(bounds, yScale);
  renderLine(...);
  renderPoints(...);
};

update();
observeResize(container, update);
```

Alternatively, the existing D3 enter/update/exit pattern inside each `render*`
function already handles idempotent re-calls, so at minimum the static calls can
simply be moved outside `render()` at module level.

---

### #7 — `processedSeries` recomputed on every resize (`main.mts` line 30)

```ts
const render = (): void => {
  const processedSeries = processAllSeries<DataRecord>(...); // ← runs on every resize
  ...
};
```

`rawData` and `ySeries` are constant after module initialisation. Move the call
outside `render()`:

```ts
const { data: rawData, xSerie, ySeries } = chartConfig;
const processedSeries = processAllSeries<DataRecord>(rawData, xSerie.accessor, ySeries);

const render = (): void => { ... };
```

---

### #8 — Magic numbers in legend position (`main.mts` lines 107–108)

```ts
x: MARGINS.left + dims.innerWidth - 90,
y: MARGINS.top + 12,
```

The `90` and `12` are unexplained. Name them:

```ts
const LEGEND_WIDTH = 90;
const LEGEND_TOP_OFFSET = 12;

renderLegend(svg, {
  items: ...,
  x: MARGINS.left + dims.innerWidth - LEGEND_WIDTH,
  y: MARGINS.top + LEGEND_TOP_OFFSET,
});
```

## Tasks

- [-] Fix #1
- [-] Fix #2
- [-] Fix #3
- [-] Fix #4
- [-] Fix #5
- [-] Fix #6
- [-] Fix #7
- [-] Fix #8
