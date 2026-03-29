"use strict";

/**
 * Render and update X and Y axis labels.
 *
 * Exports two helpers used as D3-style callables:
 * - `renderXAxisLabel(svg, { innerWidth, innerHeight, margins, label, fontSize })`
 * - `renderYAxisLabel(svg, { innerWidth, innerHeight, margins, label, fontSize })`
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
