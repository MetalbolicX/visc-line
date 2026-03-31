# visc-line

<div align="center">
  <img src="./images/logo.png" alt="visc-line Logo" width="200" height="200" />
</div>

A small, composable D3-based line chart renderer written in modern ES modules.

**Supported Versions:** >= 7.9.0

## 🚀 Quick Installation

Install from npm or your package manager of choice:

```sh
npm install visc-line
# or
pnpm add visc-line
```

## Basic Usage

Use the library's entry `main` to mount a chart into an existing container. The implementation used below is the source entry: [src/main.mts](src/main.mts).

From a local development HTML page (ES module):

```html
<div id="chart" style="width:800px;height:400px"></div>
<script type="module">
  import { main } from "./src/main.mts";

  const container = document.getElementById("chart");
  if (container) main(container);
</script>
```

If you're using the published package (bundled by your app):

```js
import { main } from "visc-line";

const container = document.getElementById("chart");
if (container) main(container);
```

The `main` function signature is `main(container: HTMLElement): void` and the example used here is implemented in [src/main.mts](src/main.mts).

## API / Source Reference

Core entry points and helper groups live in the `src/` folder. Use these files as a quick reference to the available renderers and utilities:

- **Main entry:** [src/main.mts](src/main.mts) — bootstraps rendering and wiring of interactivity.
- **Data & config:** [src/data.mts](src/data.mts) — example data and chart configuration.
- **Components:** [src/components/index.mts](src/components/index.mts) — `renderSVG`, `renderBoundsGroup`, `renderLegend`, `renderLine`, `renderPoints`, `renderTitle`, `renderXAxis`, `renderYAxis`, etc.
- **Utilities:** [src/utils/index.mts](src/utils/index.mts) — `createScales`, `getDimensions`, `getMultiSeriesExtents`, `processAllSeries`, `observeResize`, and helpers.
- **Interactivity:** [src/interactivity/index.mts](src/interactivity/index.mts) — `addTooltip`, `addZoomPan`.
- **Types:** [src/types/index.mts](src/types/index.mts) — shared TypeScript types used across the library.

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
