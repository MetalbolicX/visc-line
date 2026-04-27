# API Reference

This page documents the stable public API exported from `visc-line`.

---

## High-Level API

### `createChart`

The recommended entry point. Mounts a base line chart into a container element,
manages resize observation, and returns a fluent handle with `with*` methods
to opt into optional features.

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
| `xSerie` | `{ accessor: (d: T) => unknown; label: string }` | X-axis accessor and axis label |
| `ySeries` | `readonly SeriesDescriptor<T>[]` | One entry per line series |

**`ChartOptions`**

| Field | Type | Default | Description |
|---|---|---|---|
| `curve` | `CurvePreset \| CurveFactory` | `theme.line.curve` | Line curve; preset string or D3 factory |
| `margins` | `Margins` | `{ top: 50, right: 60, bottom: 70, left: 55 }` | SVG margin box |
| `theme` | `ThemeOverride` | `{}` | Deep-partial theme override merged over `defaultTheme` |
| `xType` | `"linear" \| "log" \| "pow" \| "time"` | `"time"` | D3 scale type for the x-axis |
| `yLabel` | `string` | `undefined` | Optional Y-axis label text |

**`ChartInstance<T>`**

| Member | Type | Description |
|---|---|---|
| `container` | `HTMLElement` | The mounted container |
| `svg` | `SVGSelection` | D3 selection of the root `<svg>` |
| `series` | `readonly ProcessedSeries<T>[]` | Current processed series snapshot |
| `update(newData)` | `(readonly T[]) => void` | Re-render with new data |
| `dispose()` | `() => void` | Tear down resize observer, enhancements, and listeners |
| `withAxes()` | `() => ChartInstance<T>` | Enable x/y axes and axis labels |
| `withCustom(callback)` | `(CustomCallback \| null) => ChartInstance<T>` | Inject custom D3 drawing code (see below) |
| `withGrid()` | `() => ChartInstance<T>` | Enable x/y grid lines |
| `withLegend(options)` | `(WithLegendOptions) => ChartInstance<T>` | Enable legend |
| `withPoints()` | `() => ChartInstance<T>` | Enable point markers |
| `withTitle(options)` | `(WithTitleOptions) => ChartInstance<T>` | Enable chart title |
| `withTooltip(options?)` | `(WithTooltipOptions?) => ChartInstance<T>` | Enable tooltip interactivity |
| `withZoomPan(options?)` | `(WithZoomPanOptions?) => ChartInstance<T>` | Enable zoom/pan behavior |

All fluent methods return `this` for chaining. After `dispose()`, all methods throw.

---

### `withCustom` — The Escape Hatch

`withCustom` gives you raw access to the chart's internal rendering context inside
the render cycle, allowing you to draw anything D3 can produce on top of the chart.

```ts
type CustomCallback = (ctx: CustomContext) => (() => void) | void
```

```ts
interface CustomContext {
  readonly bounds: BoundsSelection;   // <g class="bounds"> — margin-translated origin
  readonly content: BoundsSelection;  // <g class="content"> — clipped drawing area
  readonly dims: Dimensions;          // Current chart dimensions
  readonly svg: SVGSelection;         // Root <svg> element selection
  readonly xScale: AnyScale;          // Current x scale
  readonly yScale: AnyScale;          // Current y scale
}
```

Return a cleanup function to tear down what you added when the chart disposes or
the callback is replaced by a new `withCustom` call.

---

### `update`

Replace the chart data without rebuilding. The chart re-processes all series and
re-renders every component.

```ts
chart.update(newData);
```

---

### `dispose`

Clean up all resources: resize observer, tooltip DOM elements, zoom behavior,
and custom callback cleanup.

```ts
chart.dispose();
```

---

## Theme

All visual properties are expressed as theme tokens that are written to `--vl-*`
CSS custom properties when `createChart` is called. Pass a `ThemeOverride`
(deep-partial) to `createChart`'s `theme` option to override only the tokens
you need.

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

Example: inspect the default palette colors or override a specific token via
the `theme` option in `createChart`.

---

## CSS Custom Properties

`createChart` writes the following CSS custom properties onto the chart container.
Override them with CSS after the chart is mounted, or supply a `ThemeOverride`
to `createChart`.

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

### Tooltip (optional — only when `theme.tooltip` is provided)

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

`SeriesStyle` keys applied on a `SeriesDescriptor` take precedence over the
equivalent theme tokens for that series only.

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

Immutable map from every `CurvePreset` string to its D3 `CurveFactory`.
Useful for enumerating valid names or resolving presets independently.

```ts
const CURVE_PRESETS: Readonly<Record<CurvePreset, CurveFactory>>;
```

### `resolveCurve`

Resolves a `CurvePreset` string to a `CurveFactory`, or passes a factory through
unchanged. Throws an `Error` for unknown string inputs.

```ts
resolveCurve(input: CurveFactory | CurvePreset): CurveFactory
```

---

## Public Types Reference

Exported type aliases and interfaces available from `visc-line`.

### Chart & Data

| Name | Kind | Description |
|---|---|---|
| `ChartConfig<T>` | `interface` | Input configuration for `createChart` |
| `ChartInstance<T>` | `interface` | Live chart handle returned by `createChart` |
| `ChartOptions` | `interface` | Optional rendering options for `createChart` |
| `ProcessedSeries<T>` | `interface` | Series descriptor with filtered `data` attached |
| `SeriesDescriptor<T>` | `interface` | Describes a single line series |
| `WithTooltipOptions` | `interface` | Options for `withTooltip` |
| `WithTitleOptions` | `interface` | Options for `withTitle` |
| `WithLegendOptions` | `interface` | Options for `withLegend` |
| `WithZoomPanOptions` | `interface` | Options for `withZoomPan` |

### Layout & Scales

| Name | Kind | Description |
|---|---|---|
| `AnyScale` | `type` | Union of supported D3 scale instances |
| `ScaleType` | `type` | `"linear" \| "log" \| "pow" \| "time"` |
| `BoundsSelection` | `type` | D3 selection of a bounds `<g>` element |
| `SVGSelection` | `type` | D3 selection of an `<svg>` element |
| `Dimensions` | `interface` | Computed outer and inner dimensions |
| `Margins` | `interface` | Margin values for the drawing area |

### Theme & Style

| Name | Kind | Description |
|---|---|---|
| `Theme` | `interface` | Full theme token object |
| `ThemeOverride` | `type` | Deep-partial theme override |
| `DeepPartial<T>` | `type` | Recursive partial type utility |
| `SeriesStyle` | `interface` | Per-series visual overrides |
| `CurvePreset` | `type` | Union of 18 supported D3 curve names |

### Custom Hooks

| Name | Kind | Description |
|---|---|---|
| `CustomCallback` | `type` | User-provided drawing callback for `withCustom` |
| `CustomContext` | `interface` | Context object passed to `CustomCallback` |

### Interactivity Options

| Name | Kind | Description |
|---|---|---|
| `WithTooltipOptions` | `interface` | Options for `withTooltip` |
| `WithZoomPanOptions` | `interface` | Options for `withZoomPan` |

### Legend

| Name | Kind | Description |
|---|---|---|
| `LegendItem` | `interface` | A single legend entry |

---

## For Advanced Users

If you need access to individual renderers, services, interactivity functions, or
theme utilities (e.g., to compose a custom chart without the builder, or wrap
visc-line in a framework component), import from `visc-line/internal`:

```ts
import { renderLine, renderXAxis, createScales } from "visc-line/internal";
```

> **Warning**: This API surface carries **no stability guarantees**. Functions,
> signatures, and types exported from `visc-line/internal` may change without a
> major version bump. Use this module only if you accept coupling to internals.
> For the stable public API, use `createChart` from `visc-line`.
