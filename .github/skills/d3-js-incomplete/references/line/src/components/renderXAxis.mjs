"use strict";
import { axisBottom } from "d3";

/**
 * Render an X axis inside the provided bounds group using a D3 axis generator.
 *
 * Creates or updates a child <g> element with class "x-axis", positions it at
 * y = innerHeight, and calls a D3 bottom axis constructed from the given scale.
 *
 * @param {import('d3-selection').Selection<SVGGElement, any, any, any>} boundsGroup - D3 selection of the container group for the axis.
 * @param {import('d3-scale').ScaleContinuousNumeric|import('d3-scale').ScaleTime|import('d3-scale').ScaleBand} xScale - D3 scale used to generate axis ticks.
 * @param {number} innerHeight - Vertical offset (pixels) to position the x-axis.
 * @param {Object} [options] - Optional configuration.
 * @param {number} [options.tickCount=5] - Number of ticks requested from the axis generator.
 * @param {function(*): string} [options.tickFormat] - Optional tick formatting function for tick labels.
 * @returns {void}
 */
export const renderXAxis = (
  boundsGroup,
  xScale,
  innerHeight,
  { tickCount = 5, tickFormat } = {},
) => {
  const axis = axisBottom(xScale).ticks(tickCount);
  if (tickFormat) axis.tickFormat(tickFormat);

  boundsGroup
    .selectAll("g.x-axis")
    .data([null])
    .join("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0,${innerHeight})`)
    .call(axis);
};
