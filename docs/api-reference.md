# API Reference

This page documents the core functions, types, and CSS custom properties exposed by visc-line.

---

## High-Level API

### `createChart`

The recommended entry point. Mounts a fully-featured line chart into a container element, manages resize observation, and returns an update/dispose handle.

```ts
createChart<T>(
  container: HTMLElement,
  config: ChartConfig<T>,
  options?: ChartOptions,
): ChartInstance<T>
```

**`ChartConfig<T>`**

| Field | Type | Description |
|---|---|---|
| `data` | `readonly T[]` | Raw data array |
| `xSerie` | `{ accessor: (d: T) => Date \| number; label: string }` | X-axis accessor and axis label |
| `ySeries` | `readonly SeriesDescriptor<T>[]` | One entry per line series |

**`ChartOptions`**

| Field | Type | Default | Description |
|---|---|---|---|
| `curve` | `CurvePreset \| CurveFactory` | `theme.line.curve` | Line curve; preset string or D3 factory |
| `margins` | `Margins` | `{ top: 50, right: 60, bottom: 70, left: 55 }` | SVG margin box |
| `theme` | `ThemeOverride` | `{}` | Deep-partial theme override merged over `defaultTheme` |
| `xType` | `"linear" \| "log" \| "pow" \| "time"` | `"time"` | D3 scale type for the x-axis |

**`ChartInstance<T>`**

| Member | Type | Description |
|---|---|---|
| `container` | `HTMLElement` | The mounted container |
| `svg` | `SVGSelection` | D3 selection of the root `<svg>` |
| `series` | `readonly ProcessedSeries<T>[]` | Current processed series snapshot |
| `update(newData)` | `(readonly T[]) => void` | Re-render with new data |
| `dispose()` | `() => void` | Tear down resize observer |

---

## Theme

### `Theme`

All visual properties are expressed as theme tokens that are written to `--vl-*` CSS custom properties before rendering. Pass a `ThemeOverride` (deep-partial) to `createChart` to override only the tokens you need.

```ts
interface Theme {
  accessibility?: { highContrast?: boolean; reducedMotion?: boolean };
  axis:    { color?: string; fontSize: number; tickPadding: number; tickSize: number };
  colors:  { axis: string; background: string; grid: string; palette: string[]; text: string };
  grid:    { dashArray: string; opacity: number; stroke: string; strokeLinecap: string; strokeWidth: number };
  legend:  { fontSize: number; itemSpacing: number; position: "bottom"|"left"|"right"|"top"; symbolSize: number };
  line:    { curve: CurvePreset; opacity: number; strokeWidth: number };
  points:  { fill: string; opacity: number; radius: number; stroke: string; strokeWidth: number };
  title:   { color: string; fontSize: number; fontWeight: number; padding: number };
  tooltip?: { background: string; border: string; borderRadius: number; color: string; fontSize: number; padding: number };
}
```

### `defaultTheme`

The built-in default. Every chart falls back to these values unless overridden.

```ts
import { defaultTheme } from "visc-line";
```

### `mergeTheme`

Deep-merges a partial override on top of a base theme.

```ts
mergeTheme(base: Theme, override?: ThemeOverride): Theme
```

---

## CSS Custom Properties

`applyThemeCssVars` writes the following variables onto the chart container. Override them with CSS after the chart is mounted, or supply a `ThemeOverride` to `createChart`.

### Colors

| Variable | Source token | Description |
|---|---|---|
| `--vl-background` | `colors.background` | Chart background fill |
| `--vl-text` | `colors.text` | Default text color |
| `--vl-axis-color` | `colors.axis` | Axis line and tick color |
| `--vl-grid-color` | `colors.grid` | Grid line stroke color |
| `--vl-palette-N` | `colors.palette[N]` | Per-series stroke color (0-indexed) |

### Axis

| Variable | Source token | Description |
|---|---|---|
| `--vl-axis-font-size` | `axis.fontSize` | Tick label font size (`px` suffix) |
| `--vl-axis-tick-size` | `axis.tickSize` | Tick mark length (unitless, read via `getComputedStyle`) |
| `--vl-axis-tick-padding` | `axis.tickPadding` | Gap between tick and label (unitless) |

### Grid

| Variable | Source token | Description |
|---|---|---|
| `--vl-grid-stroke` | `grid.stroke` | Grid line color |
| `--vl-grid-stroke-width` | `grid.strokeWidth` | Grid line width |
| `--vl-grid-dash-array` | `grid.dashArray` | SVG `stroke-dasharray` value (e.g. `"4 7"`) |
| `--vl-grid-opacity` | `grid.opacity` | Grid line opacity (0–1) |
| `--vl-grid-stroke-linecap` | `grid.strokeLinecap` | SVG `stroke-linecap` value |

### Line

| Variable | Source token | Description |
|---|---|---|
| `--vl-line-stroke-width` | `line.strokeWidth` | Series line stroke width |
| `--vl-line-opacity` | `line.opacity` | Series line opacity (overridden per-series via `SeriesStyle`) |

### Points

| Variable | Source token | Description |
|---|---|---|
| `--vl-point-radius` | `points.radius` | Point circle radius (read via `getComputedStyle`) |
| `--vl-point-fill` | `points.fill` | Point fill color |
| `--vl-point-stroke` | `points.stroke` | Point stroke color |
| `--vl-point-stroke-width` | `points.strokeWidth` | Point stroke width |
| `--vl-point-opacity` | `points.opacity` | Point opacity |

### Legend

| Variable | Source token | Description |
|---|---|---|
| `--vl-legend-font-size` | `legend.fontSize` | Legend label font size (`px` suffix) |
| `--vl-legend-item-spacing` | `legend.itemSpacing` | Gap between swatch and label, and between rows (`px` suffix; read via `getComputedStyle`) |
| `--vl-legend-symbol-size` | `legend.symbolSize` | Swatch square size (`px` suffix; read via `getComputedStyle`) |

### Title

| Variable | Source token | Description |
|---|---|---|
| `--vl-title-font-size` | `title.fontSize` | Title font size (`px` suffix) |
| `--vl-title-font-weight` | `title.fontWeight` | Title font weight |
| `--vl-title-color` | `title.color` | Title text color |
| `--vl-title-padding` | `title.padding` | Title bottom padding (`px` suffix) |

### Tooltip (optional — only written when `theme.tooltip` is defined)

| Variable | Source token | Description |
|---|---|---|
| `--vl-tooltip-bg` | `tooltip.background` | Tooltip background color |
| `--vl-tooltip-border` | `tooltip.border` | Tooltip border shorthand (e.g. `"1px solid #ccc"`) |
| `--vl-tooltip-border-radius` | `tooltip.borderRadius` | Tooltip border radius (`px` suffix) |
| `--vl-tooltip-padding` | `tooltip.padding` | Tooltip inner padding (`px` suffix) |
| `--vl-tooltip-font-size` | `tooltip.fontSize` | Tooltip font size (`px` suffix) |
| `--vl-tooltip-color` | `tooltip.color` | Tooltip text color |

---

## Per-Series Overrides

`SeriesStyle` keys applied on a `SeriesDescriptor` take precedence over the equivalent theme tokens for that series only.

```ts
interface SeriesStyle {
  opacity?:      number;  // overrides --vl-line-opacity for this series
  pointFill?:    string;  // overrides --vl-point-fill
  pointRadius?:  number;  // overrides --vl-point-radius
  pointStroke?:  string;  // overrides --vl-point-stroke
  stroke?:       string;  // overrides --vl-palette-N for this series
  strokeWidth?:  number;  // overrides --vl-line-stroke-width
}
```

---

## Curve Utilities

### `CurvePreset`

Union of all 18 supported D3 curve names:

```
"basis" | "basisClosed" | "basisOpen" |
"bumpX" | "bumpY" |
"cardinal" | "cardinalClosed" | "cardinalOpen" |
"catmullRom" | "catmullRomClosed" | "catmullRomOpen" |
"linear" | "monotoneX" | "monotoneY" | "natural" |
"step" | "stepAfter" | "stepBefore"
```

### `CURVE_PRESETS`

Immutable map from every `CurvePreset` string to its D3 `CurveFactory`. Useful for enumerating valid names or resolving presets independently.

```ts
const CURVE_PRESETS: Readonly<Record<CurvePreset, CurveFactory>>;
```

### `resolveCurve`

Resolves a `CurvePreset` string to a `CurveFactory`, or passes a factory through unchanged. Throws an `Error` for unknown string inputs.

```ts
resolveCurve(input: CurveFactory | CurvePreset): CurveFactory
```

---

## Theme Utilities

### `applyThemeCssVars`

Writes all theme tokens as `--vl-*` CSS custom properties onto a root element. Called automatically by `createChart`; call manually when using individual renderers.

```ts
applyThemeCssVars(root: HTMLElement, theme: Theme): void
```

---

## Low-Level Renderers

All renderers are idempotent — they select existing DOM nodes before appending, so calling them multiple times on the same container is safe.

> **Styling**: all visual attributes reference `var(--vl-*)` CSS variables. Call `applyThemeCssVars` on the container before calling any renderer.

### `renderSVG`

Creates or selects the root `<svg>` element inside the container.

```ts
renderSVG(container: HTMLElement): SVGSelection
```

### `renderBoundsGroup`

Creates or selects the `<g class="bounds">` translated by the margin box.

```ts
renderBoundsGroup(svg: SVGSelection, margins: Margins): BoundsSelection
```

### `renderContentGroup`

Creates or selects the `<g class="content">` clip-path layer inside bounds. Must be called on every render cycle (dimensions may change).

```ts
renderContentGroup(
  bounds: BoundsSelection,
  svg: SVGSelection,
  dims: { innerWidth: number; innerHeight: number },
): ContentSelection
```

### `renderLine`

Renders animated line paths for each series.

```ts
renderLine<T>(
  content: ContentSelection,
  series: readonly ProcessedSeries<T>[],
  xScale: AnyScale,
  yScale: AnyScale,
  xAccessor: (d: T) => Date | number,
  options?: { curve?: CurveFactory; reducedMotion?: boolean; transitionDuration?: number },
): void
```

### `renderPoints`

Renders optional data-point circles for each series.

```ts
renderPoints<T>(
  content: ContentSelection,
  series: readonly ProcessedSeries<T>[],
  xScale: AnyScale,
  yScale: AnyScale,
  xAccessor: (d: T) => Date | number,
): void
```

### `renderXAxis` / `renderYAxis`

Render D3 axes. Tick size and padding are read from `--vl-axis-tick-size` / `--vl-axis-tick-padding` via `getComputedStyle`.

```ts
renderXAxis(bounds: BoundsSelection, xScale: AnyScale, innerHeight: number): void
renderYAxis(bounds: BoundsSelection, yScale: AnyScale): void
```

### `renderXAxisLabel` / `renderYAxisLabel`

Render axis label text elements.

```ts
renderXAxisLabel(svg: SVGSelection, opts: { label: string; innerHeight: number; innerWidth: number; margins: Margins }): void
renderYAxisLabel(svg: SVGSelection, opts: { label: string; innerHeight: number; innerWidth: number; margins: Margins }): void
```

### `renderXGrid` / `renderYGrid`

Render dashed grid lines behind the chart content.

```ts
renderXGrid(content: ContentSelection, xScale: AnyScale, yScale: AnyScale): void
renderYGrid(content: ContentSelection, xScale: AnyScale, yScale: AnyScale): void
```

### `renderTitle`

Renders a chart title above the SVG.

```ts
renderTitle(svg: SVGSelection, title: string, innerWidth: number): void
```

---

## Interactivity

### `addTooltip`

Attaches a hover tooltip powered by tipviz to the bounds group.

```ts
addTooltip<T>(
  bounds: BoundsSelection,
  series: readonly ProcessedSeries<T>[],
  xScale: AnyScale,
  yScale: AnyScale,
  xAccessor: (d: T) => Date | number,
  dims: { innerWidth: number; innerHeight: number },
  options?: { formatX?: (x: Date | number) => string; stylesheetUrl?: string },
): void
```

### `addZoomPan`

Attaches D3 zoom/pan behavior and returns the augmented zoom instance (with a `.reset()` helper).

```ts
addZoomPan(opts: {
  innerHeight: number;
  innerWidth: number;
  onZoom: (newX: AnyScale, newY: AnyScale) => void;
  xScale: AnyScale;
  yScale: AnyScale;
}): ZoomBehaviorWithReset
```
