"use strict";
import { select } from "d3";

/**
 * Render scatter points for multiple series using a two-level join.
 *
 * Level 1: one <g.point-series> per series, keyed by `label`.
 * Level 2: one <circle.point> per data row within each series group.
 * The y-accessor is scoped per series via the `.each()` closure –
 * no parent-node DOM traversal needed.
 *
 * @param {import('d3-selection').Selection} boundsGroup
 * @param {Array<{label: string, stroke: string, accessor: Function, data: Array}>} series
 * @param {Function} xScale
 * @param {Function} yScale
 * @param {Function} xAccessor  Shared x-accessor used as the point key function.
 * @param {Object}  [options]
 * @param {number}  [options.radius=4]
 * @param {string}  [options.stroke='white']       Point border colour.
 * @param {number}  [options.strokeWidth=1.5]
 * @param {number}  [options.opacity=0.85]
 */
export const renderPoints = (
  boundsGroup,
  series,
  xScale,
  yScale,
  xAccessor,
  { radius = 4, stroke = "white", strokeWidth = 1.5, opacity = 0.85 } = {},
) =>
  boundsGroup
    .selectAll("g.point-series")
    .data(series, (d) => d.label)
    .join("g")
    .attr("class", (d) => `point-series point-series--${d.label}`)
    .each(function (serie) {
      select(this)
        .selectAll("circle.point")
        .data(serie.data, xAccessor)
        .join("circle")
        .attr("class", "point")
        .attr("cx", (d) => xScale(xAccessor(d)))
        .attr("cy", (d) => yScale(serie.accessor(d)))
        .attr("r", radius)
        .attr("fill", serie.stroke ?? "steelblue")
        .attr("stroke", stroke)
        .attr("stroke-width", strokeWidth)
        .attr("opacity", opacity);
    });
