"use strict";
import { select } from "d3";

/**
 * Renders (creates or updates) a single SVG element inside the given container using D3.
 *
 * Ensures exactly one <svg> is bound to the container, sets its width and height
 * to the container's clientWidth and clientHeight, applies the provided background
 * color, and sets overflow to "visible".
 *
 * @param {HTMLElement} container - The DOM element that will contain the SVG.
 * @param {Object} [options] - Optional configuration.
 * @param {string} [options.background="white"] - Background color for the SVG.
 * @returns {Object} D3 selection for the created or updated <svg> element.
 */
export const renderSVG = (container, { background = "white" } = {}) =>
  select(container)
    .selectAll("svg")
    .data([null])
    .join("svg")
    .attr("width", container.clientWidth)
    .attr("height", container.clientHeight)
    .style("background", background)
    .style("overflow", "visible");
