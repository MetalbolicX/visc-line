"use strict";

/**
 * Render or update a centered x-axis label inside the provided SVG container.
 *
 * Selects or creates a single <text> element with class "x-axis-label", centers it
 * horizontally within the inner plotting width and positions it below the plotting area.
 *
 * @param {import('d3-selection').Selection<SVGSVGElement|SVGGElement, unknown, null, undefined>} svg - D3 selection of the SVG or group element to render into.
 * @param {Object} [options={}] - Configuration options.
 * @param {number} options.innerWidth - Inner width of the plotting area (excluding margins).
 * @param {number} options.innerHeight - Inner height of the plotting area (excluding margins).
 * @param {{top:number,right:number,bottom:number,left:number}} options.margins - Chart margins.
 * @param {string} [options.label=""] - Text for the x-axis label.
 * @param {number} [options.fontSize=12] - Font size (pixels) for the label.
 * @returns {import('d3-selection').Selection<SVGTextElement, unknown, null, undefined>} The D3 selection for the axis label text element.
 */
export const renderXAxisLabel = (
  svg,
  { innerWidth, innerHeight, margins, label, fontSize = 12 } = {},
) =>
  svg
    .selectAll("text.x-axis-label")
    .data([null])
    .join("text")
    .attr("class", "x-axis-label")
    .attr("x", margins.left + innerWidth / 2)
    .attr("y", margins.top + innerHeight + 40)
    .attr("text-anchor", "middle")
    .attr("font-size", fontSize)
    .attr("fill", "#333")
    .text(label || "");

/**
 * Render or update a vertical Y-axis label inside the provided SVG using D3.
 *
 * Appends/updates a single <text> element with class "y-axis-label", positions it to the left
 * of the chart area (based on margins and inner dimensions), rotates it -90°, centers the text,
 * applies font size and fill, and sets the label content.
 *
 * @param {import("d3-selection").Selection<SVGGElement|SVGSVGElement, any, any, any>} svg - D3 selection of the SVG or container group.
 * @param {Object} [options] - Configuration options.
 * @param {number} options.innerWidth - Inner width of the chart area.
 * @param {number} options.innerHeight - Inner height of the chart area.
 * @param {{left:number,top:number}} options.margins - Margins object (expects at least `left` and `top`).
 * @param {string} [options.label=""] - Text to display as the Y-axis label.
 * @param {number} [options.fontSize=12] - Font size in pixels.
 * @returns {import("d3-selection").Selection<SVGTextElement, unknown, null, undefined>} The d3 selection for the y-axis label text element.
 */
export const renderYAxisLabel = (
  svg,
  { innerWidth, innerHeight, margins, label, fontSize = 12 } = {},
) =>
  svg
    .selectAll("text.y-axis-label")
    .data([null])
    .join("text")
    .attr("class", "y-axis-label")
    .attr(
      "transform",
      `translate(${margins.left - 40},${margins.top + innerHeight / 2}) rotate(-90)`,
    )
    .attr("text-anchor", "middle")
    .attr("font-size", fontSize)
    .attr("fill", "#333")
    .text(label || "");
