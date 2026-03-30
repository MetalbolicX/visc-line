"use strict";

/**
 * Render or update a vertical legend inside the given D3 SVG selection.
 *
 * Creates/updates a single "g.legend" group translated to (x, y). For each
 * item in options.items it creates/updates a "g.legend-entry" row containing
 * a "rect.swatch" (filled with item.color) and a "text.legend-label" (showing
 * item.label). Rows are stacked vertically using swatchSize + gap as row height.
 *
 * @param {import("d3-selection").Selection<SVGGElement|SVGSVGElement, any, null, undefined>} svg
 *   D3 selection of an SVG container or group where the legend will be rendered.
 * @param {Object} options - Legend configuration options.
 * @param {Array<LegendItem>} options.items - Array of legend entries.
 * @param {number} [options.x=0] - X translation of the legend group.
 * @param {number} [options.y=0] - Y translation of the legend group.
 * @param {number} [options.fontSize=12] - Font size in pixels for the labels.
 * @param {number} [options.swatchSize=12] - Width and height in pixels for the color swatch.
 * @param {number} [options.gap=6] - Gap in pixels between swatch and label and between rows.
 *
 * @typedef {Object} LegendItem
 * @property {string} label - Text label for the legend entry.
 * @property {string} color - CSS color used to fill the swatch.
 *
 * @returns {void} Mutates the provided SVG selection by creating/updating legend DOM elements.
 */
export const renderLegend = (
  svg,
  { items, x = 0, y = 0, fontSize = 12, swatchSize = 12, gap = 6 },
) => {
  const legendGroup = svg
    .selectAll("g.legend")
    .data([null])
    .join("g")
    .attr("class", "legend")
    .attr("transform", `translate(${x},${y})`);

  const rowHeight = swatchSize + gap;

  const entries = legendGroup
    .selectAll("g.legend-entry")
    .data(items)
    .join("g")
    .attr("class", "legend-entry")
    .attr("transform", (_, i) => `translate(0,${i * rowHeight})`);

  entries
    .selectAll("rect.swatch")
    .data((d) => [d])
    .join("rect")
    .attr("class", "swatch")
    .attr("width", swatchSize)
    .attr("height", swatchSize)
    .attr("rx", 2)
    .attr("fill", (d) => d.color);

  entries
    .selectAll("text.legend-label")
    .data((d) => [d])
    .join("text")
    .attr("class", "legend-label")
    .attr("x", swatchSize + gap)
    .attr("y", swatchSize / 2)
    .attr("dominant-baseline", "middle")
    .attr("font-size", fontSize)
    .attr("fill", "#333")
    .text((d) => d.label);
};
