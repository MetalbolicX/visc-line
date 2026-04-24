/* eslint-disable @typescript-eslint/no-unsafe-call */
import {
  addTooltip,
  addZoomPan,
  applyThemeCssVars,
  createScales,
  defaultTheme,
  getDimensions,
  getMultiSeriesExtents,
  mergeTheme,
  observeResize,
  processAllSeries,
  renderBoundsGroup,
  renderContentGroup,
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
 */
export const main = (container: HTMLElement): void => {
  // Apply a theme with a custom background; all other visual properties come from
  // CSS custom properties written by applyThemeCssVars.
  const theme = mergeTheme(defaultTheme, {
    colors: { background: "#fafafa" },
    line: { curve: "catmullRom" },
  });
  applyThemeCssVars(container, theme);

  const svg = renderSVG(container);
  const bounds = renderBoundsGroup(svg, margins);

  const render = (): void => {
    const dims = getDimensions(container, margins);
    const content = renderContentGroup(bounds, svg, {
      innerHeight: dims.innerHeight,
      innerWidth: dims.innerWidth,
    });
    const { xDomain, yDomain } = getMultiSeriesExtents(
      processedSeries,
      xSerie.accessor,
    );
    const { xScale, yScale } = createScales({
      innerHeight: dims.innerHeight,
      innerWidth: dims.innerWidth,
      xDomain: xDomain as Parameters<typeof createScales>[0]["xDomain"],
      xType: "time",
      yDomain,
    });

    // Axes
    bounds
      .call(renderXAxis, xScale, dims.innerHeight)
      .call(renderYAxis, yScale);

    // Gridlines — rendered into the clipped content group
    content.call(renderXGrid, xScale, yScale).call(renderYGrid, xScale, yScale);

    // Lines and points — also clipped
    renderLine<DataRecord>(
      content,
      processedSeries,
      xScale,
      yScale,
      xSerie.accessor,
      { curve: "catmullRom" },
    );
    renderPoints<DataRecord>(
      content,
      processedSeries,
      xScale,
      yScale,
      xSerie.accessor,
    );

    // Labels, title, legend
    svg
      .call(renderTitle, { margins: dims.margins, title: "Revenue & Cost Over Time", width: dims.width })
      .call(renderXAxisLabel, { ...dims, label: xSerie.label })
      .call(renderYAxisLabel, { ...dims, label: "Value" })
      .call(renderLegend, {
        items: processedSeries.map(({ label, stroke }) => ({
          color: stroke ?? "steelblue",
          label,
        })),
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
          content,
          processedSeries,
          newX,
          newY,
          xSerie.accessor,
          { curve: "catmullRom" },
        );
        renderPoints<DataRecord>(
          content,
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

  render();
  observeResize(container, render);
};
