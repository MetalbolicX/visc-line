import { curveCatmullRom } from "d3";
import { chartConfig, type DataRecord } from "./data.mjs";
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
// @ts-ignore: allow runtime import even if index.mjs doesn't export these names
import { defaultTheme, mergeTheme, applyThemeCssVars } from "../src/index.mjs";

const MARGINS = { top: 50, right: 60, bottom: 70, left: 55 };
const LEGEND_WIDTH = 90;
const LEGEND_TOP_OFFSET = 12;

const { data: rawData, xSerie, ySeries } = chartConfig;

// Data processing is pure — run once, outside the render cycle.
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
  // Create and apply a lightweight theme override (CSS variables)
  // const customTheme = mergeTheme(defaultTheme, {
  //   colors: {
  //     palette: ["#E24A33", "#348ABD", "#988ED5"],
  //     background: "#fafafa",
  //   },
  //   line: { strokeWidth: 10, curve: "monotoneX" },
  //   axis: { fontSize: 13 },
  //   points: { radius: 2 },
  // });
  // applyThemeCssVars(container, customTheme);

  // SVG structure is stable across renders — create once.
  const svg = renderSVG(container, { background: "#fafafa" });
  const bounds = renderBoundsGroup(svg, MARGINS);

  const render = (): void => {
    const dims = getDimensions(container, MARGINS);
    const { xDomain, yDomain } = getMultiSeriesExtents(
      processedSeries,
      xSerie.accessor,
    );
    const { xScale, yScale } = createScales({
      xDomain,
      yDomain,
      innerWidth: dims.innerWidth,
      innerHeight: dims.innerHeight,
      xType: "time",
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
        items: processedSeries.map(({ label, stroke }) => ({
          label,
          color: stroke,
        })),
        x: MARGINS.left + dims.innerWidth - LEGEND_WIDTH,
        y: MARGINS.top + LEGEND_TOP_OFFSET,
        fontSize: 12,
        swatchSize: 12,
        gap: 6,
      });

    // Interactivity
    addTooltip<DataRecord>(
      bounds,
      processedSeries,
      xScale,
      yScale,
      xSerie.accessor,
      {
        innerWidth: dims.innerWidth,
        innerHeight: dims.innerHeight,
      },
    );

    addZoomPan(svg, {
      xScale,
      yScale,
      innerWidth: dims.innerWidth,
      innerHeight: dims.innerHeight,
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
