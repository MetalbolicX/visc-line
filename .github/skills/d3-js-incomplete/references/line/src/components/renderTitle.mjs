"use strict";

/**
 * Render or update a centered chart title inside the provided SVG selection.
 *
 * @param {d3.Selection} svg - D3 selection of the SVG container.
 * @param {Object} options - Configuration options.
 * @param {number} options.width - Total chart width (including margins).
 * @param {{left:number,right:number,top:number,bottom?:number}} options.margins - Chart margins.
 * @param {string} options.title - Title text to display.
 * @param {number} [options.fontSize=16] - Font size for the title.
 * @param {string} [options.fill="#222"] - Fill color for the title text.
 * @param {string|number} [options.fontWeight="bold"] - Font weight for the title.
 * @returns {d3.Selection} D3 selection containing the created or updated title text element.
 */
export const renderTitle = (
  svg,
  { width, margins, title, fontSize = 16, fill = "#222", fontWeight = "bold" },
) =>
  svg
    .selectAll("text.chart-title")
    .data([null])
    .join("text")
    .attr("class", "chart-title")
    .attr("x", margins.left + (width - margins.left - margins.right) / 2)
    .attr("y", margins.top / 2)
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "middle")
    .attr("font-size", fontSize)
    .attr("font-weight", fontWeight)
    .attr("fill", fill)
    .text(title);
