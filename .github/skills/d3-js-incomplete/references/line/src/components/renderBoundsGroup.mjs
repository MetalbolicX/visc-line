"use strict";

/**
 * Ensures a single SVG group element with class "bounds" exists and positions it using the provided margins.
 * Creates the group if missing or reuses the existing one via a data join, and applies a translate transform
 * using margins.left and margins.top.
 *
 * @param {import("d3-selection").Selection} svg - D3 selection of the SVG (or container) to append/select the group in.
 * @param {{top:number, right:number, bottom:number, left:number}} margins - Margin object used to compute the translation.
 * @returns {import("d3-selection").Selection} The D3 selection representing the bounds group.
 */
export const renderBoundsGroup = (svg, margins) =>
  svg
    .selectAll("g.bounds")
    .data([null])
    .join("g")
    .attr("class", "bounds")
    .attr("transform", `translate(${margins.left},${margins.top})`);
