"use strict";
import { chartConfig } from "./data.mjs";
import {
  createScales,
  getDimensions,
  getMultiSeriesExtents,
  observeResize,
  processAllSeries,
} from "./utils/index.mjs";
import {
  renderBoundsGroup,
  renderLegend,
  renderLine,
  renderPoints,
  renderSVG,
  renderTitle,
  renderXAxis,
  renderXAxisLabel,
  renderYAxis,
  renderYAxisLabel,
} from "./components/index.mjs";
import { addTooltip, addZoomPan } from "./interactivity/index.mjs";

const MARGINS = { top: 50, right: 60, bottom: 70, left: 55 };

const { data: rawData, xSerie, ySeries } = chartConfig;

// Data processing is pure — run once, outside the render cycle.
const processedSeries = processAllSeries(rawData, xSerie.accessor, ySeries);

/**
 * Initialize and render a multi-series Cartesian line chart inside the given container.
 *
 * Sets up dimensions and scales, renders static SVG structure (background, bounds),
 * draws axes, lines and points for each series, attaches title/labels/legend, and
 * wires interactivity (tooltip, zoom & pan). Also observes the container for resize
 * events and re-renders on change.
 *
 * @param {HTMLElement|SVGElement} container - DOM element to mount the chart into.
 * @returns {void}
 *
 * @remarks
 * - Expects utilities and constants such as getDimensions, MARGINS, getMultiSeriesExtents,
 *   createScales, renderSVG, renderBoundsGroup, renderXAxis, renderYAxis, renderLine,
 *   renderPoints, renderTitle, renderXAxisLabel, renderYAxisLabel, renderLegend,
 *   addTooltip, addZoomPan, and observeResize to be available in scope.
 * - The onZoom handler updates axes and re-renders lines/points with the new scales.
 *
 * @example
 * // Mount chart
 * import { main } from './line/main.mjs';
 * const container = document.querySelector('#chart');
 * main(container);
 *
 * @note Regarding circular dependencies:
 * Based on this snippet, renderLine is invoked as a standalone render helper and there
 * is no evidence of a circular dependency between main and renderLine. A circular
 * dependency would only occur if renderLine (or a module it imports) directly imported
 * or referenced main (or another module that imports it). Ensure renderLine is a
 * self-contained renderer (not importing main) to avoid circular imports.
 */
export const main = (container) => {
  const render = () => {
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

    // Static structure
    const svg = renderSVG(container, { background: "#fafafa" });
    const bounds = renderBoundsGroup(svg, MARGINS);

    // Axes
    bounds
      .call(renderXAxis, xScale, dims.innerHeight)
      .call(renderYAxis, yScale, dims.innerWidth);

    // Visuals
    bounds
      .call(renderLine, processedSeries, xScale, yScale, xSerie.accessor)
      .call(renderPoints, processedSeries, xScale, yScale, xSerie.accessor);

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
        x: MARGINS.left + dims.innerWidth - 90,
        y: MARGINS.top + 12,
        fontSize: 12,
        swatchSize: 12,
        gap: 6,
      });

    // Interactivity
    bounds.call(addTooltip, processedSeries, xScale, yScale, xSerie.accessor, {
      innerWidth: dims.innerWidth,
      innerHeight: dims.innerHeight,
    });

    svg.call(addZoomPan, {
      xScale,
      yScale,
      innerWidth: dims.innerWidth,
      innerHeight: dims.innerHeight,
      onZoom: (newX, newY) => {
        bounds
          .call(renderXAxis, newX, dims.innerHeight)
          .call(renderYAxis, newY, dims.innerWidth);
        bounds
          .call(renderLine, processedSeries, newX, newY, xSerie.accessor)
          .call(renderPoints, processedSeries, newX, newY, xSerie.accessor);
      },
    });
  };

  render();
  observeResize(container, render);
};
