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

| Field     | Type                                             | Description                    |
| --------- | ------------------------------------------------ | ------------------------------ |
| `data`    | `readonly T[]`                                   | Raw data array                 |
| `xSerie`  | `{ accessor: (d: T) => unknown; label: string }` | X-axis accessor and axis label |
| `ySeries` | `readonly SeriesDescriptor<T>[]`                 | One entry per line series      |

**`ChartOptions`**

| Field        | Type                                   | Default                                        | Description                                            |
| ------------ | -------------------------------------- | ---------------------------------------------- | ------------------------------------------------------ |
| `ariaLabel`  | `string`                               | `"Interactive line chart"`                     | Accessible label for the chart's root `<svg>` element  |
| `curve`      | `CurvePreset \| CurveFactory`          | `theme.line.curve`                             | Line curve; preset string or D3 factory                |
| `gapPolicy`  | `"break" \| "bridge"`                  | `"break"`                                      | How to render invalid/missing data points (plan 025)  |
| `margins`    | `Margins`                              | `{ top: 50, right: 60, bottom: 70, left: 55 }` | SVG margin box                                         |
| `theme`      | `ThemeOverride`                        | `{}`                                           | Deep-partial theme override merged over `defaultTheme` |
| `xLabel`     | `string`                               | `undefined`                                    | Optional X-axis label text (overrides `xSerie.label`) |
| `xType`      | `"linear" \| "log" \| "pow" \| "time"` | `"time"`                                       | D3 scale type for the x-axis                           |
| `yLabel`     | `string`                               | `undefined`                                    | Optional Y-axis label text                             |

**`ChartInstance<T>`**

| Member                  | Type                                           | Description                                            |
| ----------------------- | ---------------------------------------------- | ------------------------------------------------------ |
| `container`             | `HTMLElement`                                  | The mounted container                                  |
| `svg`                   | `SVGSelection`                                 | D3 selection of the root `<svg>`                       |
| `series`                | `readonly ProcessedSeries<T>[]`                | **Visible** processed series (filtered by visibility)  |
| `allSeries`             | `readonly ProcessedSeries<T>[]`                | All processed series (unfiltered)                      |
| `update(newData)`       | `(readonly T[]) => void`                       | Re-render with new data (preserves visibility)         |
| `updateVisibleSeries(labels)` | `(readonly string[]) => void`            | Change visibility at runtime                           |
| `dispose()`             | `() => void`                                   | Tear down resize observer, enhancements, and listeners |
| `withAnnotations(options)` | `(WithAnnotationsOptions) => ChartInstance<T>` | Enable data-anchored text callouts with optional connectors |
| `withAxes(options?)` | `(WithAxesOptions?) => ChartInstance<T>` | Enable x/y axes and axis labels                    |
| `withCustom(callback)` | `(CustomCallback \| null) => ChartInstance<T>` | Inject custom D3 drawing code (see below)            |
| `withEndLabels(options?)` | `(WithEndLabelsOptions?) => ChartInstance<T>` | Enable direct labels at series ends                   |
| `withGrid(options?)` | `(WithGridOptions?) => ChartInstance<T>` | Enable x/y grid lines                               |
| `withLegend(options?)`  | `(WithLegendOptions?) => ChartInstance<T>`     | Enable legend (optionally interactive)                 |
| `withPoints()`          | `() => ChartInstance<T>`                       | Enable point markers                                   |
| `withReferenceLines(options)` | `(WithReferenceLinesOptions) => ChartInstance<T>` | Enable horizontal/vertical reference lines      |
| `withTitle(options)`    | `(WithTitleOptions) => ChartInstance<T>`       | Enable chart title                                     |
| `withTooltip(options?)` | `(WithTooltipOptions?) => ChartInstance<T>`    | Enable tooltip interactivity                           |
| `withVisibleSeries(labels)` | `(readonly string[]) => ChartInstance<T>`  | Declare which series to show (fluent, creation-time)   |
| `withZoomPan(options?)` | `(WithZoomPanOptions?) => ChartInstance<T>`    | Enable zoom/pan behavior                               |

All fluent methods return `this` for chaining. After `dispose()`, all methods throw.

---

### `withAnnotations` — Data-anchored callouts

Render text callouts anchored to data coordinates with optional leader lines.

```ts
interface ChartAnnotation {
  readonly x: number | Date;       // Data x coordinate
  readonly y: number;               // Data y coordinate
  readonly text: string;            // Annotation text
  readonly dx?: number;            // Horizontal offset (default: 8)
  readonly dy?: number;            // Vertical offset (default: -8)
  readonly showConnector?: boolean; // Draw leader line (default: false)
}
```

**`WithAnnotationsOptions`**

| Field         | Type                        | Default | Description                     |
| ------------- | --------------------------- | ------- | ------------------------------- |
| `annotations` | `readonly ChartAnnotation[]` | `[]`    | Array of annotation definitions |

---

### `withReferenceLines` — Threshold and target lines

Render horizontal or vertical dashed reference lines at data values.

```ts
interface ReferenceLine {
  readonly axis: "x" | "y"; // Line orientation
  readonly value: number | Date; // Domain value to line
  readonly label?: string;    // Optional label text
}
```

**`WithReferenceLinesOptions`**

| Field  | Type                     | Default | Description                |
| ------- | ------------------------ | ------- | -------------------------- |
| `lines` | `readonly ReferenceLine[]` | `[]`    | Array of reference line definitions |

### `withEndLabels(options?)` — direct labels at series ends

Adds a text label at the end of each visible series (anchored at max-x).
For printed/static output this is the Storytelling-with-Data-recommended
alternative to legends.

```ts
interface WithEndLabelsOptions {
  /** Collision policy: "nudge" (default) | "hide" | "legend" */
  readonly collision?: "hide" | "legend" | "nudge";
  /** Format function: (label, lastValue) => string */
  readonly format?: (label: string, lastValue: number) => string;
  /** Horizontal offset in pixels (default: 8) */
  readonly offset?: number;
}
```

**Collision behavior**:

- `"nudge"` (default): pushes overlapping labels apart vertically within bounds;
  unresolvable labels are dropped with one `console.warn` per render.
- `"hide"`: skips overlapping labels silently.
- `"legend"`: if any overlap detected, renders NO labels and warns
  "consider chart.withLegend() instead". The library does not silently
  add a legend.

**Interaction with `withFocus`**: when `withFocus` is active, only the **focused** series receive end labels — dimmed context series lose theirs. This implements the SWD principle "labels mark what to read": if a series is dimmed, its end label would compete for attention with the focused series. Pass `chart.withFocus(null)` to restore all labels.

```ts
// Default: nudge policy
chart.withEndLabels();

// Explicit nudge
chart.withEndLabels({ collision: "nudge" });

// Hide overlapping labels
chart.withEndLabels({ collision: "hide" });

// Legend policy: all-or-nothing
chart.withEndLabels({ collision: "legend" });

// Custom format
chart.withEndLabels({
  format: (label, lastValue) => `${label}: ${lastValue}`
});
```

---

### `withCustom` — The Escape Hatch

`withCustom` gives you raw access to the chart's internal rendering context inside
the render cycle, allowing you to draw anything D3 can produce on top of the chart.

```ts
type CustomCallback = (ctx: CustomContext) => (() => void) | void;
```

```ts
interface CustomContext {
  readonly bounds: BoundsSelection; // <g class="bounds"> — margin-translated origin
  readonly content: BoundsSelection; // <g class="content"> — clipped drawing area
  readonly dims: Dimensions; // Current chart dimensions
  readonly svg: SVGSelection; // Root <svg> element selection
  readonly xScale: AnyScale; // Current x scale
  readonly yScale: AnyScale; // Current y scale
}
```

Return a cleanup function to tear down what you added when the chart disposes or
the callback is replaced by a new `withCustom` call.

---

### `update`

Replace the chart data without rebuilding. The chart re-processes all series and
re-renders every component. The current visibility selection is **preserved**
across updates.

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

## Series Visibility (Controlled State)

`visc-line` provides a **controlled visibility** model: the consumer owns which
series are visible, and the library handles D3 enter/update/exit rendering.

### `withVisibleSeries`

Declarative fluent method — set initial visibility at creation time:

```ts
chart.withVisibleSeries(["Revenue"]);     // show only Revenue
chart.withVisibleSeries(["Revenue", "Cost"]); // show both
chart.withVisibleSeries([]);               // show none (empty chart)
```

Throws `Error` if any label does not match a `ySeries` entry.

### `withFocus`

Highlight one or more series in full strength while dimming all others to a subdued opacity. This implements the "focus the important stuff, eliminate distractions" principle from *Storytelling with Data*:

```ts
chart.withFocus("Revenue");           // focus single series
chart.withFocus(["Revenue", "Cost"]); // focus multiple
chart.withFocus(null);                // clear focus — restore all series
```

**Dim opacity**: controlled by the `focus.dimOpacity` theme token (default `0.25`). Override via the `theme` option:

```ts
createChart(container, config, {
  theme: { focus: { dimOpacity: 0.4 } },
});
```

**Interaction with explicit `opacity`**: if a series descriptor has an explicit `opacity` set, focus dimming **overrides** it for non-focused series. The consumer can clear focus with `withFocus(null)` to restore explicit opacity.

**Interaction with legend swatches**: legend swatches always render at full strength — focus dimming affects only the chart lines (and points when enabled). This is a deliberate v1 limitation.

**Interaction with `withEndLabels`**: when both `withFocus` and `withEndLabels` are active, only the **focused** series receive end labels. Dimmed context series have their end labels removed. Clear focus with `withFocus(null)` to restore labels for all visible series.

**Persistence**: focus survives `update()` and `updateVisibleSeries()` re-renders. If `updateVisibleSeries` hides a focused series, focus silently narrows to the visible intersection.

### `updateVisibleSeries`

Change visibility at runtime without rebuilding the chart:

```ts
chart.updateVisibleSeries(["Cost"]);  // switch to Cost only
chart.updateVisibleSeries([]);        // hide all
chart.updateVisibleSeries(allLabels); // show all
```

Throws `Error` if any label is unknown. Resets zoom/pan on toggle.

### `allSeries` property

Returns the complete, unfiltered array of processed series. `series` returns
only the **visible** subset.

### Domain Behavior

| Visible series count | Y-axis domain |
|----------------------|--------------|
| 0                    | Stays at previous domain |
| 1                    | Rescales to that series' extent |
| 2+                   | Uses global extent (all series) |

This prevents visual confusion: when comparing multiple series the axes are
stable; when isolating a single series it uses the full chart area.

### Data Contract

| Topic | Behavior |
|-------|----------|
| **Sorting** | Series data is sorted ascending by x before rendering; input order is not trusted. |
| **Invalid rows** | Rows where x or y is null, undefined, NaN, ±Infinity, or an invalid Date are dropped per series. With `gapPolicy: "break"` (plan 025), only x validity is checked — NaN-y rows are kept and skipped by `line.defined()`. |
| **Date strings** | x values must be `Date` objects or finite numbers. ISO strings like `"2023-01-01"` fail `isValidNumber` and are silently dropped. Construct `new Date("2023-01-01")` explicitly. |
| **Duplicates** | Duplicate x values are kept and rendered in stable sort order. Tooltip tie-breaking among equal x values is unspecified. |
| **Timezone** | Time scales use `d3.scaleTime` (browser-local time). A `new Date("2023-01-01")` is parsed at UTC-midnight per the ES spec but rendered at the local offset — day-boundary labels can shift. `scaleUtc` is not yet supported. |
| **Single-point series** | `extent([v, v])` yields a zero-width domain. The single point maps to the left edge; pad your data or set explicit domains if this matters. |

### Legend Interactivity

The legend is an **event emitter** — it does not mutate chart state. Legend
items are **auto-derived** from `ySeries` by default (using `SeriesDescriptor.label`
and `SeriesDescriptor.stroke` with palette fallback), so you only need to pass
`interactive` and `onToggle`:

```ts
chart.withLegend({
  interactive: true,
  onToggle: (label, isVisible) => {
    // Consumer decides what to do
    chart.updateVisibleSeries(isVisible ? [label] : allLabels);
  },
});
```

To override the auto-derived items (e.g. custom labels or colors), pass `items` explicitly:

```ts
chart.withLegend({
  items: [
    { color: "#e74c3c", label: "Revenue (USD)" },
    { color: "#2ecc71", label: "Cost (USD)" },
  ],
  interactive: true,
});
```

Hidden legend entries are dimmed (opacity 0.45). The `onToggle` callback
receives the label and the *next* visibility state for that label after the click.

---

## Theme

All visual properties are expressed as theme tokens that are written to `--vl-*`
CSS custom properties when `createChart` is called. Pass a `ThemeOverride`
(deep-partial) to `createChart`'s `theme` option to override only the tokens
you need.

```ts
interface Theme {
  accessibility?: { highContrast?: boolean; reducedMotion?: boolean };
  axis: {
    color?: string;
    fontSize: number;
    tickPadding: number;
    tickSize: number;
  };
  colors: {
    axis: string;
    background: string;
    grid: string;
    palette: string[];
    text: string;
  };
  grid: {
    dashArray: string;
    opacity: number;
    stroke: string;
    strokeLinecap: string;
    strokeWidth: number;
  };
  legend: {
    fontSize: number;
    itemSpacing: number;
    position: "bottom" | "left" | "right" | "top";
    symbolSize: number;
  };
  line: { curve: CurvePreset; opacity: number; strokeWidth: number };
  points: {
    fill: string;
    opacity: number;
    radius: number;
    stroke: string;
    strokeWidth: number;
  };
  title: {
    color: string;
    fontSize: number;
    fontWeight: number;
    padding: number;
  };
  tooltip?: {
    background: string;
    border: string;
    borderRadius: number;
    color: string;
    fontSize: number;
    padding: number;
  };
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

| Variable          | Source token        | Description                         |
| ----------------- | ------------------- | ----------------------------------- |
| `--vl-background` | `colors.background` | Chart background fill               |
| `--vl-text`       | `colors.text`       | Default text color                  |
| `--vl-axis-color` | `colors.axis`       | Axis line and tick color            |
| `--vl-grid-color` | `colors.grid`       | Grid line stroke color              |
| `--vl-palette-N`  | `colors.palette[N]` | Per-series stroke color (0-indexed) |

### Axis

| Variable                 | Source token       | Description                                              |
| ------------------------ | ------------------ | -------------------------------------------------------- |
| `--vl-axis-font-size`    | `axis.fontSize`    | Tick label font size (`px` suffix)                       |
| `--vl-axis-tick-size`    | `axis.tickSize`    | Tick mark length (unitless, read via `getComputedStyle`) |
| `--vl-axis-tick-padding` | `axis.tickPadding` | Gap between tick and label (unitless)                    |

### Grid

| Variable                   | Source token         | Description                                 |
| -------------------------- | -------------------- | ------------------------------------------- |
| `--vl-grid-stroke`         | `grid.stroke`        | Grid line color                             |
| `--vl-grid-stroke-width`   | `grid.strokeWidth`   | Grid line width                             |
| `--vl-grid-dash-array`     | `grid.dashArray`     | SVG `stroke-dasharray` value (e.g. `"4 7"`) |
| `--vl-grid-opacity`        | `grid.opacity`       | Grid line opacity (0–1)                     |
| `--vl-grid-stroke-linecap` | `grid.strokeLinecap` | SVG `stroke-linecap` value                  |

### Line

| Variable                 | Source token       | Description                                                   |
| ------------------------ | ------------------ | ------------------------------------------------------------- |
| `--vl-line-stroke-width` | `line.strokeWidth` | Series line stroke width                                      |
| `--vl-line-opacity`      | `line.opacity`     | Series line opacity (overridden per-series via `SeriesStyle`) |

### Points

| Variable                  | Source token         | Description                                       |
| ------------------------- | -------------------- | ------------------------------------------------- |
| `--vl-point-radius`       | `points.radius`      | Point circle radius (read via `getComputedStyle`) |
| `--vl-point-fill`         | `points.fill`        | Point fill color                                  |
| `--vl-point-stroke`       | `points.stroke`      | Point stroke color                                |
| `--vl-point-stroke-width` | `points.strokeWidth` | Point stroke width                                |
| `--vl-point-opacity`      | `points.opacity`     | Point opacity                                     |

### Legend

| Variable                   | Source token         | Description                                                                               |
| -------------------------- | -------------------- | ----------------------------------------------------------------------------------------- |
| `--vl-legend-font-size`    | `legend.fontSize`    | Legend label font size (`px` suffix)                                                      |
| `--vl-legend-item-spacing` | `legend.itemSpacing` | Gap between swatch and label, and between rows (`px` suffix; read via `getComputedStyle`) |
| `--vl-legend-symbol-size`  | `legend.symbolSize`  | Swatch square size (`px` suffix; read via `getComputedStyle`)                             |

### Title

| Variable                 | Source token       | Description                        |
| ------------------------ | ------------------ | ---------------------------------- |
| `--vl-title-font-size`   | `title.fontSize`   | Title font size (`px` suffix)      |
| `--vl-title-font-weight` | `title.fontWeight` | Title font weight                  |
| `--vl-title-color`       | `title.color`      | Title text color                   |
| `--vl-title-padding`     | `title.padding`    | Title bottom padding (`px` suffix) |

### Tooltip (optional — only when `theme.tooltip` is provided)

| Variable                     | Source token           | Description                                        |
| ---------------------------- | ---------------------- | -------------------------------------------------- |
| `--vl-tooltip-bg`            | `tooltip.background`   | Tooltip background color                           |
| `--vl-tooltip-border`        | `tooltip.border`       | Tooltip border shorthand (e.g. `"1px solid #ccc"`) |
| `--vl-tooltip-border-radius` | `tooltip.borderRadius` | Tooltip border radius (`px` suffix)                |
| `--vl-tooltip-padding`       | `tooltip.padding`      | Tooltip inner padding (`px` suffix)                |
| `--vl-tooltip-font-size`     | `tooltip.fontSize`     | Tooltip font size (`px` suffix)                    |
| `--vl-tooltip-color`         | `tooltip.color`        | Tooltip text color                                 |

---

## Per-Series Overrides

`SeriesStyle` keys applied on a `SeriesDescriptor` take precedence over the
equivalent theme tokens for that series only.

```ts
interface SeriesStyle {
  opacity?: number; // overrides --vl-line-opacity for this series
  pointFill?: string; // overrides --vl-point-fill
  pointRadius?: number; // overrides --vl-point-radius
  pointStroke?: string; // overrides --vl-point-stroke
  stroke?: string; // overrides --vl-palette-N for this series
  strokeWidth?: number; // overrides --vl-line-stroke-width
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

| Name                  | Kind        | Description                                     |
| --------------------- | ----------- | ----------------------------------------------- |
| `ChartConfig<T>`      | `interface` | Input configuration for `createChart`           |
| `ChartInstance<T>`    | `interface` | Live chart handle returned by `createChart`     |
| `ChartOptions`        | `interface` | Optional rendering options for `createChart`    |
| `ProcessedSeries<T>`  | `interface` | Series descriptor with filtered `data` attached |
| `SeriesDescriptor<T>` | `interface` | Describes a single line series                  |
| `WithLegendOptions`   | `interface` | Options for `withLegend` (optional `items`, `interactive`, `onToggle`) |
| `WithTooltipOptions`  | `interface` | Options for `withTooltip`                       |
| `WithTitleOptions`    | `interface` | Options for `withTitle`                         |
| `WithZoomPanOptions`  | `interface` | Options for `withZoomPan`                       |

### Layout & Scales

| Name              | Kind        | Description                            |
| ----------------- | ----------- | -------------------------------------- |
| `AnyScale`        | `type`      | Union of supported D3 scale instances  |
| `ScaleType`       | `type`      | `"linear" \| "log" \| "pow" \| "time"` |
| `BoundsSelection` | `type`      | D3 selection of a bounds `<g>` element |
| `SVGSelection`    | `type`      | D3 selection of an `<svg>` element     |
| `Dimensions`      | `interface` | Computed outer and inner dimensions    |
| `Margins`         | `interface` | Margin values for the drawing area     |

### Theme & Style

| Name             | Kind        | Description                          |
| ---------------- | ----------- | ------------------------------------ |
| `Theme`          | `interface` | Full theme token object              |
| `ThemeOverride`  | `type`      | Deep-partial theme override          |
| `DeepPartial<T>` | `type`      | Recursive partial type utility       |
| `SeriesStyle`    | `interface` | Per-series visual overrides          |
| `CurvePreset`    | `type`      | Union of 18 supported D3 curve names |

### Custom Hooks

| Name             | Kind        | Description                                     |
| ---------------- | ----------- | ----------------------------------------------- |
| `CustomCallback` | `type`      | User-provided drawing callback for `withCustom` |
| `CustomContext`  | `interface` | Context object passed to `CustomCallback`       |

### Interactivity Options

| Name                 | Kind        | Description               |
| -------------------- | ----------- | ------------------------- |
| `WithTooltipOptions` | `interface` | Options for `withTooltip` |
| `WithZoomPanOptions` | `interface` | Options for `withZoomPan` |

### Legend

| Name         | Kind        | Description           |
| ------------ | ----------- | --------------------- |
| `LegendItem` | `interface` | A single legend entry |

---

## For Advanced Users

If you need access to individual renderers, services, interactivity functions, or
theme utilities (e.g., to compose a custom chart without the builder, or wrap
visc-line in a framework component), import from `visc-line/internal`:

```ts
import { renderLine, renderXAxis, createScales } from "visc-line/internal";
```

> [!Warning] This API surface carries **no stability guarantees**. Functions, signatures, and types exported from `visc-line/internal` may change without a major version bump. Use this module only if you accept coupling to internals. For the stable public API, use `createChart` from `visc-line`.
