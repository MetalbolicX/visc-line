"use strict";
import { line, select } from "d3";

/**
 * Render multiple line series into a bounds group.
 *
 * Binds the series array using each item's `label` as the D3 key, producing one
 * <path.chart-line> per series. On enter the line is drawn with a stroke-dashoffset
 * animation. On update the path transitions to the new geometry. Exiting paths are removed.
 *
 * @param {import('d3-selection').Selection} boundsGroup
 * @param {Array<{label: string, stroke: string, accessor: Function, data: Array}>} series
 *   Processed series array — each item must have `.data` (filtered rows) and `.accessor` (y-accessor).
 * @param {Function} xScale
 * @param {Function} yScale
 * @param {Function} xAccessor  Shared x-accessor applied to every series row.
 * @param {Object}  [options]
 * @param {number}  [options.strokeWidth=2]
 * @param {number}  [options.transitionDuration=1000]
 */
export const renderLine = (
  boundsGroup,
  series,
  xScale,
  yScale,
  xAccessor,
  { strokeWidth = 2, transitionDuration = 1000 } = {},
) => {
  const buildPath = (serie) =>
    line()
      .x((d) => xScale(xAccessor(d)))
      .y((d) => yScale(serie.accessor(d)))(serie.data);

  return boundsGroup
    .selectAll("path.chart-line")
    .data(series, (d) => d.label)
    .join(
      (enter) =>
        enter
          .append("path")
          .attr("class", (d) => `chart-line chart-line--${d.label}`)
          .attr("fill", "none")
          .attr("stroke", (d) => d.stroke ?? "steelblue")
          .attr("stroke-width", (d) => d.strokeWidth ?? strokeWidth)
          .attr("stroke-linejoin", "round")
          .attr("stroke-linecap", "round")
          .attr("d", (d) => buildPath(d))
          .each(function () {
            const path = select(this);
            const totalLength = this.getTotalLength();
            path
              .attr("stroke-dasharray", totalLength)
              .attr("stroke-dashoffset", totalLength)
              .transition()
              .duration(transitionDuration)
              .attr("stroke-dashoffset", 0);
          }),
      (update) =>
        update.each(function (d) {
          const path = select(this);
          const newPathD = buildPath(d);
          const totalLength = this.getTotalLength();
          path
            .attr("stroke-dasharray", totalLength)
            .attr("stroke-dashoffset", totalLength)
            .transition()
            .duration(transitionDuration)
            .attr("d", newPathD)
            .attr("stroke", d.stroke ?? "steelblue")
            .attr("stroke-dashoffset", 0);
        }),
      (exit) => exit.remove(),
    );
};