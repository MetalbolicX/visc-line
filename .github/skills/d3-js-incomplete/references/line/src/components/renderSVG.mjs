"use strict";
import { select } from "d3";

/**
 * Ensure a single SVG element exists inside the given container and initialize its size and styles.
 *
 * Uses d3 to select/join a single <svg> (binds a single datum) within the provided container,
 * sets the SVG's width and height from container.clientWidth/clientHeight, applies the given
 * background color, and sets overflow to "visible".
 *
 * @param {HTMLElement} container - DOM element that will contain the SVG (must expose clientWidth/clientHeight).
 * @param {Object} [options] - Optional configuration object.
 * @param {string} [options.background='white'] - CSS background color for the SVG container.
 * @returns {import('d3-selection').Selection<SVGSVGElement, unknown, null, undefined>} D3 selection of the created or joined <svg> element.
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
