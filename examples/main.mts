import { curveCatmullRom } from "d3";

/* eslint-disable @typescript-eslint/no-unsafe-call */
import {
  addTooltip,
  addZoomPan,
  createScales,
  getDimensions,
  getMultiSeriesExtents,
  observeResize,
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
} from "../src/index.mjs";
// Theme utilities (merge defaults and write CSS variables)
// The theme utilities may not be re-exported from `src/index.mjs` yet.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { applyThemeCssVars, defaultTheme, mergeTheme } from "../src/index.mjs";
import { chartConfig, type DataRecord } from "./data.mjs";

/** Chart margins used to compute inner drawing area. */
const margins = { bottom: 70, left: 55, right: 60, top: 50 };
/** Width reserved for the legend panel in pixels. */
const legendWidth = 90;
/** Vertical offset for the legend from the top margin. */
const legendTopOffset = 12;

/** Destructure the example chart configuration for use in rendering. */
const { data: rawData, xSerie, ySeries } = chartConfig;

// Data processing is pure — run once, outside the render cycle.
/** Process and validate raw data into processed series ready for rendering. */
const processedSeries = processAllSeries<DataRecord>(
  rawData,
  xSerie.accessor,
  ySeries,
);

/**
 * Initialize and render a multi-series Cartesian line chart inside the given container.
 *
 * Sets up dimensions and scales, renders static SVG structure (background, bounds),
 * draws axes, lines and points for each series, attaches title/labels/legend, and
 * wires interactivity (tooltip, zoom & pan). Also observes the container for resize
 * events and re-renders on change.
 *
 * @param container - DOM element to mount the chart into.
 *
 * @remarks
 * The `onZoom` handler updates axes and re-renders lines/points with the new scales.
 *
 * @example
 * ```ts
 * import { main } from './main.js';
 * const container = document.querySelector('#chart') as HTMLElement;
 * main(container);
 * ```
 */
export const main = (container: HTMLElement): void => {
  const svg = renderSVG(container, { background: "#fafafa" });
  const bounds = renderBoundsGroup(svg, margins);
  const render = (): void => {
    const dims = getDimensions(container, margins);
    const { xDomain, yDomain } = getMultiSeriesExtents(
      processedSeries,
      xSerie.accessor,
    );
    const { xScale, yScale } = createScales({
      innerHeight: dims.innerHeight,
      innerWidth: dims.innerWidth,
      xDomain,
      xType: "time",
      yDomain,
    });

    // Axes
    bounds
      .call(renderXAxis, xScale, dims.innerHeight)
      .call(renderYAxis, yScale);

    // Visuals
    renderLine<DataRecord>(
      bounds,
      processedSeries,
      xScale,
      yScale,
      xSerie.accessor,
      {
        curve: curveCatmullRom,
      },
    );
    renderPoints<DataRecord>(
      bounds,
      processedSeries,
      xScale,
      yScale,
      xSerie.accessor,
    );

    // Gridlines
    bounds.call(renderXGrid, xScale, yScale).call(renderYGrid, xScale, yScale);

    // Labels, title, legend
    svg
      .call(renderTitle, { ...dims, title: "Revenue & Cost Over Time" })
      .call(renderXAxisLabel, { ...dims, label: xSerie.label })
      .call(renderYAxisLabel, { ...dims, label: "Value" })
      .call(renderLegend, {
        fontSize: 12,
        gap: 6,
        items: processedSeries.map(({ label, stroke }) => ({
          color: stroke,
          label,
        })),
        swatchSize: 12,
        x: margins.left + dims.innerWidth - legendWidth,
        y: margins.top + legendTopOffset,
      });

    // Interactivity
    addTooltip<DataRecord>(
      bounds,
      processedSeries,
      xScale,
      yScale,
      xSerie.accessor,
      {
        innerHeight: dims.innerHeight,
        innerWidth: dims.innerWidth,
      },
    );

    addZoomPan(svg, {
      innerHeight: dims.innerHeight,
      innerWidth: dims.innerWidth,
      /**
       *
       */
      onZoom: (newX, newY) => {
        renderXAxis(bounds, newX, dims.innerHeight);
        renderYAxis(bounds, newY);
        renderLine<DataRecord>(
          bounds,
          processedSeries,
          newX,
          newY,
          xSerie.accessor,
          {
            curve: curveCatmullRom,
          },
        );
        renderPoints<DataRecord>(
          bounds,
          processedSeries,
          newX,
          newY,
          xSerie.accessor,
        );
      },
      xScale,
      yScale,
    });
  };

  // Optional: per-series override — make first series thicker and red
  // if (processedSeries && processedSeries.length > 0) {
  //   processedSeries[0].stroke = "#d62728";
  //   (processedSeries[0] as any).strokeWidth = 4;
  // }

  render();
  observeResize(container, render);
};
