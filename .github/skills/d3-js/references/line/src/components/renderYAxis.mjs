"use strict";
import { axisLeft } from "d3";

/**
 * Render a left Y axis into a provided bounds group using the given D3 scale.
 *
 * Creates or updates a single <g> element with class "y-axis" under the provided
 * boundsGroup and invokes a D3 left-axis generator configured with the provided
 * scale, tick count, and optional tick formatter.
 *
 * @param {import('d3-selection').Selection<SVGGElement, any, HTMLElement, any>} boundsGroup
 *   D3 selection of the container group where the axis will be rendered. The function
 *   will select or create a single child <g> element with class "y-axis".
 * @param {import('d3-scale').ScaleContinuousNumeric<number, number> |
 *         import('d3-scale').ScaleTime<number, number> |
 *         import('d3-scale').ScaleBand<any>} yScale
 *   D3 scale used to generate the axis (e.g., scaleLinear, scaleTime, scaleBand).
 * @param {Object} [options]
 *   Optional configuration object.
 * @param {number} [options.tickCount=5]
 *   Approximate number of ticks to request from the axis generator.
 * @param {(d: any, i: number) => string} [options.tickFormat]
 *   Optional tick formatting function passed to the axis generator.
 *
 * @returns {void}
 */
export const renderYAxis = (
  boundsGroup,
  yScale,
  { tickCount = 5, tickFormat } = {},
) => {
  const axis = axisLeft(yScale).ticks(tickCount);
  if (tickFormat) axis.tickFormat(tickFormat);

  boundsGroup
    .selectAll("g.y-axis")
    .data([null])
    .join("g")
    .attr("class", "y-axis")
    .call(axis);
};
