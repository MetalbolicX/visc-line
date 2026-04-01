# visc-line

<div align="center">
  <img src="./images/logo.png" alt="visc-line Logo" width="200" height="200" />
</div>

A small, composable D3-based line chart renderer written in TypeScript.

**Supported Versions:** >= 7.9.0

## 🚀 Quick Installation

Install from npm or your package manager of choice:

```sh
npm install visc-line
# or
pnpm add visc-line
```

## Basic Usage

Use the example `main` to mount a chart into an existing container — the example shows the recommended integration pattern. The runnable example is at [examples/main.mts](examples/main.mts).

From a local development HTML page (ES module):

```html
<div id="chart" style="width:800px;height:400px"></div>
<script type="module">
  import { main } from "./examples/main.mts";

  const container = document.getElementById("chart");
  if (container) main(container);
</script>
```

You can also import helpers directly (useful for embedding in apps or building custom renderers):

```js
import {
  addTooltip,
  addZoomPan,
  createScales,
  processAllSeries,
  renderBoundsGroup,
  renderLegend,
  renderLine,
  renderPoints,
  renderSVG,
  renderTitle,
  renderXAxis,
  renderXAxisLabel,
  renderXGrid,
  renderYAxis,
  renderYAxisLabel,
  renderYGrid,
} from "visc-line";
```

## API / Source Reference

Below are the primary modules and exported helpers in `visc-line` package. Use these as a quick reference — each item links to the source implementation.

### Chart Components

`visc-line` provides a set of composable rendering helpers for building line charts. These are designed to be flexible and can be used together or independently as needed.

- `renderSVG`: Create/update the root `<svg>` element.
- `renderBoundsGroup`: Create/update the `<g class="bounds">` group translated by margins.
- `renderLegend`: Compact legend renderer.
- `renderLine`: Draw/update animated series lines (supports custom curves).
- `renderPoints`: Draw per-series point circles.
- `renderTitle`: Centered chart title.
- `renderXAxis` and `renderYAxis`: X and Y Axis generators using D3 axes.
- `renderXAxisLabel` and `renderYAxisLabel`: Axis label helpers.
- `renderXGrid` and `renderYGrid`: Soft gridline renderers.

### Layout Helpers

Layout helpers for computing dimensions and creating scales:

- `getDimensions`: Compute inner chart dimensions from container size and margins.
- `createScales`: Create configured D3 scales (linear, pow, log, time) for x/y axes.

### Data Processing

Data wrangling helpers for preparing raw data for rendering:

- `processNumericData`: Filter records to keep only those with numeric x/y values.
- `processAllSeries`: Attach processed data arrays to series descriptors.
- `getMultiSeriesExtents`: Compute combined x/y domains for multiple series.

### Interactivity

The most basic interactivity layer for line charts is tooltips and zoom/pan. `visc-line` provides helpers to add these features:

- `addTooltip`: Attach a cursor + tooltip layer powered by `tipviz` [web component](https://github.com/MetalbolicX/tipviz).
- `addZoomPan`: Attach pan & zoom behavior; returns an augmented zoom with `reset`.

## Examples

Look at the runnable example under [examples/main.mts](examples/main.mts) which uses [examples/data.mts](examples/data.mts) for sample data and demonstrates the recommended render flow:

1. Get a data set (e.g. from a fetch or local import).
2. Process raw data with `processAllSeries`
3. Compute `xDomain`/`yDomain` with `getMultiSeriesExtents`
4. Build `xScale`/`yScale` with `createScales`
5. Apply renderers in this order:
   1. `renderSVG`.
   2. `renderBoundsGroup`.
   3. `renderLine`.
   4. `renderPoints` (optional).
   5. `renderTitle` (optional).
   6. `renderXAxis` and `renderYAxis` (optional).
   7. `renderXAxisLabel` and `renderYAxisLabel` (optional).
   8. `renderXGrid` and `renderYGrid` (optional).
6. Add interactivity via `addTooltip` and `addZoomPan` for dynamic charts.

## Development

Run the dev server and build using the included scripts (requires Node.js and pnpm/npm):

```sh
pnpm install
pnpm dev
```

## Contributing

Contributions are welcome. Please open issues or submit pull requests.

## License

Released under [MIT](/LICENSE) by [@MetalbolicX](https://github.com/MetalbolicX).
