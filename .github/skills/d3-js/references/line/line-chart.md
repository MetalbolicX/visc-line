# Architecture for D3 Line Chart Reference Implementation

## Overview

- **Purpose**: The `*.mjs` modules implement a small, modular D3-powered multi-series Cartesian line chart.
- **High level**: `src/main.mjs` is the orchestration entry point; it uses `chartConfig` from `src/data.mjs`, utility helpers from `src/utils/*.mjs`, rendering helpers from `src/components/*.mjs`, and interactivity from `src/interactivity/*.mjs`.

## Directory Layout (only .mjs files)

- [main.mjs](src/main.mjs): Entry point. Exports `main(container)` which composes dimensions, scales, renders SVG structure, axes, lines/points, title/labels/legend, and wires interactivity + resize handling.
- [data.mjs](src/data.mjs): Example dataset and `chartConfig` (contains `data`, `xSerie`, and `ySeries` descriptors including accessor functions and labels).
- utils folder (helpers)
  - [index.mjs](src/utils/index.mjs): Re-exports the util modules.
  - [dataUtils.mjs](src/utils/dataUtils.mjs): For data processing. It computes domains and sanitizes numeric data.
  - [layout.mjs](src/utils/layout.mjs): Computes width/height and inner drawing area.
  - [responsiveness.mjs](src/utils/responsiveness.mjs): Resize handling.
  - [scales.mjs](src/utils/scales.mjs): Applies the factory pattern for creating scales.

- components folder (presentational render helpers)
  - [index.mjs](src/components/index.mjs): Re-exports component renderers.
  - [renderSVG.mjs](src/components/renderSVG.mjs): Ensure single `<svg>` exists and set size/background.
  - [renderBoundsGroup.mjs](src/components/renderBoundsGroup.mjs): Create/translate a `g.bounds` group using margins.
  - [renderXAxis.mjs](src/components/renderXAxis.mjs), [renderYAxis.mjs](src/components/renderYAxis.mjs): Axis generators rendering.
  - [renderAxisLabel.mjs](src/components/renderAxisLabel.mjs): X/Y axis label text elements.
  - [renderTitle.mjs](src/components/renderTitle.mjs): Chart title.
  - [renderLegend.mjs](src/components/renderLegend.mjs): Simple stacked legend with swatches.
  - [renderLine.mjs](src/components/renderLine.mjs): Draws per-series `<path>` elements (data-join keyed by `label`), with enter/update transitions and animated stroke-dashoffset.
  - [renderPoints.mjs](src/components/renderPoints.mjs): Two-level join: `g.point-series` per series and `circle.point` per datum (keyed by x accessor).

- interactivity folder (tooltip and zoom/pan)
  - [index.mjs](src/interactivity/index.mjs): Re-exports interactivity helpers.
  - [tooltip.mjs](src/interactivity/tooltip.mjs): Builds tooltip layer, cursor line, per-series dots, and a tooltip box; uses `d3.pointer` + `bisector` to find nearest x.
  - [zoomPan.mjs](src/interactivity/zoomPan.mjs): `addZoomPan(svg, {xScale,yScale,innerWidth,innerHeight,onZoom})` — attaches `d3.zoom`, calls `onZoom` with rescaled axes.

## ASCII folder tree (only .mjs files)

```text
src/
|-- main.mjs
|-- data.mjs
|-- utils/
|   |-- index.mjs
|   |-- dataUtils.mjs
|   |-- layout.mjs
|   |-- responsiveness.mjs
|   \-- scales.mjs
|-- components/
|   |-- index.mjs
|   |-- renderSVG.mjs
|   |-- renderBoundsGroup.mjs
|   |-- renderXAxis.mjs
|   |-- renderYAxis.mjs
|   |-- renderAxisLabel.mjs
|   |-- renderLine.mjs
|   |-- renderPoints.mjs
|   |-- renderLegend.mjs
|   \-- renderTitle.mjs
\-- interactivity/
  |-- index.mjs
  |-- tooltip.mjs
  \-- zoomPan.mjs
```

## Data & Render Flow

- **Source**: `chartConfig` (`src/data.mjs`) provides `rawData`, `xSerie` and `ySeries` descriptors.
- **Processing**: `processAllSeries(rawData, xAccessor, ySeries)` produces `processedSeries` (cleaned arrays per series).
- **Layout & Scales**: `getDimensions()` → compute innerWidth/innerHeight; `getMultiSeriesExtents()` → domains; `createScales()` → `xScale`, `yScale`.
- **Render order (as in `main`)**: `renderSVG` → `renderBoundsGroup` → axes (`renderXAxis`, `renderYAxis`) → visuals (`renderLine`, `renderPoints`) → labels/title/legend → interactivity (`addTooltip`, `addZoomPan`).
- **Reactivity**: `observeResize(container, render)` re-runs the render; zoom handler supplied to `addZoomPan` re-renders axes/lines/points with rescaled scales.

## Design Patterns & Conventions

- **Small single-responsibility modules**: each `.mjs` is a focused helper (renderers, utils, interactivity).
- **Idempotent render helpers**: components use D3 data joins (.data/.join) so functions are safe to call repeatedly.
- **Composition**: `main` composes utilities + components rather than embedding rendering logic inline.
- **Re-exports**: `index.mjs` files group related exports (utils, components, interactivity) for cleaner imports.
- **D3 idioms**: keys by `label`, two-level joins for grouped points, `bisector`/`pointer` for tooltip lookup, `d3.zoom` for pan/zoom.

## Extensibility & Notes

- **Add a series**: extend `ySeries` in `src/data.mjs` (with accessor/label/stroke) — `processAllSeries` and renderers handle new series automatically.
- **Swap scale types**: pass different `xType`/`yType` to `createScales` (the factory supports `time`, `linear`, `pow`, `log`).
- **Avoiding circular deps**: modules are one-directional: `main` imports utils/components/interactivity. Renderers accept selections and data; they should not import `main`.
- **Where to look first**: for overall behavior read `src/main.mjs`, then `src/utils/*` (scale/layout/data), then `src/components/*` and `src/interactivity/*` for UI behavior.

## Quick map (exports to look for)

- `src/main.mjs`: `main(container)`
- `src/data.mjs`: `data`, `chartConfig`
- `src/utils/dataUtils.mjs`: `processAllSeries`, `getMultiSeriesExtents`
- `src/utils/scales.mjs`: `createScales`
- `src/components/*`: `renderSVG`, `renderBoundsGroup`, `renderXAxis`, `renderYAxis`, `renderLine`, `renderPoints`, `renderTitle`, `renderLegend`, `renderXAxisLabel`, `renderYAxisLabel`
- `src/interactivity/*`: `addTooltip`, `addZoomPan`
